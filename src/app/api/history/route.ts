import { NextResponse } from 'next/server';
import { getUserAnalyses } from '@/services/historyService';
import { AppError } from '@/lib/errors/AppError';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const records = await getUserAnalyses(userId);
    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch history.' }, { status: 500 });
  }
}
