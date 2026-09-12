import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { PrepAnalysisSchema, PrepAnalysisResult } from '../schemas/analysisSchema';
import { AppError } from '../lib/errors/AppError';

export async function generateGapAnalysis(resumeText: string, jobDescription: string): Promise<PrepAnalysisResult> {
  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: PrepAnalysisSchema,
      system: "You are an elite technical hiring bar-raiser and career strategist. Objectively evaluate the candidate's resume against the target job description. Identify genuine skill gaps without hallucinating unstated competencies. Calculate an objective ATS match score based on hard requirements. Provide a structured, realistic preparation roadmap and high-signal interview questions tailored specifically to the candidate's gaps.",
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
