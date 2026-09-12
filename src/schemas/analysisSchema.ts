import { z } from 'zod';

export const AnalysisRequestSchema = z.object({
  resumeText: z.string().min(50).max(25000),
  jobDescription: z.string().min(50).max(15000),
});

export const PrepAnalysisSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  summary: z.string().describe("A concise 2-3 sentence executive alignment summary."),
  skillGaps: z.array(z.object({
    skill: z.string(),
    category: z.enum(['hard_skill', 'tool_framework', 'soft_skill', 'domain_knowledge']),
    importance: z.enum(['critical', 'important', 'bonus']),
    reason: z.string()
  })),
  preparationPlan: z.array(z.object({
    phase: z.string().describe("e.g. 'Days 1-2', 'Days 3-5', or 'Week 2'"),
    focusTopic: z.string(),
    actionItems: z.array(z.string()),
    suggestedConcepts: z.array(z.string())
  })),
  questionBank: z.object({
    technical: z.array(z.object({
      question: z.string(),
      targetSkill: z.string(),
      expectedKeyPoints: z.array(z.string())
    })),
    behavioral: z.array(z.object({
      question: z.string(),
      targetedCompetency: z.string(),
      starContextHint: z.string()
    })),
    situational: z.array(z.object({
      scenario: z.string(),
      question: z.string(),
      evaluationCriteria: z.string()
    }))
  })
});

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
export type PrepAnalysisResult = z.infer<typeof PrepAnalysisSchema>;
