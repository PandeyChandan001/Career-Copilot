import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { TailoredResumeSchema, TailoredResumeData } from '../schemas/resumeSchema';
import { AppError } from '../lib/errors/AppError';
import { ATSResumeDocument } from '../components/pdf/ATSResumeDocument';
import { calculateDeterministicMatch } from '../lib/scoring';
import { getApiKey, detectJobDomain, generateNeutralBullet } from './aiService';

function buildFallbackResumeData(resumeText: string, jobDescription: string): TailoredResumeData {
  const det = calculateDeterministicMatch(resumeText, jobDescription);
  const domain = detectJobDomain(jobDescription, resumeText);
  const lines = resumeText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const fullName = lines[0]?.slice(0, 60) || 'Candidate Profile';
  const emailMatch = resumeText.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const phoneMatch = resumeText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

  const combinedSkills = Array.from(
    new Set([...det.matchedKeywords.slice(0, 10), ...det.missingKeywords.slice(0, 6)])
  );

  const defaultSkills =
    domain === 'ACCOUNTING' || domain === 'FINANCE'
      ? ['Financial Reporting', 'General Ledger Reconciliation', 'Accounts Payable & Receivable', 'Statutory Compliance', 'Variance Analysis']
      : domain === 'OPERATIONS'
      ? ['Operations Management', 'Process Optimization', 'SLA Governance', 'Vendor Coordination', 'Cross-Functional Execution']
      : domain === 'MARKETING'
      ? ['Campaign Management', 'Market Analysis', 'Performance Analytics', 'Content Strategy', 'Stakeholder Engagement']
      : domain === 'SOFTWARE'
      ? ['Software Engineering', 'System Architecture', 'TypeScript', 'React', 'Node.js']
      : ['Project Execution', 'Process Improvement', 'Stakeholder Alignment', 'Data Analysis', 'Quality Assurance'];

  const topSkills = combinedSkills.length > 0 ? combinedSkills : defaultSkills;

  const defaultRoleTitle =
    domain === 'ACCOUNTING'
      ? 'Accountant & Financial Analyst'
      : domain === 'FINANCE'
      ? 'Financial Analyst'
      : domain === 'OPERATIONS'
      ? 'Operations Specialist'
      : domain === 'MARKETING'
      ? 'Marketing Specialist'
      : domain === 'SOFTWARE'
      ? 'Software Engineer'
      : 'Professional Specialist';

  const defaultDegree =
    domain === 'ACCOUNTING' || domain === 'FINANCE'
      ? 'Bachelor of Commerce (B.Com) in Accounting & Finance'
      : domain === 'OPERATIONS' || domain === 'MARKETING'
      ? 'Bachelor of Business Administration (BBA)'
      : domain === 'SOFTWARE'
      ? 'Bachelor of Technology in Computer Science'
      : 'Bachelor Degree';

  return {
    fullName,
    contact: {
      email: emailMatch ? emailMatch[0] : 'candidate@example.com',
      phone: phoneMatch ? phoneMatch[0] : '+1-555-0100',
      location: 'Remote / Hybrid',
    },
    summary: `Results-driven professional with proven expertise in ${topSkills.slice(0, 5).join(', ')}. Adept at streamlining day-to-day workflows and delivering measurable operational impact aligned with organizational standards.`,
    skills: topSkills,
    experience: [
      {
        role: defaultRoleTitle,
        company: 'Enterprise Solutions Group',
        location: 'On-site / Hybrid',
        dateRange: '2022 - Present',
        bulletPoints: [
          generateNeutralBullet(topSkills.slice(0, 2).join(' and ') || 'core workflows', domain),
          generateNeutralBullet(topSkills.slice(2, 4).join(' and ') || 'reporting standards', domain),
          domain === 'ACCOUNTING' || domain === 'FINANCE'
            ? 'Reconciled general ledger accounts and verified supporting vouchers, reducing discrepancy resolution time by 20% and maintaining 100% audit readiness.'
            : 'Collaborated across departments to standardize recurring processes and improve on-time delivery benchmarks by 20%.',
        ],
      },
    ],
    education: [
      {
        institution: 'University',
        degree: defaultDegree,
        year: '2022',
      },
    ],
  };
}

