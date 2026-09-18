import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { PrepAnalysisSchema, PrepAnalysisResult } from '../schemas/analysisSchema';
import { AppError } from '../lib/errors/AppError';

export async function generateGapAnalysis(resumeText: string, jobDescription: string): Promise<PrepAnalysisResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new AppError('Google Gemini API Key is not configured on the server.', 500);
  }

  const maxRetries = 2;
  const delayMs = 2000;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        schema: PrepAnalysisSchema,
        system: "You are an elite technical hiring bar-raiser and career strategist. Objectively evaluate the candidate's resume against the target job description. Identify genuine skill gaps without assuming unstated expertise. Calculate an objective ATS match score based on core requirements. Provide a structured, realistic preparation roadmap and high-signal interview questions tailored specifically to the candidate's gaps.",
        prompt: `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}`,
      });

      return object;
    } catch (error: any) {
      const isRateLimit = error?.statusCode === 429 || error?.message?.includes('429') || error?.message?.includes('quota');
      
      if (isRateLimit && attempt <= maxRetries) {
        console.warn(`[AI_RATE_LIMIT] Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      if (error?.name === 'TypeValidationError' || error?.name === 'NoObjectGeneratedError') {
        console.error('[AI_VALIDATION_ERROR]', error);
        throw new AppError('The AI returned an invalid response format. Please try again.', 422);
      }

      console.error('[AI_SERVICE_ERROR]', error);
      throw new AppError(`Failed to generate gap analysis: ${error?.message || 'AI Generation Error'}`, 502);
    }
  }

  throw new AppError('Max retries exceeded for AI generation.', 502);
}
