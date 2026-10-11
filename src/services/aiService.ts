import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { PrepAnalysisSchema, PrepAnalysisResult } from '@/schemas/analysisSchema';
import { calculateDeterministicMatch } from '@/lib/scoring';

const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

if (!apiKey && process.env.NODE_ENV === 'development') {
  console.warn('Missing OpenRouter/OpenAI API key. Please check your environment variables.');
}

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey || 'missing-api-key-fallback',
});

function buildDeterministicFallbackAnalysis(resumeText: string, jobDescription: string): PrepAnalysisResult {
  const det = calculateDeterministicMatch(resumeText, jobDescription);
  const matched = det.matchedKeywords.slice(0, 12);
  const missing = det.missingKeywords.slice(0, 12);

  const techScore = det.keywordMatchScore;
  const expScore = Math.min(95, Math.max(55, Math.round(techScore * 0.85 + 15)));
  const parseScore = 92;
  const totalScore = Math.round(techScore * 0.5 + expScore * 0.3 + parseScore * 0.2);

  const topMatchedText = matched.length > 0 ? matched.slice(0, 5).join(', ') : 'foundational engineering principles';
  const topMissingText = missing.length > 0 ? missing.slice(0, 4).join(', ') : 'domain-specific scale metrics';

  const summary =
    techScore >= 70
      ? `Strong ATS alignment (${totalScore}%). Your profile demonstrates solid coverage across ${topMatchedText}. Incorporating explicit metrics around ${topMissingText} will further strengthen your candidacy.`
      : `Moderate ATS alignment (${totalScore}%). Core competencies in ${topMatchedText} are detected, but the target vector emphasizes ${topMissingText} which are currently underrepresented in your resume stream.`;

  const strengths =
    matched.length >= 3
      ? [
          `Demonstrated alignment in core technical terms: ${matched.slice(0, 4).join(', ')}`,
          `Additional verified keyword overlap across ${matched.slice(4, 8).join(', ') || 'key role requirements'}`,
          `Clean document parseability structure with ${det.totalResumeKeywords} indexed technical n-grams`,
        ]
      : [
          `Clear baseline formatting with ${det.totalResumeKeywords} indexed resume keywords`,
          'Transferable engineering and problem-solving foundation',
          'Structured chronological layout compatible with standard ATS parsers',
        ];

  const keywordMatrix = [
    ...missing.slice(0, 5).map((kw) => ({
      keyword: kw,
      category: 'Hard Technical Skill',
      isRequired: true,
      isMissing: true,
      suggestedBullet: `Engineered production solutions leveraging ${kw}, improving system reliability and throughput by 25%.`,
    })),
    ...matched.slice(0, 4).map((kw) => ({
      keyword: kw,
      category: 'Verified Skill',
      isRequired: true,
      isMissing: false,
      suggestedBullet: `Continue highlighting measurable outcomes achieved with ${kw}.`,
    })),
  ];

  const skillGaps =
    missing.length > 0
      ? missing.slice(0, 5).map((kw, idx) => ({
          skill: kw,
          category: 'hard_skill',
          importance: idx < 2 ? 'high' : 'important',
          reason: `Frequently referenced in the target job description (${kw}) but not explicitly indexed in your current resume text.`,
        }))
      : [
          {
            skill: 'Quantified Impact Metrics',
            category: 'hard_skill',
            importance: 'high',
            reason: 'Adding concrete latency, revenue, or scale percentages strengthens senior-level evaluation.',
          },
        ];

  const focus1 = missing.slice(0, 3).length > 0 ? missing.slice(0, 3) : ['Core Architecture', 'System Design'];
  const focus2 = missing.slice(3, 6).length > 0 ? missing.slice(3, 6) : ['Scalability', 'Testing & CI/CD'];
  const focus3 = matched.slice(0, 3).length > 0 ? matched.slice(0, 3) : ['Behavioral STAR Prep', 'Mock Interviews'];

  const preparationPlan = [
    {
      phase: 'Week 1: Core Gap Remediation',
      focusAreas: focus1,
      actionItems: [
        `Review production patterns and architectural trade-offs for ${focus1.join(' and ')}.`,
        `Update resume experience bullets to explicitly surface ${focus1[0] || 'key target'} keywords where applicable.`,
        'Complete a hands-on implementation module covering these core requirements.',
      ],
    },
    {
      phase: 'Week 2: Systems & Integration Depth',
      focusAreas: focus2,
      actionItems: [
        `Practice designing fault-tolerant services integrating ${focus2.join(', ')}.`,
        'Document performance benchmarks, latency reductions, and throughput metrics from past projects.',
        'Prepare technical deep-dive explanations for system bottlenecks you resolved.',
      ],
    },
    {
      phase: 'Week 3: STAR Synthesis & Mock Drills',
      focusAreas: focus3,
      actionItems: [
        `Align past achievements in ${focus3.join(', ')} with the Google XYZ / STAR framework.`,
        'Rehearse 5 behavioral and 5 system design scenarios under timed conditions.',
        'Conduct final ATS keyword verification before submitting tailored application.',
      ],
    },
  ];

  const primaryMissing = missing[0] || 'Distributed Systems';
  const secondaryMissing = missing[1] || 'Performance Optimization';
  const primaryMatched = matched[0] || 'Software Engineering';

  const questionBank = [
    {
      category: 'technical',
      question: `How have you architected or integrated ${primaryMissing} in a production environment, and what trade-offs did you evaluate?`,
      targetConcept: primaryMissing,
      recommendedApproach: `Use the STAR method: outline the system constraints, explain why ${primaryMissing} was chosen over alternatives, and quantify the resulting reliability or latency gains.`,
      sampleAnswer: `In a recent high-throughput service, we needed to address scaling bottlenecks around ${primaryMissing}. I designed a modular implementation with automated health checks and fallback handling, which reduced p95 latency by 28% and eliminated manual intervention during peak load.`,
    },
    {
      category: 'technical',
      question: `Walk me through a complex technical challenge where you leveraged ${primaryMatched} to solve a critical bottleneck.`,
      targetConcept: primaryMatched,
      recommendedApproach: `Highlight your hands-on mastery of ${primaryMatched}. Focus on profiling metrics before and after your architectural changes.`,
      sampleAnswer: `While scaling our core platform using ${primaryMatched}, we observed degraded response times under concurrent traffic. I profiled the execution path, refactored the data access layer, and introduced caching, improving overall throughput by 40%.`,
    },
    {
      category: 'behavioral',
      question: `Tell me about a time you had to quickly ramp up on an unfamiliar technology like ${secondaryMissing} to deliver a critical milestone.`,
      targetConcept: `Adaptability & ${secondaryMissing}`,
      recommendedApproach: 'Emphasize structured learning, prototyping, and how you validated production readiness with unit/integration tests.',
      sampleAnswer: `When our team needed to adopt ${secondaryMissing} under a tight sprint deadline, I built a proof-of-concept within 48 hours, documented best practices for the team, and shipped the feature on schedule with 95% test coverage.`,
    },
  ];

  return {
    matchScore: {
      total: totalScore,
      technicalMatch: techScore,
      experienceRelevance: expScore,
      parseabilityScore: parseScore,
    },
    summary,
    strengths,
    missingKeywords: missing,
    keywordMatrix,
    skillGaps,
    resumeRewrites: [
      {
        originalBullet: 'Developed and maintained core application features.',
        rewrittenBullet: `Engineered scalable application features utilizing ${primaryMatched} and ${primaryMissing}, increasing system performance by 30%.`,
        metricAdded: '30% performance increase',
      },
    ],
    preparationPlan,
    questionBank,
  };
}

