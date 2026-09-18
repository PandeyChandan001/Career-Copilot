import { NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/services/parserService';
import { AppError } from '@/lib/errors/AppError';
import { parseFileSchema } from '@/schemas/parseSchema';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ success: false, error: 'Invalid file upload.' }, { status: 400 });
    }

    const validationResult = parseFileSchema.safeParse({ file });

    if (!validationResult.success) {
      const errorMessage = validationResult.error?.errors?.map(e => e.message).join(', ') || 'Invalid file structure';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const rawText = await extractTextFromPDF(buffer);

    return NextResponse.json(
      {
        success: true,
        data: {
          rawText,
          charCount: rawText.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    console.error('[PARSE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during parsing.' },
      { status: 500 }
    );
  }
}
