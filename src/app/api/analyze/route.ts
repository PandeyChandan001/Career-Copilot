import { NextResponse } from 'next/server';
import { generateGapAnalysis } from '@/services/aiService';
import { saveAnalysisRecord } from '@/services/historyService';
import { AnalysisRequestSchema } from '@/schemas/analysisSchema';
import { AppError } from '@/lib/errors/AppError';
import { applyRateLimit } from '@/lib/rateLimit';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

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

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || undefined;

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `user_${userId}@app.internal`,
      },
    });

    // Asynchronously save to history
    saveAnalysisRecord({ userId, userEmail, resumeText, jobDescription, result }).catch(console.error);

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("ANALYSIS_ROUTE_CRASH:", error);

    const message = error?.message || "Internal Analysis Error";
    const status = error?.status || error?.statusCode || 500;
    
    return NextResponse.json(
      { success: false, error: message, raw: String(error) }, 
      { status }
    );
  }
}
