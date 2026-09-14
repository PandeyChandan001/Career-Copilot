import { NextResponse } from 'next/server';
import { generateGapAnalysis } from '@/services/aiService';
import { saveAnalysisRecord } from '@/services/historyService';
import { AnalysisRequestSchema } from '@/schemas/analysisSchema';
import { AppError } from '@/lib/errors/AppError';
import { applyRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const validationResult = AnalysisRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const { resumeText, jobDescription } = validationResult.data;
    const result = await generateGapAnalysis(resumeText, jobDescription);

    // Asynchronously save to history
    saveAnalysisRecord({ resumeText, jobDescription, result }).catch(console.error);

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error('[ANALYZE_ROUTE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during analysis.' },
      { status: 500 }
    );
  }
}
