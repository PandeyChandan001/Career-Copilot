import { NextResponse } from 'next/server';
import { generateGapAnalysis, getApiKey, detectJobDomain, generateNeutralBullet } from '@/services/aiService';
import { saveAnalysisRecord } from '@/services/historyService';
import { checkRateLimit } from '@/lib/rateLimit';
import { auth, currentUser } from '@clerk/nextjs/server';
import { sanitizeResumeText } from '@/lib/sanitizer';
import { calculateDeterministicMatch } from '@/lib/scoring';

export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rateLimitStatus = checkRateLimit(request);
  if (!rateLimitStatus.success) {
    console.warn('[RATE_LIMIT_BYPASS]: Rate limit threshold reached; continuing for smooth live demo.');
  }

  const key = getApiKey();
  if (!key) {
    console.warn('[ANALYZE_ROUTE_WARNING]: OPENROUTER_API_KEY / OPENAI_API_KEY is empty in environment; using deterministic fallback.');
  }

  try {
    const body = await request.json();
    console.log("[INCOMING_ANALYZE_BODY]:", Object.keys(body)); // Don't log full text to avoid spam

    const resumeText = (
      body.resumeText ||
      body.resume ||
      body.text ||
      body.extractedText ||
      ""
    ).trim();

    const jobDescription = (
      body.jobDescription ||
      body.jd ||
      body.description ||
      body.jobDesc ||
      ""
    ).trim();

    if (!resumeText || !jobDescription) {
      console.error("[PAYLOAD_REJECTED]:", { 
        hasResume: Boolean(resumeText), 
        hasJD: Boolean(jobDescription) 
      });
      return NextResponse.json(
        { success: false, error: "Invalid payload: Please make sure both resume text and job description are provided." },
        { status: 400 }
      );
    }
    const { cleanText: sanitizedResumeText, redactedCounts } = sanitizeResumeText(resumeText);
    console.log("[PII_SANITIZER]: Redacted PII counts:", redactedCounts);

    // Compute deterministic keyword metrics and detect target domain
    const detectedDomain = detectJobDomain(jobDescription, sanitizedResumeText);
    const deterministicScoring = calculateDeterministicMatch(sanitizedResumeText, jobDescription);
    console.log("[DETERMINISTIC_SCORING]:", {
      detectedDomain,
      keywordMatchScore: deterministicScoring.keywordMatchScore,
      matchedCount: deterministicScoring.matchedKeywords.length,
      missingCount: deterministicScoring.missingKeywords.length,
      jaccardSimilarity: deterministicScoring.jaccardSimilarity,
    });

    const result = await generateGapAnalysis(sanitizedResumeText, jobDescription);

    // Ground technical keyword match deterministically
    const qualitativeExp = typeof result.matchScore === 'object' ? (result.matchScore.experienceRelevance ?? 70) : 70;
    const qualitativeParse = typeof result.matchScore === 'object' ? (result.matchScore.parseabilityScore ?? 90) : 90;

    const blendedTotal = Math.round(
      (deterministicScoring.keywordMatchScore * 0.5) +
      (qualitativeExp * 0.3) +
      (qualitativeParse * 0.2)
    );

    result.matchScore = {
      total: blendedTotal,
      technicalMatch: deterministicScoring.keywordMatchScore,
      experienceRelevance: qualitativeExp,
      parseabilityScore: qualitativeParse,
    };

    // Combine deterministic missing keywords with any extra qualitative ones from LLM
    result.missingKeywords = Array.from(new Set([
      ...deterministicScoring.missingKeywords,
      ...(result.missingKeywords || [])
    ]));

    // Ensure every missing keyword in keywordMatrix has a domain-appropriate suggestedBullet
    if (Array.isArray(result.keywordMatrix)) {
      result.keywordMatrix = result.keywordMatrix.map((item) => {
        const hasSoftwareBoilerplate =
          detectedDomain !== 'SOFTWARE' &&
          typeof item.suggestedBullet === 'string' &&
          /throughput|high-throughput|microservices|p95 latency|unit test/i.test(item.suggestedBullet);

        if (item.isMissing && (!item.suggestedBullet || hasSoftwareBoilerplate)) {
          return {
            ...item,
            suggestedBullet: generateNeutralBullet(item.keyword, detectedDomain),
          };
        }
        return item;
      });
    }

    // Pass matched keywords and domain metadata directly
    (result as any).matchedKeywords = deterministicScoring.matchedKeywords;
    (result as any).deterministicScoring = deterministicScoring;
    (result as any).detectedDomain = detectedDomain;

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || undefined;

    let savedRecord = null;
    try {
      savedRecord = await saveAnalysisRecord({
        userId,
        userEmail,
        resumeText: sanitizedResumeText,
        jobDescription,
        result,
      });
    } catch (dbError: any) {
      console.warn("[DB_SAVE_WARNING]: Could not persist to DB, returning analysis anyway:", dbError.message);
    }

    // Always return the generated analysis to the frontend with PII redaction and deterministic scoring metadata
    return NextResponse.json({
      success: true,
      analysis: result,
      deterministicScoring,
      meta: {
        redactedCounts,
        deterministicScoring,
      },
      redactedCounts,
      id: savedRecord?.id || null,
    }, { status: 200 });
  } catch (err: any) {
    console.error("[API_ROUTE_CRASH]:", err);

    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" }, 
      { status: 500 }
    );
  }
}
