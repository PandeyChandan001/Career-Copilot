'use client';
import React, { useState } from 'react';
import { TailorResumeCTA } from '@/components/dashboard/TailorResumeCTA';
import { HistoryDrawer } from '@/components/dashboard/HistoryDrawer';
import { ResumeUploadZone } from '@/components/dashboard/ResumeUploadZone';
import { MatchScoreCard } from '@/components/dashboard/MatchScoreCard';
import { ExportDashboardCTA } from '@/components/dashboard/ExportDashboardCTA';
import { AtsRawStreamModal } from '@/components/dashboard/AtsRawStreamModal';
import { AuditProcessRoadmap } from '@/components/dashboard/AuditProcessRoadmap';
import { KeywordMatrix } from '@/components/dashboard/KeywordMatrix';
import { PrepAnalysisResult } from '@/schemas/analysisSchema';
import { Show, SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import { Loader2, AlertCircle, Clock, FileText } from 'lucide-react';

const SAMPLE_ROLES = [
  {
    label: 'Senior Full-Stack',
    text: `Senior Full-Stack Engineer

Requirements:
- 5+ years of experience with React, TypeScript, Next.js, and Node.js.
- Strong expertise in RESTful & GraphQL APIs, microservices, and PostgreSQL/Prisma.
- Experience with Docker, Kubernetes, CI/CD pipelines, and AWS (ECS, S3, CloudFront).
- Proven track record of performance optimization, state management, and high-traffic systems.

Responsibilities:
- Architect scalable web applications and lead technical design discussions.
- Write clean, type-safe, maintainable code with unit and integration tests.
- Collaborate across engineering, product, and design teams to deliver end-to-end features.`,
  },
  {
    label: 'Backend SDE',
    text: `Backend Software Development Engineer (SDE II)

Requirements:
- 4+ years building high-throughput distributed systems in Node.js, Go, or Python.
- In-depth knowledge of relational (PostgreSQL, MySQL) and NoSQL (Redis, MongoDB) databases.
- Strong grasp of distributed systems, message queues (Kafka, RabbitMQ), and gRPC.
- Experience designing resilient API architectures, caching layers, and database sharding.

Responsibilities:
- Build low-latency backend microservices with 99.99% availability.
- Monitor production metrics, optimize database queries, and reduce p99 latency.`,
  },
  {
    label: 'Systems / DevOps',
    text: `Senior Systems & DevOps / Platform Engineer

Requirements:
- 5+ years managing cloud infrastructure on AWS or GCP using Terraform / OpenTofu.
- Production expertise with Kubernetes (EKS/GKE), Helm charts, and service meshes (Istio).
- Deep experience implementing CI/CD automation with GitHub Actions, ArgoCD, and GitLab.
- Strong background in Linux internals, networking, Prometheus, Grafana, and Datadog observability.

Responsibilities:
- Manage infrastructure-as-code and container orchestration platforms.
- Harden system security, zero-trust access controls, and automated deployment pipelines.`,
  },
];

export default function DashboardPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [streamModalOpen, setStreamModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'interview' | 'roadmap'>('interview');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<PrepAnalysisResult | null>(null);
  const [redactedCounts, setRedactedCounts] = useState<{ emails: number; phones: number; urls: number } | null>(null);
  const [deterministicData, setDeterministicData] = useState<{
    keywordMatchScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    jaccardSimilarity: number;
    coverageRatio: number;
  } | null>(null);
  const { isSignedIn } = useAuth();

  const handleAnalyze = async () => {
    if (!isSignedIn) {
      setError('Please sign in to run resume analysis.');
      return;
    }

    if (!resumeText) {
      setError('Please upload a PDF resume first.');
      return;
    }
    if (!jobDescription) {
      setError('Please provide a target job description.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setAnalysis(null);
      setRedactedCounts(null);
      setDeterministicData(null);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg = json.error || `Server error: ${res.status}`;
        throw new Error(errorMsg);
      }

      const counts = json.redactedCounts || json.meta?.redactedCounts;
      if (counts) {
        setRedactedCounts(counts);
      }

      const det = json.deterministicScoring || json.meta?.deterministicScoring || (json.analysis as any)?.deterministicScoring;
      if (det) {
        setDeterministicData(det);
      }

      const rawPayload = json.analysis || json.data || json;
      const payload = rawPayload.analysis ? rawPayload.analysis : rawPayload;

      const matchScore =
        typeof payload.matchScore === 'object' && payload.matchScore !== null
          ? {
              total: Number(payload.matchScore.total) || 75,
              technicalMatch: Number(payload.matchScore.technicalMatch) || 70,
              experienceRelevance: Number(payload.matchScore.experienceRelevance) || 70,
              parseabilityScore: Number(payload.matchScore.parseabilityScore) || 90,
            }
          : {
              total: Number(payload.matchScore) || 75,
              technicalMatch: 70,
              experienceRelevance: 70,
              parseabilityScore: 90,
            };

      const cleanAnalysis: PrepAnalysisResult = {
        matchScore,
        summary: typeof payload.summary === 'string' ? payload.summary : 'Analysis completed.',
        strengths: Array.isArray(payload.strengths) ? payload.strengths : [],
        missingKeywords: Array.isArray(payload.missingKeywords) ? payload.missingKeywords : [],
        keywordMatrix: Array.isArray(payload.keywordMatrix) ? payload.keywordMatrix : [],
        skillGaps: Array.isArray(payload.skillGaps) ? payload.skillGaps : [],
        resumeRewrites: Array.isArray(payload.resumeRewrites) ? payload.resumeRewrites : [],
        preparationPlan: Array.isArray(payload.preparationPlan) ? payload.preparationPlan : [],
        questionBank: Array.isArray(payload.questionBank) ? payload.questionBank : [],
      };

      setAnalysis(cleanAnalysis);

      setTimeout(() => {
        document.getElementById('results-dashboard')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Network request failed');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const matchedSkillsList: string[] =
    deterministicData?.matchedKeywords ||
    (analysis as any)?.matchedKeywords ||
    [];

  const missingSkillsList: string[] =
    deterministicData?.missingKeywords ||
    analysis?.missingKeywords ||
    [];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col justify-between">
      {/* Simple Functional Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold tracking-tight text-zinc-100">
              Career Copilot
            </span>
            <span className="text-xs text-zinc-500 hidden sm:inline">
              ATS Resume Auditor &amp; Interview Prep
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Show when="signed-in">
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 px-3 py-1.5 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
              >
                <Clock size={14} /> History
              </button>
              <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-7 h-7' } }} />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </Show>
          </div>
        </div>
      </header>

      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestore={(rt, jd, result) => {
          setResumeText(rt);
          setJobDescription(jd);
          setAnalysis(result);
          setRedactedCounts(null);
          setDeterministicData(null);
          setError('');
        }}
      />

      {/* Main Content Container */}
      <div className="w-full max-w-6xl mx-auto flex-1 py-8 px-4 sm:px-6 space-y-8">
        {/* Intro Title Block */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
            Resume &amp; Job Description Alignment
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Parse your resume PDF in memory, redact personal contact details, and measure exact keyword overlap against your target role.
          </p>
        </div>

        {/* Two Side-by-Side Functional Input Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Resume */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-100">Upload Resume</h2>
                {resumeText ? (
                  <button
                    type="button"
                    onClick={() => setStreamModalOpen(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-medium"
                  >
                    <FileText size={13} /> Raw ATS Text Extractor ({resumeText.length.toLocaleString()} chars)
                  </button>
                ) : (
                  <span className="text-xs text-zinc-500">PDF up to 5MB</span>
                )}
              </div>

              <ResumeUploadZone onParsed={setResumeText} onError={setError} />
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <span>{resumeText ? 'Resume loaded in memory' : 'Waiting for PDF upload'}</span>
              <span>Privacy Filter (Contact Redaction) enabled</span>
            </div>
          </div>

          {/* Job Description */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">Job Description</h2>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-500">Templates:</span>
                  {SAMPLE_ROLES.map((role) => (
                    <button
                      key={role.label}
                      type="button"
                      onClick={() => setJobDescription(role.text)}
                      className="text-xs px-2.5 py-1 rounded-md bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here (minimum 50 characters)..."
                className="w-full min-h-[220px] p-3.5 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl resize-none text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <span className={jobDescription.length > 0 && jobDescription.length < 50 ? 'text-rose-400' : 'text-zinc-500'}>
                {jobDescription.length.toLocaleString()} characters {jobDescription.length > 0 && jobDescription.length < 50 && '(minimum 50 required)'}
              </span>
              <span>{jobDescription.length >= 50 ? 'Ready' : 'Minimum 50 characters'}</span>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-900/60 text-rose-300 p-4 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:px-6">
          <div className="text-xs text-zinc-400">
            Files are parsed in memory without disk storage. Contact details are redacted prior to analysis.
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !resumeText || jobDescription.length < 50}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>{loading ? 'Analyzing Resume...' : 'Analyze Resume'}</span>
          </button>
        </div>

        {!analysis && <AuditProcessRoadmap />}

        {/* Results Section */}
        {Boolean(analysis) && (() => {
          const currentAnalysis = analysis as any;
          const matchScore =
            typeof currentAnalysis.matchScore === 'object'
              ? currentAnalysis.matchScore
              : {
                  total: Number(currentAnalysis.matchScore) || 75,
                  technicalMatch: 80,
                  experienceRelevance: 70,
                  parseabilityScore: 90,
                };

          const summary = currentAnalysis.summary || 'Analysis completed.';

          return (
            <div id="results-dashboard" className="space-y-6 pt-4 pb-16">
              {/* Toolbar & Privacy Filter Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {Boolean(redactedCounts) && (
                    <span className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                      Privacy Filter (Contact Redaction): {(redactedCounts?.emails ?? 0) + (redactedCounts?.phones ?? 0) + (redactedCounts?.urls ?? 0)} item(s) redacted
                    </span>
                  )}
                  {deterministicData && (
                    <span className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                      Keyword Overlap: {deterministicData.keywordMatchScore}% (Jaccard: {deterministicData.jaccardSimilarity})
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setStreamModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs font-medium border border-zinc-800 transition-colors"
                  >
                    <FileText size={14} />
                    <span>Raw ATS Text Extractor</span>
                  </button>
                  <TailorResumeCTA resumeText={resumeText} jobDescription={jobDescription} onError={setError} />
                  <ExportDashboardCTA />
                </div>
              </div>

              {/* 1. Match Score Overview */}
              <MatchScoreCard score={matchScore} summary={summary} />

              {/* 2. Matched Skills & Missing Skills Matrix */}
              <KeywordMatrix
                keywords={currentAnalysis.keywordMatrix}
                matchedKeywords={matchedSkillsList}
                missingKeywords={missingSkillsList}
              />

              {/* 3. Strengths & Skill Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
                  <h3 className="text-base font-semibold text-zinc-100">Matched Skills &amp; Strengths</h3>
                  <ul className="space-y-2.5">
                    {(currentAnalysis.strengths || ['Relevant technical experience identified.']).map((s: any, idx: number) => (
                      <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{typeof s === 'string' ? s : s?.title || JSON.stringify(s)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {Array.isArray(currentAnalysis.skillGaps) && currentAnalysis.skillGaps.length > 0 && (
                  <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
                    <h3 className="text-base font-semibold text-zinc-100">Missing Skills &amp; Priority Gaps</h3>
                    <div className="space-y-3">
                      {currentAnalysis.skillGaps.map((gap: any, idx: number) => (
                        <div key={idx} className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm text-zinc-100">
                              {gap.skill || gap.title || `Skill Gap ${idx + 1}`}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                              {gap.importance || gap.severity || 'Important'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{gap.reason || gap.remediation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Tabbed Action Items: STAR Interview Practice & Remediation Roadmap */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="flex border-b border-zinc-800 bg-zinc-950/50 px-6 pt-3 gap-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('interview')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'interview'
                        ? 'border-emerald-600 text-zinc-100'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Interview Preparation (STAR Practice)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('roadmap')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'roadmap'
                        ? 'border-emerald-600 text-zinc-100'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Remediation Roadmap
                  </button>
                </div>

                <div className="p-6">
                  {activeTab === 'interview' ? (
                    <div className="space-y-4">
                      {Array.isArray(currentAnalysis.questionBank) && currentAnalysis.questionBank.length > 0 ? (
                        currentAnalysis.questionBank.map((q: any, idx: number) => (
                          <div key={idx} className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <h4 className="text-sm font-medium text-zinc-100">
                                {idx + 1}. {q.question}
                              </h4>
                              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800 shrink-0 capitalize">
                                {q.category || 'Technical'}
                              </span>
                            </div>

                            <div className="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-900">
                              <div>
                                <span className="font-semibold text-zinc-300">Target Concept: </span>
                                <span>{q.targetConcept}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-zinc-300">STAR Approach: </span>
                                <span>{q.recommendedApproach}</span>
                              </div>
                              {q.sampleAnswer && (
                                <div className="pt-2">
                                  <span className="font-semibold text-emerald-400 block mb-1">Sample Answer:</span>
                                  <p className="text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                                    {q.sampleAnswer}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500">No interview questions generated.</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Array.isArray(currentAnalysis.preparationPlan) && currentAnalysis.preparationPlan.length > 0 ? (
                        currentAnalysis.preparationPlan.map((plan: any, idx: number) => (
                          <div key={idx} className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="text-sm font-semibold text-zinc-100">
                                {plan.phase || `Week ${idx + 1}`}
                              </div>
                              <div>
                                <div className="text-xs font-medium text-zinc-400 mb-1.5">Focus Areas</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {(plan.focusAreas || []).map((area: string, aIdx: number) => (
                                    <span key={aIdx} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded text-xs">
                                      {area}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-zinc-400 mb-1.5">Action Items</div>
                              <ul className="space-y-1.5">
                                {(plan.actionItems || []).map((item: string, iIdx: number) => (
                                  <li key={iIdx} className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                                    <span className="text-emerald-500 font-bold">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500">No roadmap steps available.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Raw ATS Text Extractor Modal */}
      <AtsRawStreamModal
        isOpen={streamModalOpen}
        onClose={() => setStreamModalOpen(false)}
        rawText={resumeText}
      />
    </main>
  );
}
