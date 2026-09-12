import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { PrepAnalysisSchema, PrepAnalysisResult } from '../schemas/analysisSchema';
import { AppError } from '../lib/errors/AppError';

export async function generateGapAnalysis(resumeText: string, jobDescription: string): Promise<PrepAnalysisResult> {
  try {
    const { object } = await generateObject({
      model: google('gemini-1.5-flash'),
      schema: PrepAnalysisSchema,
      system: "You are an elite technical hiring bar-raiser and career strategist. Objectively evaluate the candidate's resume against the target job description. Identify genuine skill gaps without assuming unstated expertise. Calculate an objective ATS match score based on core requirements. Provide a structured, realistic preparation roadmap and high-signal interview questions tailored specifically to the candidate's gaps.",
      prompt: `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}`,
    });

    return object;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('[AI_SERVICE_ERROR]', error);
    throw new AppError('Failed to generate gap analysis via AI service.', 502);
  }
}