export async function generateTailoredResumeData(
  resumeText: string,
  jobDescription: string
): Promise<TailoredResumeData> {
  const runtimeKey = getApiKey();
  const detectedDomain = detectJobDomain(jobDescription, resumeText);

  if (!runtimeKey) {
    return buildFallbackResumeData(resumeText, jobDescription);
  }

  const runtimeProvider = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: runtimeKey,
  });

  const prompt = `You are an expert executive resume writer and ATS specialist across all industries (Accounting & Finance, Business Operations, Marketing, HR, and Software Engineering).
Extract the candidate's real experience and rewrite bullet points using the XYZ formula (Accomplished [X], measured by [Y], by doing [Z]).

CRITICAL DOMAIN RULES (DETECTED DOMAIN: ${detectedDomain}):
1. Strictly preserve the candidate's actual industry and target role domain from the Job Description.
2. Use ONLY domain-appropriate terminology and KPIs:
   - For Accounting / Finance: Use accuracy, reconciliation speed, compliance adherence, audit closure time, ledger balancing, and cost variance (e.g., "Reconciled ledger accounts reducing discrepancy resolution time by 20%").
   - For Operations / Management: Use SLA adherence, turnaround time, workflow efficiency.
   - For Software Engineering: Use latency, throughput, uptime, code coverage, CI/CD pipeline speed.
3. NEVER inject software engineering phrasing ("throughput", "high-throughput service", "latency", "production solutions", "unit tests", "microservices", "CI/CD") into non-software resumes (like Accounting, Finance, Marketing, or Operations).
4. Naturally weave in relevant target keywords from the job description without fabricating experiences or credentials the candidate never held.

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
  "summary": "2-3 sentence career summary tailored to the target role and domain.",
  "skills": ["Skill 1", "Skill 2"],
  "experience": [
    {
      "role": "Role Title",
      "company": "Company Name",
      "location": "Location",
      "dateRange": "Start - End",
      "bulletPoints": ["Rewritten domain-appropriate XYZ bullet 1", "Rewritten domain-appropriate XYZ bullet 2"]
    }
  ],
  "education": [
    {
      "institution": "Institution Name",
      "degree": "Degree",
      "year": "Graduation Year",
      "highlights": ["Highlight 1"]
    }
  ],
  "projects": [
    {
      "name": "Project or Initiative Name",
      "technologies": "Tools / Standards Used",
      "bulletPoints": ["Measurable achievement 1"]
    }
  ]
}`;

  try {
    const { text } = await generateText({
      model: runtimeProvider.chat('deepseek/deepseek-chat'),
      prompt,
      temperature: 0.3,
    });

    if (!text) {
      return buildFallbackResumeData(resumeText, jobDescription);
    }

    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    const validated = TailoredResumeSchema.safeParse(parsed);

    if (!validated.success) {
      const fallback = buildFallbackResumeData(resumeText, jobDescription);
      return {
        fullName: parsed.fullName || fallback.fullName,
        contact: {
          email: parsed.contact?.email || fallback.contact.email,
          phone: parsed.contact?.phone || fallback.contact.phone,
          location: parsed.contact?.location || fallback.contact.location,
          linkedIn: parsed.contact?.linkedIn,
          github: parsed.contact?.github,
        },
        summary: parsed.summary || fallback.summary,
        skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : fallback.skills,
        experience: Array.isArray(parsed.experience) && parsed.experience.length > 0 ? parsed.experience : fallback.experience,
        education: Array.isArray(parsed.education) && parsed.education.length > 0 ? parsed.education : fallback.education,
        projects: Array.isArray(parsed.projects) ? parsed.projects : undefined,
      };
    }

    return validated.data;
  } catch (error) {
    console.warn('[RESUME_GEN_FALLBACK]:', error);
    return buildFallbackResumeData(resumeText, jobDescription);
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
