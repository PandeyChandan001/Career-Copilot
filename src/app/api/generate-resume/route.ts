import { NextResponse } from 'next/server';
import { generateTailoredResumeData, renderResumeToStream } from '@/services/resumeService';
import { AnalysisRequestSchema } from '@/schemas/analysisSchema';
import { AppError } from '@/lib/errors/AppError';

export async function POST(request: Request) {
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
    const resumeData = await generateTailoredResumeData(resumeText, jobDescription);
    const pdfStream = await renderResumeToStream(resumeData);

    return new NextResponse(pdfStream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="tailored-resume.pdf"',
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error('[GENERATE_RESUME_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during resume generation.' },
      { status: 500 }
    );
  }
}
