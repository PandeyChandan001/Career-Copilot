import { NextResponse } from 'next/server';
import { getAnalysisById } from '@/services/historyService';
import { AppError } from '@/lib/errors/AppError';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const record = await getAnalysisById(params.id);
    if (!record) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: record }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch record.' }, { status: 500 });
  }
}
