import { NextResponse } from 'next/server';
import { generateGapAnalysis } from '@/services/aiService';
import { saveAnalysisRecord } from '@/services/historyService';
import { AnalysisRequestSchema } from '@/schemas/analysisSchema';
import { AppError } from '@/lib/errors/AppError';
import { applyRateLimit } from '@/lib/rateLimit';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { sanitizeResumeText } from '@/lib/sanitizer';

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

    const result = await generateGapAnalysis(sanitizedResumeText, jobDescription);

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

    // Always return the generated analysis to the frontend with PII redaction metadata
    return NextResponse.json({
      success: true,
      analysis: result,
      meta: {
        redactedCounts,
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
