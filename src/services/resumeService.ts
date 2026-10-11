import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
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
    const openrouterApiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

    if (!openrouterApiKey) {
      throw new AppError('Missing OPENROUTER_API_KEY in environment variables.', 500);
    }

    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openrouterApiKey,
    });

    const prompt = `You are a professional technical resume writer and ATS specialist. Extract the candidate's real experience and rewrite bullet points using the Google XYZ formula (Accomplished X, measured by Y, by doing Z). Naturally weave in target keywords from the job description without fabricating experiences or technologies the candidate never used.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY a valid, raw JSON object matching this exact structure (no markdown fences, no commentary):
{
  "fullName": "Candidate Name",
  "contact": {
    "email": "email@example.com",
    "phone": "+1-555-0100",
    "location": "City, Country",
    "linkedIn": "linkedin.com/in/profile",
    "github": "github.com/profile"
  },
  "summary": "2-3 sentence career summary tailored to the job description.",
  "skills": ["Skill 1", "Skill 2"],
  "experience": [
    {
      "role": "Role Title",
      "company": "Company Name",
      "location": "Location",
      "dateRange": "Start - End",
      "bulletPoints": ["Rewritten high-impact bullet 1", "Rewritten bullet 2"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Degree",
      "year": "Graduation Year",
      "highlights": ["Highlight 1"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "technologies": "Tech Stack",
      "bulletPoints": ["Project achievement 1"]
    }
  ]
}`;

    const { text } = await generateText({
      model: openrouter('deepseek/deepseek-chat'),
      prompt,
    });

    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    const validated = TailoredResumeSchema.safeParse(parsed);

    if (!validated.success) {
      return {
        fullName: parsed.fullName || 'Candidate',
        contact: {
          email: parsed.contact?.email || '',
          phone: parsed.contact?.phone || '',
          location: parsed.contact?.location || '',
          linkedIn: parsed.contact?.linkedIn,
          github: parsed.contact?.github,
        },
        summary: parsed.summary || '',
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        education: Array.isArray(parsed.education) ? parsed.education : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      };
    }

    return validated.data;
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
    return await renderToStream(React.createElement(ATSResumeDocument, { resumeData }) as any);
  } catch (error) {
    console.error('[PDF_RENDER_ERROR]', error);
    throw new AppError('Failed to render PDF document.', 500);
  }
}
