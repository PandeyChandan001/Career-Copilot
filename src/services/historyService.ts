import { prisma } from '../lib/prisma';
import { PrepAnalysisResult } from '../schemas/analysisSchema';
import { AppError } from '../lib/errors/AppError';

export async function saveAnalysisRecord(data: { resumeText: string; jobDescription: string; result: PrepAnalysisResult }) {
  try {
    return await prisma.analysisRecord.create({
      data: {
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

export async function getRecentAnalyses(limit: number = 10) {
  try {
    return await prisma.analysisRecord.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('[FETCH_HISTORY_ERROR]', error);
    throw new AppError('Failed to fetch analysis history.', 500);
  }
}

export async function getAnalysisById(id: string) {
  try {
    return await prisma.analysisRecord.findUnique({ where: { id } });
  } catch (error) {
    console.error('[FETCH_ANALYSIS_ERROR]', error);
    throw new AppError('Failed to fetch specific analysis.', 500);
  }
}
