import { NextResponse } from 'next/server';
import { renderResumeToStream } from '@/services/resumeService';
import { TailoredResumeSchema } from '@/schemas/resumeSchema';
import { applyRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  // Allow more frequent exports since they don't hit the LLM API
  const rateLimitResponse = applyRateLimit(request, 15, 60000); 
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const validationResult = TailoredResumeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ success: false, error: 'Invalid resume data structure' }, { status: 400 });
    }

    const stream = await renderResumeToStream(validationResult.data);
    
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', chunk => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', err => controller.error(err));
      }
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="tailored-resume.pdf"',
      },
    });
  } catch (error) {
    console.error('[EXPORT_PDF_ERROR]', error);
    return NextResponse.json({ success: false, error: 'PDF Compilation failed' }, { status: 500 });
  }
}
