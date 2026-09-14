import { NextResponse } from 'next/server';
import { getRecentAnalyses } from '@/services/historyService';
import { AppError } from '@/lib/errors/AppError';

export async function GET() {
  try {
    const records = await getRecentAnalyses();
    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch history.' }, { status: 500 });
  }
}
