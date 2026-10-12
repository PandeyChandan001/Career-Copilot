import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { PrepAnalysisSchema, PrepAnalysisResult } from '@/schemas/analysisSchema';
import { calculateDeterministicMatch } from '@/lib/scoring';

export function getApiKey(): string {
  return (
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
    ''
  ).trim();
}

const key = getApiKey();

export const customProvider = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: key || 'sk-or-v1-fallback-prevent-crash',
});

export const openrouter = customProvider;

export type JobDomain = 'FINANCE' | 'ACCOUNTING' | 'OPERATIONS' | 'MARKETING' | 'SOFTWARE' | 'GENERAL';

export function detectJobDomain(jobDescription: string, resumeText = ''): JobDomain {
  const combined = `${jobDescription}\n${resumeText}`.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  const financeAccountingTerms = [
    'accounting', 'accountant', 'accounts payable', 'accounts receivable', 'ledger', 'reconciliation',
    'reconcile', 'gaap', 'ifrs', 'tax', 'taxation', 'gst', 'tds', 'audit', 'auditing', 'bookkeeping',
    'balance sheet', 'profit and loss', 'p&l', 'journal entries', 'general ledger', 'financial reporting',
    'tally', 'quickbooks', 'sap fico', 'zoho books', 'chartered accountant', 'cpa', 'invoicing',
    'billing', 'payroll', 'statutory compliance', 'bank reconciliation', 'variance analysis', 'budgeting',
    'forecasting', 'treasury', 'credit control', 'fixed assets', 'accruals', 'month-end close',
  ];
  const softwareTerms = [
    'software engineer', 'full-stack', 'fullstack', 'frontend', 'backend', 'devops', 'react',
    'typescript', 'javascript', 'node.js', 'python', 'java', 'golang', 'kubernetes', 'docker',
    'microservices', 'ci/cd', 'graphql', 'postgresql', 'mongodb', 'aws', 'distributed systems',
    'rest api', 'restful', 'system design', 'pull request', 'unit test',
  ];
  const operationsTerms = [
    'operations manager', 'business operations', 'supply chain', 'logistics', 'procurement',
    'vendor management', 'sla', 'inventory', 'process improvement', 'six sigma', 'lean',
    'project coordinator', 'program manager', 'SOP', 'turnaround time', 'fulfillment',
  ];
  const marketingTerms = [
    'marketing', 'brand', 'seo', 'sem', 'content strategy', 'social media', 'campaign',
    'lead generation', 'copywriting', 'google analytics', 'crm', 'hubspot', 'market research',
    'public relations', 'digital marketing', 'conversion rate', 'roas',
  ];

  const countHits = (text: string, terms: string[]) =>
    terms.reduce((acc, term) => (text.includes(term) ? acc + 1 : acc), 0);

  const finHits = countHits(jdLower, financeAccountingTerms) * 2 + countHits(combined, financeAccountingTerms);
  const swHits = countHits(jdLower, softwareTerms) * 2 + countHits(combined, softwareTerms);
  const opsHits = countHits(jdLower, operationsTerms) * 2 + countHits(combined, operationsTerms);
  const mktHits = countHits(jdLower, marketingTerms) * 2 + countHits(combined, marketingTerms);

  const maxHits = Math.max(finHits, swHits, opsHits, mktHits);
  if (maxHits === 0) return 'GENERAL';
  if (finHits === maxHits) return jdLower.includes('account') || jdLower.includes('ledger') || jdLower.includes('gst') || jdLower.includes('tally') ? 'ACCOUNTING' : 'FINANCE';
  if (opsHits === maxHits && opsHits > swHits) return 'OPERATIONS';
  if (mktHits === maxHits && mktHits > swHits) return 'MARKETING';
  if (swHits === maxHits && swHits >= 2) return 'SOFTWARE';
  return 'GENERAL';
}

