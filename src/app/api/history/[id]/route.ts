import { NextResponse } from 'next/server';
import { getUserAnalysisById } from '@/services/historyService';
import { AppError } from '@/lib/errors/AppError';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const record = await getUserAnalysisById(id, userId);
    
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
