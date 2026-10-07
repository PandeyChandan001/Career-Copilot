import { NextResponse } from 'next/server';
import { generateGapAnalysis } from '@/services/aiService';
import { saveAnalysisRecord } from '@/services/historyService';
import { applyRateLimit } from '@/lib/rateLimit';
import { auth, currentUser } from '@clerk/nextjs/server';
import { sanitizeResumeText } from '@/lib/sanitizer';
import { calculateDeterministicMatch } from '@/lib/scoring';

export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

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

    // Compute deterministic keyword metrics
    const deterministicScoring = calculateDeterministicMatch(sanitizedResumeText, jobDescription);
    console.log("[DETERMINISTIC_SCORING]:", {
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

    // Pass matched keywords directly
    (result as any).matchedKeywords = deterministicScoring.matchedKeywords;
    (result as any).deterministicScoring = deterministicScoring;

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