export function generateNeutralBullet(skill: string, domain?: string): string {
  const cleanSkill = skill.trim() || 'core role competencies';
  if (domain === 'FINANCE' || domain === 'ACCOUNTING') {
    return `Managed and executed ${cleanSkill} workflows, improving reporting turnaround time by 20% and ensuring 100% compliance with statutory standards.`;
  }
  if (domain === 'OPERATIONS') {
    return `Streamlined ${cleanSkill} workflows, improving SLA adherence and operational turnaround time by 20%.`;
  }
  if (domain === 'MARKETING') {
    return `Planned and executed ${cleanSkill} initiatives, increasing campaign conversion efficiency and stakeholder engagement by 20%.`;
  }
  if (domain === 'SOFTWARE') {
    return `Developed and maintained ${cleanSkill} components, improving service reliability and response latency by 25%.`;
  }
  return `Implemented ${cleanSkill} initiatives, enhancing operational efficiency and delivery benchmarks by 20%.`;
}

function buildDeterministicFallbackAnalysis(resumeText: string, jobDescription: string): PrepAnalysisResult {
  const det = calculateDeterministicMatch(resumeText, jobDescription);
  const domain = detectJobDomain(jobDescription, resumeText);
  const matched = det.matchedKeywords.slice(0, 12);
  const missing = det.missingKeywords.slice(0, 12);

  const techScore = det.keywordMatchScore;
  const expScore = Math.min(95, Math.max(55, Math.round(techScore * 0.85 + 15)));
  const parseScore = 92;
  const totalScore = Math.round(techScore * 0.5 + expScore * 0.3 + parseScore * 0.2);

  const defaultMatchedLabel =
    domain === 'ACCOUNTING' || domain === 'FINANCE'
      ? 'financial reporting and accounting operations'
      : domain === 'OPERATIONS'
      ? 'operational execution and workflow coordination'
      : domain === 'MARKETING'
      ? 'campaign execution and market analysis'
      : domain === 'SOFTWARE'
      ? 'core software engineering fundamentals'
      : 'core functional role competencies';

  const defaultMissingLabel =
    domain === 'ACCOUNTING' || domain === 'FINANCE'
      ? 'reconciliation speed and statutory compliance metrics'
      : domain === 'OPERATIONS'
      ? 'SLA turnaround and process optimization metrics'
      : 'quantified outcome metrics';

  const topMatchedText = matched.length > 0 ? matched.slice(0, 5).join(', ') : defaultMatchedLabel;
  const topMissingText = missing.length > 0 ? missing.slice(0, 4).join(', ') : defaultMissingLabel;

  const summary =
    techScore >= 70
      ? `Strong ATS alignment (${totalScore}%). Your profile demonstrates solid coverage across ${topMatchedText}. Incorporating explicit measurable outcomes around ${topMissingText} will further strengthen your candidacy.`
      : `Moderate ATS alignment (${totalScore}%). Core competencies in ${topMatchedText} are present, but the target job description emphasizes ${topMissingText}, which are currently underrepresented in your resume.`;

  const strengths =
    matched.length >= 3
      ? [
          `Demonstrated alignment in core role requirements: ${matched.slice(0, 4).join(', ')}`,
          `Additional verified keyword overlap across ${matched.slice(4, 8).join(', ') || 'key domain responsibilities'}`,
          `Clean document parseability structure with ${det.totalResumeKeywords} indexed terms`,
        ]
      : [
          `Clear baseline formatting with ${det.totalResumeKeywords} indexed resume keywords`,
          'Structured chronological layout compatible with standard enterprise ATS parsers',
          'Transferable domain and analytical problem-solving foundation',
        ];

  const keywordMatrix = [
    ...missing.slice(0, 5).map((kw) => ({
      keyword: kw,
      category: 'Role Requirement',
      isRequired: true,
      isMissing: true,
      suggestedBullet: generateNeutralBullet(kw, domain),
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
          reason: `Referenced in the target job description (${kw}) but not explicitly indexed in your current resume text.`,
        }))
      : [
          {
            skill: 'Quantified Impact Metrics',
            category: 'hard_skill',
            importance: 'high',
            reason:
              domain === 'ACCOUNTING' || domain === 'FINANCE'
                ? 'Adding concrete reconciliation accuracy, audit closure time, or cost variance percentages strengthens candidate evaluation.'
                : 'Adding concrete efficiency, turnaround time, or quality percentages strengthens candidate evaluation.',
          },
        ];

  const defaultFocus1 =
    domain === 'ACCOUNTING' || domain === 'FINANCE'
      ? ['Ledger Reconciliation', 'Statutory Compliance']
      : domain === 'OPERATIONS'
      ? ['Process Optimization', 'SLA Governance']
      : ['Core Domain Skills', 'Role Alignment'];
  const defaultFocus2 =
    domain === 'ACCOUNTING' || domain === 'FINANCE'
      ? ['Financial Reporting', 'Audit Readiness']
      : domain === 'OPERATIONS'
      ? ['Vendor Coordination', 'Workflow Efficiency']
      : ['Operational Execution', 'KPI Measurement'];

  const focus1 = missing.slice(0, 3).length > 0 ? missing.slice(0, 3) : defaultFocus1;
  const focus2 = missing.slice(3, 6).length > 0 ? missing.slice(3, 6) : defaultFocus2;
  const focus3 = matched.slice(0, 3).length > 0 ? matched.slice(0, 3) : ['STAR Interview Prep', 'Scenario Practice'];

  const preparationPlan =
    domain === 'ACCOUNTING' || domain === 'FINANCE'
      ? [
          {
            phase: 'Week 1: Core Accounting & Compliance Alignment',
            focusAreas: focus1,
            actionItems: [
              `Review practical workflows, statutory standards, and reconciliation procedures for ${focus1.join(' and ')}.`,
              `Update resume experience bullets to explicitly surface ${focus1[0] || 'target accounting'} terms where applicable.`,
              'Prepare concrete examples of ledger balancing, invoice verification, or tax filing accuracy from past work.',
            ],
          },
          {
            phase: 'Week 2: Financial Reporting & Audit Readiness',
            focusAreas: focus2,
            actionItems: [
              `Practice explaining end-to-end month-end closing and reporting processes involving ${focus2.join(', ')}.`,
              'Document measurable KPIs such as discrepancy reduction, audit closure turnaround time, and reporting accuracy.',
              'Review common accounting discrepancies and how you resolved them under tight reporting deadlines.',
            ],
          },
          {
            phase: 'Week 3: STAR Synthesis & Mock Interview Drills',
            focusAreas: focus3,
            actionItems: [
              `Structure past achievements in ${focus3.join(', ')} using the XYZ / STAR framework.`,
              'Rehearse 5 domain-specific accounting/finance scenarios and 5 behavioral questions.',
              'Conduct final ATS keyword verification before submitting your tailored application.',
            ],
          },
        ]
      : [
          {
            phase: 'Week 1: Core Requirement Remediation',
            focusAreas: focus1,
            actionItems: [
              `Review practical industry standards and day-to-day workflows for ${focus1.join(' and ')}.`,
              `Update resume experience bullets to explicitly include ${focus1[0] || 'key target'} keywords where applicable.`,
              'Compile concrete examples demonstrating hands-on proficiency in these core areas.',
            ],
          },
          {
            phase: 'Week 2: Operational Depth & KPI Quantification',
            focusAreas: focus2,
            actionItems: [
              `Prepare detailed walkthroughs of projects or workflows integrating ${focus2.join(', ')}.`,
              'Document measurable KPIs such as turnaround time improvements, accuracy rates, and efficiency gains.',
              'Prepare structured explanations for complex operational challenges you resolved.',
            ],
          },
          {
            phase: 'Week 3: STAR Synthesis & Mock Drills',
            focusAreas: focus3,
            actionItems: [
              `Align past achievements in ${focus3.join(', ')} with the XYZ / STAR framework.`,
              'Rehearse 5 role-specific and 5 behavioral scenarios with quantified outcomes.',
              'Conduct final ATS keyword verification before submitting your tailored application.',
            ],
          },
        ];

  const primaryMissing =
    missing[0] ||
    (domain === 'ACCOUNTING' || domain === 'FINANCE'
      ? 'Account Reconciliation'
      : domain === 'OPERATIONS'
      ? 'Workflow Optimization'
      : 'Core Role Execution');
  const secondaryMissing =
    missing[1] ||
    (domain === 'ACCOUNTING' || domain === 'FINANCE'
      ? 'Statutory Compliance'
      : domain === 'OPERATIONS'
      ? 'SLA Management'
      : 'Process Improvement');
  const primaryMatched =
    matched[0] ||
    (domain === 'ACCOUNTING' || domain === 'FINANCE'
      ? 'Financial Reporting'
      : domain === 'OPERATIONS'
      ? 'Operations Management'
      : 'Functional Execution');

  const questionBank =
    domain === 'ACCOUNTING' || domain === 'FINANCE'
      ? [
          {
            category: 'technical',
            question: `Walk me through how you handle ${primaryMissing} during month-end close, and how you identify and resolve discrepancies.`,
            targetConcept: primaryMissing,
            recommendedApproach: `Use the STAR method: describe the volume or complexity of the accounts, the verification steps you took for ${primaryMissing}, and the measurable improvement in accuracy or closing turnaround time.`,
            sampleAnswer: `During monthly closing cycles, we noticed recurring delays caused by unmatched entries in ${primaryMissing}. I standardized the reconciliation checklist, cross-verified sub-ledger balances against supporting vouchers, and resolved pending variances early—reducing month-end closing time by 20% while maintaining 100% audit compliance.`,
          },
          {
            category: 'technical',
            question: `Describe a situation where your expertise in ${primaryMatched} helped prevent a reporting error or improve financial accuracy.`,
            targetConcept: primaryMatched,
            recommendedApproach: `Highlight your attention to detail with ${primaryMatched}, the internal controls you applied, and the resulting impact on compliance or cost variance.`,
            sampleAnswer: `While preparing periodic statements involving ${primaryMatched}, I identified duplicate postings across vendor invoices. I implemented a two-step verification control and reconciled the affected ledger accounts, preventing overpayments and improving reporting accuracy to 99.8%.`,
          },
          {
            category: 'behavioral',
            question: `Tell me about a time you had to quickly adapt to new regulatory or reporting requirements around ${secondaryMissing} under a strict audit deadline.`,
            targetConcept: `Compliance & ${secondaryMissing}`,
            recommendedApproach: 'Emphasize structured preparation, coordination with stakeholders/auditors, and on-time statutory adherence.',
            sampleAnswer: `When updated guidelines for ${secondaryMissing} were introduced ahead of our quarterly filing, I reviewed the statutory circular, updated our filing templates within 48 hours, and coordinated with the internal audit team to complete all submissions ahead of the deadline with zero compliance observations.`,
          },
        ]
      : domain === 'SOFTWARE'
      ? [
          {
            category: 'technical',
            question: `How have you implemented or integrated ${primaryMissing} in a production environment, and what trade-offs did you evaluate?`,
            targetConcept: primaryMissing,
            recommendedApproach: `Use the STAR method: outline the technical constraints, explain why ${primaryMissing} was chosen over alternatives, and quantify the resulting reliability or latency gains.`,
            sampleAnswer: `In a recent software project, we needed to address performance bottlenecks around ${primaryMissing}. I designed a modular implementation with automated validation and fallback handling, which reduced response latency by 25% and improved service reliability.`,
          },
          {
            category: 'technical',
            question: `Walk me through a complex technical challenge where you leveraged ${primaryMatched} to resolve a critical issue.`,
            targetConcept: primaryMatched,
            recommendedApproach: `Highlight your hands-on mastery of ${primaryMatched}. Focus on measurable benchmarks before and after your changes.`,
            sampleAnswer: `While maintaining our core application using ${primaryMatched}, we observed slow query execution under concurrent load. I profiled the execution path and optimized the data access layer, improving response times by 30%.`,
          },
          {
            category: 'behavioral',
            question: `Tell me about a time you had to quickly ramp up on an unfamiliar tool or framework like ${secondaryMissing} to deliver a key milestone.`,
            targetConcept: `Adaptability & ${secondaryMissing}`,
            recommendedApproach: 'Emphasize structured learning, rapid prototyping, and how you validated quality before release.',
            sampleAnswer: `When our team needed to adopt ${secondaryMissing} under a tight sprint deadline, I built a working prototype within 48 hours, documented usage patterns for the team, and delivered the feature on schedule.`,
          },
        ]
      : [
          {
            category: 'technical',
            question: `How have you applied ${primaryMissing} in your day-to-day workflows, and how do you measure its impact on operational outcomes?`,
            targetConcept: primaryMissing,
            recommendedApproach: `Use the STAR method: describe the business context, explain your execution strategy for ${primaryMissing}, and quantify the improvement in turnaround time, quality, or efficiency.`,
            sampleAnswer: `In my previous role, our team faced workflow delays related to ${primaryMissing}. I standardized the execution checklist, aligned cross-functional stakeholders, and tracked weekly KPIs, which improved turnaround time by 22% and ensured consistent delivery quality.`,
          },
          {
            category: 'technical',
            question: `Walk me through a challenging scenario where you used ${primaryMatched} to resolve a process bottleneck or stakeholder issue.`,
            targetConcept: primaryMatched,
            recommendedApproach: `Highlight your practical proficiency in ${primaryMatched}. Focus on measurable before-and-after improvements in efficiency or accuracy.`,
            sampleAnswer: `While managing recurring deliverables involving ${primaryMatched}, I noticed manual handoffs were causing avoidable delays. I restructured the workflow and introduced clear verification checkpoints, reducing error rates by 25% and improving on-time completion.`,
          },
          {
            category: 'behavioral',
            question: `Tell me about a time you had to quickly master a new requirement or process like ${secondaryMissing} to meet a tight deadline.`,
            targetConcept: `Adaptability & ${secondaryMissing}`,
            recommendedApproach: 'Emphasize structured preparation, stakeholder communication, and how you ensured quality under time constraints.',
            sampleAnswer: `When our department introduced new requirements around ${secondaryMissing} on short notice, I documented the updated standard operating procedure, aligned with team members, and delivered the project on schedule with 100% quality compliance.`,
          },
        ];

  const resumeRewrites =
    domain === 'ACCOUNTING' || domain === 'FINANCE'
      ? [
          {
            originalBullet: 'Handled daily accounting entries and monthly reconciliations.',
            rewrittenBullet: `Reconciled general ledger accounts and executed ${primaryMatched} and ${primaryMissing} workflows, reducing discrepancy resolution time by 20% and ensuring 100% statutory compliance.`,
            metricAdded: '20% faster discrepancy resolution & 100% compliance',
          },
        ]
      : [
          {
            originalBullet: 'Managed core role responsibilities and daily team deliverables.',
            rewrittenBullet: generateNeutralBullet(`${primaryMatched} and ${primaryMissing}`, domain),
            metricAdded: '20% efficiency improvement',
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
    resumeRewrites,
    preparationPlan,
    questionBank,
  };
}

export async function generateGapAnalysis(resumeText: string, jobDescription: string): Promise<PrepAnalysisResult> {
  const runtimeKey = getApiKey();
  const detectedDomain = detectJobDomain(jobDescription, resumeText);

  if (!runtimeKey) {
    console.warn('[AI_SERVICE_FALLBACK]: No OPENROUTER_API_KEY / OPENAI_API_KEY found in environment; using deterministic analysis engine.');
    return buildDeterministicFallbackAnalysis(resumeText, jobDescription);
  }

  const runtimeProvider = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: runtimeKey,
  });

  const prompt = `
You are an expert ATS Auditor and Career Coach across all industries (Accounting & Finance, Business Operations, Marketing, Human Resources, Sales, and Software Engineering).

CRITICAL DOMAIN INSTRUCTION (DETECTED DOMAIN HINT: ${detectedDomain}):
1. First, strictly detect the target domain and industry of the TARGET JOB DESCRIPTION (e.g., Accounting & Finance, Business Operations, Marketing, Software Engineering).
2. Require ALL bullet suggestions ("suggestedBullet", "resumeRewrites"), STAR interview questions ("questionBank"), and preparation roadmap tasks ("preparationPlan") to adopt strictly domain-appropriate terminology, day-to-day workflows, and KPIs:
   - For Accounting / Finance: Use metrics like reporting accuracy, reconciliation speed, statutory/tax compliance adherence, audit closure time, ledger balancing, accounts payable/receivable turnaround, and cost variance (e.g., "Reconciled ledger accounts reducing discrepancy resolution time by 20%").
   - For Operations / Management: Use SLA adherence, turnaround time, workflow efficiency, vendor coordination, and resource utilization.
   - For Marketing / Sales: Use campaign ROI, conversion rate, lead velocity, customer acquisition cost, and engagement metrics.
   - For Software Engineering: Use latency, throughput, uptime, code coverage, CI/CD pipeline speed.
3. STRICT PROHIBITION: NEVER inject software engineering terms ("throughput", "high-throughput service", "latency", "p95", "production solutions", "unit tests", "microservices", "scaling bottlenecks") into non-software roles (such as Accounting, Finance, Operations, Marketing, or HR).
4. Ensure STAR interview questions and sample answers reflect the actual day-to-day context of the skill in that specific industry (e.g., handling reconciliation, ledger discrepancies, or audits for "Accounts", NEVER "architecting microservices or high-throughput services for Accounts").

RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

Return ONLY a valid, raw JSON object matching EXACTLY this schema (no markdown fences, no backticks, no comments):
{
  "matchScore": {
    "total": 75,
    "technicalMatch": 80,
    "experienceRelevance": 70,
    "parseabilityScore": 90
  },
  "summary": "Concise 2-sentence evaluation of candidate alignment with the target role.",
  "strengths": ["Matched skill 1", "Matched skill 2"],
  "missingKeywords": ["Missing skill 1", "Missing skill 2"],
  "keywordMatrix": [
    {
      "keyword": "Target Skill Name",
      "category": "Core Role Skill",
      "isRequired": true,
      "isMissing": true,
      "suggestedBullet": "Domain-appropriate XYZ resume bullet incorporating this skill with realistic industry KPIs."
    }
  ],
  "skillGaps": [
    {
      "skill": "Target Skill Name",
      "category": "hard_skill",
      "importance": "high",
      "reason": "Why this skill is important for the target role"
    }
  ],
  "resumeRewrites": [
    {
      "originalBullet": "Original resume bullet",
      "rewrittenBullet": "Rewritten XYZ bullet using domain-specific terminology and realistic KPIs.",
      "metricAdded": "Specific domain metric added"
    }
  ],
  "preparationPlan": [
    {
      "phase": "Week 1: Core Domain Preparation",
      "focusAreas": ["Domain area 1", "Domain area 2"],
      "actionItems": ["Concrete domain-specific study or practice task 1", "Task 2"]
    }
  ],
  "questionBank": [
    {
      "category": "technical",
      "question": "Role-specific interview question grounded in the actual day-to-day workflows of the target domain.",
      "targetConcept": "Target domain concept",
      "recommendedApproach": "STAR method guidance tailored to this industry.",
      "sampleAnswer": "Realistic STAR sample answer using authentic domain workflows and KPIs."
    }
  ]
}
`;

  try {
    let text = '';
    try {
      const primaryResult = await generateText({
        model: runtimeProvider.chat('deepseek/deepseek-chat'),
        prompt,
        temperature: 0.3,
      });
      text = primaryResult.text;
    } catch (primaryErr: any) {
      console.warn('[OPENROUTER_PRIMARY_MODEL_FALLBACK]: Retrying with meta-llama/llama-3.3-70b-instruct:', primaryErr?.message || primaryErr);
      const retryResult = await generateText({
        model: runtimeProvider.chat('meta-llama/llama-3.3-70b-instruct'),
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
