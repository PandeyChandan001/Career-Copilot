import { prisma } from '../lib/prisma';
import { PrepAnalysisResult } from '../schemas/analysisSchema';
import { AppError } from '../lib/errors/AppError';

export async function saveAnalysisRecord(data: { userId: string; userEmail?: string; resumeText: string; jobDescription: string; result: PrepAnalysisResult }) {
  try {
    // Upsert User to guarantee relation integrity
    await prisma.user.upsert({
      where: { id: data.userId },
      update: { email: data.userEmail },
      create: { id: data.userId, email: data.userEmail },
    });

    return await prisma.analysisRecord.create({
      data: {
        userId: data.userId,
        rawResumeText: data.resumeText,
        jobDescription: data.jobDescription,
        matchScore: data.result.matchScore,
        summary: data.result.summary,
        analysisPayload: data.result as any,
      },
    });
  } catch (error) {
    console.error('[SAVE_HISTORY_ERROR]', error);
    throw new AppError('Failed to save analysis history.', 500);
  }
}

export async function getUserAnalyses(userId: string, limit: number = 10) {
  try {
    return await prisma.analysisRecord.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('[FETCH_HISTORY_ERROR]', error);
    throw new AppError('Failed to fetch analysis history.', 500);
  }
}

export async function getUserAnalysisById(id: string, userId: string) {
  try {
    // Use findFirst since findUnique doesn't support multiple non-unique where clauses without a compound unique index
    return await prisma.analysisRecord.findFirst({
      where: { id, userId },
    });
  } catch (error) {
    console.error('[FETCH_ANALYSIS_ERROR]', error);
    throw new AppError('Failed to fetch specific analysis.', 500);
  }
}
