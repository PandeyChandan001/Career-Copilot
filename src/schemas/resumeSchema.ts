import { z } from 'zod';

export const TailoredResumeSchema = z.object({
  fullName: z.string(),
  contact: z.object({
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    linkedIn: z.string().optional(),
    github: z.string().optional()
  }),
  summary: z.string().describe("A targeted, 2-3 sentence career summary tailored to the job description."),
  skills: z.array(z.string()).describe("A flat list of technical skills prioritized by relevance to the JD."),
  experience: z.array(z.object({
    role: z.string(),
    company: z.string(),
    location: z.string(),
    dateRange: z.string(),
    bulletPoints: z.array(z.string()).describe("High-impact achievements rewritten using the Google XYZ formula: Accomplished [X] as measured by [Y] by doing [Z].")
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    year: z.string(),
    highlights: z.array(z.string()).optional()
  })),
  projects: z.array(z.object({
    name: z.string(),
    technologies: z.string(),
    bulletPoints: z.array(z.string())
  })).optional()
});

export type TailoredResumeData = z.infer<typeof TailoredResumeSchema>;