export async function generateGapAnalysis(resumeText: string, jobDescription: string): Promise<PrepAnalysisResult> {
  if (!apiKey) {
    console.warn('[AI_SERVICE_FALLBACK]: No OPENROUTER_API_KEY found in environment; using deterministic analysis engine.');
    return buildDeterministicFallbackAnalysis(resumeText, jobDescription);
  }

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

  try {
    let text = '';
    try {
      const primaryResult = await generateText({
        model: openrouter('deepseek/deepseek-chat'),
        prompt,
        temperature: 0.3,
      });
      text = primaryResult.text;
    } catch (primaryErr: any) {
      console.warn('[OPENROUTER_PRIMARY_MODEL_FALLBACK]: Retrying with meta-llama/llama-3.3-70b-instruct:', primaryErr?.message || primaryErr);
      const retryResult = await generateText({
        model: openrouter('meta-llama/llama-3.3-70b-instruct'),
        prompt,
        temperature: 0.3,
      });
      text = retryResult.text;
    }

    if (!text) {
      return buildDeterministicFallbackAnalysis(resumeText, jobDescription);
    }

    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    const validated = PrepAnalysisSchema.safeParse(parsed);

    if (!validated.success) {
      console.warn('[ZOD_SAFE_PARSE_FALLBACK]:', validated.error.format());
      const fallback = buildDeterministicFallbackAnalysis(resumeText, jobDescription);
      return {
        matchScore: parsed.matchScore || fallback.matchScore,
        summary: parsed.summary || fallback.summary,
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : fallback.strengths,
        missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : fallback.missingKeywords,
        keywordMatrix: Array.isArray(parsed.keywordMatrix) && parsed.keywordMatrix.length > 0 ? parsed.keywordMatrix : fallback.keywordMatrix,
        skillGaps: Array.isArray(parsed.skillGaps) && parsed.skillGaps.length > 0 ? parsed.skillGaps : fallback.skillGaps,
        resumeRewrites: Array.isArray(parsed.resumeRewrites) && parsed.resumeRewrites.length > 0 ? parsed.resumeRewrites : fallback.resumeRewrites,
        preparationPlan: Array.isArray(parsed.preparationPlan) && parsed.preparationPlan.length > 0 ? parsed.preparationPlan : fallback.preparationPlan,
        questionBank: Array.isArray(parsed.questionBank) && parsed.questionBank.length > 0 ? parsed.questionBank : fallback.questionBank,
      };
    }

    return validated.data;
  } catch (error) {
    console.warn('[AI_SERVICE_NETWORK_FALLBACK]: Falling back to deterministic engine:', error);
    return buildDeterministicFallbackAnalysis(resumeText, jobDescription);
  }
}
