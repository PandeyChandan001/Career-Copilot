import { z } from 'zod';

export const AnalysisRequestSchema = z.object({
  resumeText: z.string().min(50).max(25000),
  jobDescription: z.string().min(50).max(15000),
});

export const PrepAnalysisSchema = z.object({
  matchScore: z.object({
    total: z.coerce.number().min(0).max(100).nullish().transform(val => val ?? 70),
    technicalMatch: z.coerce.number().min(0).max(100).nullish().transform(val => val ?? 70),
    experienceRelevance: z.coerce.number().min(0).max(100).nullish().transform(val => val ?? 70),
    parseabilityScore: z.coerce.number().min(0).max(100).nullish().transform(val => val ?? 70),
  }).nullish().transform(val => val ?? { total: 70, technicalMatch: 70, experienceRelevance: 70, parseabilityScore: 70 }),
  summary: z.string().nullish().transform(val => val ?? "Analysis complete."),
  strengths: z.array(z.string()).nullish().transform(val => val ?? []),
  missingKeywords: z.array(z.string()).nullish().transform(val => val ?? []), // Keeping for backward compatibility or simple chips
  keywordMatrix: z.array(z.object({
    keyword: z.string().nullish().transform(val => val ?? 'Skill'),
    category: z.string().nullish().transform(val => val ?? 'Hard Technical Skill'), // "Hard Technical Skill", "Soft & Operational Skill"
    isRequired: z.boolean().nullish().transform(val => val ?? true),
    isMissing: z.boolean().nullish().transform(val => val ?? true),
    suggestedBullet: z.string().nullish().transform(val => val ?? '')
  })).nullish().transform(val => val ?? []),
  skillGaps: z.array(z.object({
    skill: z.string().nullish().transform(val => val ?? 'Core Skill'),
    category: z.string().nullish().transform(val => val ?? 'hard_skill'),
    importance: z.string().nullish().transform(val => val ?? 'important'),
    reason: z.string().nullish().transform(val => val ?? '')
  })).nullish().transform(val => val ?? []),
  resumeRewrites: z.array(z.object({
    originalBullet: z.string().nullish().transform(val => val ?? 'Did some tasks.'),
    rewrittenBullet: z.string().nullish().transform(val => val ?? 'Led project tasks resulting in 20% efficiency increase.'),
    metricAdded: z.string().nullish().transform(val => val ?? 'Efficiency')
  })).nullish().transform(val => val ?? []),
  preparationPlan: z.array(z.object({
    phase: z.string().nullish().transform(val => val ?? 'Phase 1'),
    focusAreas: z.array(z.string()).nullish().transform(val => val ?? []),
    actionItems: z.array(z.string()).nullish().transform(val => val ?? []),
  })).nullish().transform(val => val ?? []),
  questionBank: z.array(z.object({
    category: z.string().nullish().transform(val => val ?? 'technical'),
    question: z.string().nullish().transform(val => val ?? 'Describe a challenging technical project you managed.'),
    targetConcept: z.string().nullish().transform(val => val ?? 'Competency'),
    recommendedApproach: z.string().nullish().transform(val => val ?? ''),
    sampleAnswer: z.string().nullish().transform(val => val ?? '')
  })).nullish().transform(val => val ?? [])
});

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
export type PrepAnalysisResult = z.infer<typeof PrepAnalysisSchema>;
