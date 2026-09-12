import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { TailoredResumeSchema, TailoredResumeData } from '../schemas/resumeSchema';
import { AppError } from '../lib/errors/AppError';
import { ATSResumeDocument } from '../components/pdf/ATSResumeDocument';

export async function generateTailoredResumeData(
  resumeText: string,
  jobDescription: string
): Promise<TailoredResumeData> {
  try {
    const { object } = await generateObject({
      model: google('gemini-1.5-flash'),
      schema: TailoredResumeSchema,
      system: "You are a professional technical resume writer and ATS specialist. Extract the candidate's real experience and rewrite bullet points using the Google XYZ formula (Accomplished X, measured by Y, by doing Z). Naturally weave in target keywords from the job description without fabricating experiences or technologies the candidate never used. Output strictly conforming structured JSON.",
      prompt: `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}`,
    });

    return object;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('[RESUME_GEN_ERROR]', error);
    throw new AppError('Failed to generate tailored resume data via AI service.', 502);
  }
}

export async function renderResumeToStream(resumeData: TailoredResumeData): Promise<NodeJS.ReadableStream> {
  try {
    return await renderToStream(React.createElement(ATSResumeDocument, { resumeData }));
  } catch (error) {
    console.error('[PDF_RENDER_ERROR]', error);
    throw new AppError('Failed to render PDF document.', 500);
  }
}
