import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { PrepAnalysisSchema } from '@/schemas/analysisSchema';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function generateGapAnalysis(resumeText: string, jobDescription: string) {
const prompt = `
Analyze the following resume against the job description to provide an elite, end-to-end ATS optimization and career prep report.

RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

Return ONLY a valid, raw JSON object matching EXACTLY this schema (no markdown, no backticks, no comments):
{
  "matchScore": {
    "total": 75,
    "technicalMatch": 80,
    "experienceRelevance": 70,
    "parseabilityScore": 90
  },
  "summary": "High Interview Probability / Needs Optimization / etc.",
  "strengths": ["Matched skill 1", "Matched skill 2"],
  "missingKeywords": ["Missing skill 1", "Missing skill 2"],
  "keywordMatrix": [
    {
      "keyword": "Kubernetes",
      "category": "Hard Technical Skill",
      "isRequired": true,
      "isMissing": true,
      "suggestedBullet": "Deployed containerized applications using Kubernetes to reduce downtime by 15%."
    }
  ],
  "skillGaps": [
    {
      "skill": "AWS",
      "category": "hard_skill",
      "importance": "high",
      "reason": "Required for cloud deployment"
    }
  ],
  "resumeRewrites": [
    {
      "originalBullet": "Worked on backend API.",
      "rewrittenBullet": "Engineered a scalable RESTful backend API in Node.js, improving response times by 30%.",
      "metricAdded": "30% improvement"
    }
  ],
  "preparationPlan": [
    {
      "phase": "Week 1",
      "focusAreas": ["Core syntax", "React basics"],
      "actionItems": ["Build a small React project", "Review ES6 syntax"]
    }
  ],
  "questionBank": [
    {
      "category": "technical",
      "question": "How does React's virtual DOM work?",
      "targetConcept": "Rendering optimization",
      "recommendedApproach": "STAR method: Explain the concept, why it's fast, and an example where you optimized a component.",
      "sampleAnswer": "The virtual DOM is a lightweight copy of the actual DOM. React uses it to calculate the minimum number of changes required..."
    }
  ]
}
`;

  const { text } = await generateText({
    model: openrouter('deepseek/deepseek-chat'),
    prompt,
  });

  const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (error) {
    console.error('[JSON_PARSE_ERROR]', error, text);
    parsed = {};
  }
  
  const validated = PrepAnalysisSchema.safeParse(parsed);

  if (!validated.success) {
    console.warn('[ZOD_SAFE_PARSE_FALLBACK]:', validated.error.format());
    return {
      matchScore: parsed.matchScore || { total: 70, technicalMatch: 70, experienceRelevance: 70, parseabilityScore: 70 },
      summary: parsed.summary || 'Analysis complete.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
      keywordMatrix: Array.isArray(parsed.keywordMatrix) ? parsed.keywordMatrix : [],
      skillGaps: Array.isArray(parsed.skillGaps) ? parsed.skillGaps : [],
      resumeRewrites: Array.isArray(parsed.resumeRewrites) ? parsed.resumeRewrites : [],
      preparationPlan: Array.isArray(parsed.preparationPlan) ? parsed.preparationPlan : [],
      questionBank: Array.isArray(parsed.questionBank) ? parsed.questionBank : [],
    };
  }

  return validated.data;
}
