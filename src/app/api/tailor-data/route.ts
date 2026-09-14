import { NextResponse } from 'next/server';
import { generateTailoredResumeData } from '@/services/resumeService';
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
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const data = await generateTailoredResumeData(validationResult.data.resumeText, validationResult.data.jobDescription);
    
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 });
  }
}
