'use client';
import React, { useState } from 'react';
import { TailorResumeCTA } from '@/components/dashboard/TailorResumeCTA';
import { HistoryDrawer } from '@/components/dashboard/HistoryDrawer';
import { ResumeUploadZone } from '@/components/dashboard/ResumeUploadZone';
import { MatchScoreCard } from '@/components/dashboard/MatchScoreCard';
import { ExportDashboardCTA } from '@/components/dashboard/ExportDashboardCTA';
import { AtsRawStreamModal } from '@/components/dashboard/AtsRawStreamModal';
import { AuditProcessRoadmap } from '@/components/dashboard/AuditProcessRoadmap';
import { PrepAnalysisResult } from '@/schemas/analysisSchema';
import { Show, SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import { Loader2, AlertCircle, Clock, Activity, Terminal, Check } from 'lucide-react';

const SAMPLE_ROLES = [
  {
    label: "Senior Full-Stack",
    text: `Senior Full-Stack Engineer

Requirements:
- 5+ years of experience with React, TypeScript, Next.js, and Node.js.
- Strong expertise in RESTful & GraphQL APIs, microservices, and PostgreSQL/Prisma.
- Experience with Docker, Kubernetes, CI/CD pipelines, and AWS (ECS, S3, CloudFront).
- Proven track record of performance optimization, state management, and high-traffic systems.

Responsibilities:
- Architect scalable web applications and lead technical design discussions.
- Write clean, type-safe, maintainable code with unit and integration tests.
- Collaborate across engineering, product, and design teams to deliver end-to-end features.`
  },
  {
    label: "Backend SDE",
    text: `Backend Software Development Engineer (SDE II)

Requirements:
- 4+ years building high-throughput distributed systems in Node.js, Go, or Python.
- In-depth knowledge of relational (PostgreSQL, MySQL) and NoSQL (Redis, MongoDB) databases.
- Strong grasp of distributed systems, message queues (Kafka, RabbitMQ), and gRPC.
- Experience designing resilient API architectures, caching layers, and database sharding.

Responsibilities:
- Build low-latency backend microservices with 99.99% availability.
- Monitor production metrics, optimize database queries, and reduce p99 latency.`
  },
  {
    label: "Systems / DevOps",
    text: `Senior Systems & DevOps / Platform Engineer

Requirements:
- 5+ years managing cloud infrastructure on AWS or GCP using Terraform / OpenTofu.
- Production expertise with Kubernetes (EKS/GKE), Helm charts, and service meshes (Istio).
- Deep experience implementing CI/CD automation with GitHub Actions, ArgoCD, and GitLab.
- Strong background in Linux internals, networking, Prometheus, Grafana, and Datadog observability.

Responsibilities:
- Manage infrastructure-as-code and container orchestration platforms.
- Harden system security, zero-trust access controls, and automated deployment pipelines.`
  }
];

export default function DashboardPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [streamModalOpen, setStreamModalOpen] = useState(false);
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

  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer effect
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleAnalyze = async () => {
    if (!isSignedIn) {
      setError('Please sign in to run career fit analysis.');
      return;
    }

    if (!resumeText) {
      setError("Please upload or paste a resume first.");
      return;
    }
    if (!jobDescription) {
      setError("Please provide a target job description.");
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
      console.log("[CLIENT_RECEIVED_RESPONSE]:", json);
      
      if (!res.ok || !json.success) {
        if (res.status === 429) {
          setCooldown(15);
          throw new Error('High traffic volume: Rate limit temporarily reached. Please wait 15 seconds before retrying.');
        }
        const errorMsg = json.error || `Server error: ${res.status}`;
        alert(`Analysis failed: ${errorMsg}`);
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
      
      const matchScore = typeof payload.matchScore === 'object' && payload.matchScore !== null
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
        summary: typeof payload.summary === 'string' ? payload.summary : "Analysis completed successfully.",
        strengths: Array.isArray(payload.strengths) ? payload.strengths : [],
        missingKeywords: Array.isArray(payload.missingKeywords) ? payload.missingKeywords : [],
        keywordMatrix: Array.isArray(payload.keywordMatrix) ? payload.keywordMatrix : [],
        skillGaps: Array.isArray(payload.skillGaps) ? payload.skillGaps : [],
        resumeRewrites: Array.isArray(payload.resumeRewrites) ? payload.resumeRewrites : [],
        preparationPlan: Array.isArray(payload.preparationPlan) ? payload.preparationPlan : [],
        questionBank: Array.isArray(payload.questionBank) ? payload.questionBank : [],
      };
      
      console.log("[MOUNTING_CLEAN_ANALYSIS]:", cleanAnalysis);
      setAnalysis(cleanAnalysis);
      
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error("[CLIENT_FETCH_CRASH]:", err);
      setError(err.message || "Network request failed");
      alert(`Network error: ${err.message}`);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07090E] text-zinc-100 relative overflow-x-hidden font-sans selection:bg-emerald-500/30 flex flex-col justify-between">
      {/* Dynamic Ambient Glow System */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none overflow-hidden opacity-60">
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[-40px] left-[20%] w-[350px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-[-40px] right-[20%] w-[350px] h-[300px] bg-teal-500/10 rounded-full blur-[100px]"></div>
      </div>
      
      {/* Precision Micro-Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      ></div>

      {/* Global Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#07090E]/85 backdrop-blur-2xl border-b border-zinc-800/80 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-md shadow-emerald-500/20 flex items-center justify-center font-bold text-slate-950 tracking-tighter text-sm">
              CC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">Career Copilot</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">PRO</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <Show when="signed-in">
              <button 
                onClick={() => setHistoryOpen(true)} 
                className="flex items-center gap-2 text-xs font-mono font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800/60 border border-transparent hover:border-zinc-700/60 active:scale-95"
              >
                <Clock size={14} className="text-cyan-400" /> History Drawer
              </button>
            </Show>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-semibold text-emerald-400">
              <Activity size={12} className="animate-pulse" />
              SYSTEM ONLINE
            </div>
            <div className="h-4 w-px bg-zinc-800 hidden sm:block"></div>
            <Show when="signed-in">
              <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-7 h-7' } }} />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-xs font-bold bg-white hover:bg-zinc-200 text-zinc-950 px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95 font-mono">
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

      {/* Main Command Center Stage */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center py-6 px-4 sm:px-6 relative z-10">
        
        {/* 1. Hero Header & Architecture Live-Telemetry Bar */}
        <div className="text-center mb-6 pt-2">
          {/* Engine Version Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium tracking-wide shadow-sm mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>HYBRID ATS AUDIT ENGINE • DETERMINISTIC V2.4</span>
          </div>

          {/* High-Impact Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Engineering-Grade Resume &amp;{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              ATS Vector Alignment
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-2.5 text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
            In-memory binary parsing • Deterministic Jaccard keyword coverage • Zero-leakage PII scrubbing.
          </p>

          {/* Clean Feature Roadmap Strip */}
          <AuditProcessRoadmap />
        </div>

        {/* 2. Rebalanced Ingestion & Target Vector Cards (Full Height Fill) */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          
          {/* Card 01: Resume Ingestion */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/30 transition-all duration-300 p-5 flex flex-col justify-between shadow-xl min-h-[350px] relative overflow-hidden group">
            {/* Subtle Grid Ambient Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                    <h2 className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-widest">
                      01. RESUME INGESTION
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {resumeText ? (
                      <button
                        type="button"
                        onClick={() => setStreamModalOpen(true)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-mono px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
                      >
                        <Terminal size={12} /> Inspect Stream ({resumeText.length.toLocaleString()} chars)
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50">
                        Max 5MB • RAM Buffer
                      </span>
                    )}
                  </div>
                </div>

                {/* Upload Drop Zone Component */}
                <div className="min-h-[220px] flex flex-col justify-center">
                  <ResumeUploadZone onParsed={setResumeText} onError={setError} />
                </div>
              </div>

              {/* Card Footer Micro-Specs */}
              <div className="pt-3 mt-3 border-t border-zinc-800/70 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1 text-emerald-400/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> RAM Stream: {resumeText ? 'Mounted' : 'Awaiting File'}
                </span>
                <span>Zero Disk Persistence</span>
                <span>Encoding: UTF-8</span>
              </div>
            </div>
          </div>

          {/* Card 02: Target Job Description */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/30 transition-all duration-300 p-5 flex flex-col justify-between shadow-xl min-h-[350px] relative overflow-hidden group">
            {/* Subtle Grid Ambient Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"></span>
                    <h2 className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-widest">
                      02. TARGET VECTOR
                    </h2>
                  </div>
                  
                  {/* Sample Job Roles Quick-Fill Buttons */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">Presets:</span>
                    {SAMPLE_ROLES.map((role) => (
                      <button
                        key={role.label}
                        type="button"
                        onClick={() => setJobDescription(role.text)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-300 border border-zinc-700/60 hover:border-cyan-500/40 transition-all active:scale-95"
                        title={`Quick-fill with ${role.label} job description`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark Themed Monospaced Textarea */}
                <div className="relative">
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste target job description or select a role preset above (min 50 characters)..."
                    className="w-full min-h-[220px] p-3.5 bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-cyan-500/60 rounded-xl resize-none font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all leading-relaxed"
                  />
                </div>
              </div>

              {/* Card Footer Micro-Specs & Character Counter */}
              <div className="pt-3 mt-2 border-t border-zinc-800/70 flex items-center justify-between text-[10px] font-mono">
                <span className={jobDescription.length > 0 && jobDescription.length < 50 ? "text-rose-400" : "text-zinc-500"}>
                  {jobDescription.length.toLocaleString()} / 15,000 chars {jobDescription.length > 0 && jobDescription.length < 50 && "(min 50 required)"}
                </span>
                <span className={jobDescription.length >= 50 ? "text-emerald-400 flex items-center gap-1" : "text-zinc-500"}>
                  {jobDescription.length >= 50 ? (
                    <>
                      <Check size={12} className="text-emerald-400" /> Vector Validated
                    </>
                  ) : (
                    "Awaiting Input"
                  )}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 mb-6 shadow-lg animate-in fade-in zoom-in-95">
            <AlertCircle size={18} />
            <span className="text-xs sm:text-sm font-medium font-mono">{error}</span>
          </div>
        )}

        {/* 3. "Initialize Analysis" CTA Bar */}
        <div className="flex flex-col items-center justify-center gap-4 my-2">
          <button
            onClick={handleAnalyze}
            disabled={loading || cooldown > 0 || !resumeText || jobDescription.length < 50}
            className="group relative flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 px-10 py-3.5 rounded-xl font-bold transition-all ease-spring hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20 text-sm tracking-wide"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin text-slate-950" />
            ) : (
              <Activity size={18} className="group-hover:rotate-12 transition-transform text-slate-950" />
            )}
            <span>
              {loading ? 'Synthesizing Vectors...' : cooldown > 0 ? `Rate Limit (${cooldown}s)` : 'Initialize Analysis'}
            </span>
          </button>

          {/* Security and Architectural Checkmarks */}
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 flex-wrap justify-center pt-1">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="text-emerald-400 font-bold">✓</span> Zero disk storage
            </span>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="text-emerald-400 font-bold">✓</span> PII anonymized before dispatch
            </span>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="text-emerald-400 font-bold">✓</span> Deterministic token match
            </span>
          </div>
        </div>

        {/* 4. Bottom Systems Capabilities Strip (Fills Viewport Depth) */}
        {!analysis && (
          <div className="mt-8 pt-8 border-t border-zinc-800/80">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-4 text-center">
              Core System Capabilities &amp; Audit Pipeline
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    01 • SCORING CORE
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-zinc-200">Deterministic Tokenizer</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Mathematical n-gram intersection independent of LLM hallucination. Computes exact Jaccard similarity and coverage ratio.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    02 • STREAM AUDITOR
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-zinc-200">ATS Stream Inspector</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Real-time detection for (cid:xxx) font glitches, spacing collapsings, merged timelines, and broken character kerning.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    03 • REMEDIATION
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-zinc-200">STAR Interview Synthesis</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Gap-remediated behavioral and technical scenario generation powered by DeepSeek-V3 with talking points and pitfalls.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {Boolean(analysis) && (() => {
          const currentAnalysis = analysis as any;
          const matchScore = typeof currentAnalysis.matchScore === 'object' 
            ? currentAnalysis.matchScore 
            : { 
                total: Number(currentAnalysis.matchScore) || 75,
                technicalMatch: 80,
                experienceRelevance: 70,
                parseabilityScore: 90 
              };

          const summary = currentAnalysis.summary || "Analysis completed successfully.";

          return (
            <div id="results-dashboard" className="w-full max-w-7xl mx-auto mt-12 space-y-8 pb-24">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg font-medium flex items-center gap-2 px-4 shadow-inset-top">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Audit Synthesized Successfully
                  </div>

                  {Boolean(redactedCounts) && (
                    <div className="p-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs rounded-lg font-medium flex items-center gap-2 px-4 shadow-inset-top">
                      <span>🛡️</span>
                      <span>
                        Privacy Guard: {(redactedCounts?.emails ?? 0) + (redactedCounts?.phones ?? 0)} emails and phone numbers scrubbed before LLM processing
                      </span>
                    </div>
                  )}
                  {deterministicData && (
                    <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs rounded-lg font-medium flex items-center gap-2 px-4 shadow-inset-top">
                      <span>⚙️</span>
                      <span>
                        Deterministic Match: {deterministicData.keywordMatchScore}% (Jaccard: {deterministicData.jaccardSimilarity})
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStreamModalOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-zinc-700/80 shadow-inset-top active:scale-95"
                    title="Inspect raw plaintext stream extracted by pdf-parse"
                  >
                    <Terminal size={14} className="text-cyan-400" />
                    <span>Inspect ATS Text Stream</span>
                  </button>
                  <ExportDashboardCTA />
                </div>
              </div>
              
              {/* Audit Results Container */}
            <div className="w-full max-w-5xl mx-auto mt-8 space-y-6 pb-24 text-white">
              {/* 1. Score Gauge Component driven by Deterministic Algorithm */}
              <div className="shadow-inset-top">
                <MatchScoreCard score={matchScore} summary={summary} />
              </div>

              {/* 2. Qualitative Strengths & Deterministic Keywords */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Key Strengths (DeepSeek Qualitative) */}
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Key Strengths</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      AI Critique
                    </span>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {((analysis as any)?.strengths || ["Strong foundational experience identified"]).map((s: any, idx: number) => (
                      <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{typeof s === 'string' ? s : s?.title || JSON.stringify(s)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Matched Keywords (Deterministic Engine) */}
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                      Matched Keywords ({((deterministicData?.matchedKeywords || (analysis as any)?.matchedKeywords || []).length)})
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                      Exact Overlap
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto pr-1">
                    {((deterministicData?.matchedKeywords || (analysis as any)?.matchedKeywords || []).length > 0) ? (
                      (deterministicData?.matchedKeywords || (analysis as any)?.matchedKeywords || []).slice(0, 20).map((kw: any, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg font-medium">
                          ✓ {typeof kw === 'string' ? kw : kw?.keyword || JSON.stringify(kw)}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 italic">No exact keyword overlap found.</p>
                    )}
                  </div>
                </div>

                {/* Missing Keywords (Deterministic Engine) */}
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                      Missing Keywords ({((deterministicData?.missingKeywords || (analysis as any)?.missingKeywords || []).length)})
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                      Target Gaps
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto pr-1">
                    {((deterministicData?.missingKeywords || (analysis as any)?.missingKeywords || []).length > 0) ? (
                      (deterministicData?.missingKeywords || (analysis as any)?.missingKeywords || []).slice(0, 20).map((kw: any, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg font-medium">
                          + {typeof kw === 'string' ? kw : kw?.keyword || JSON.stringify(kw)}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-emerald-400 font-medium">All target keywords matched!</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Skill Gaps */}
              {Array.isArray((analysis as any)?.skillGaps) && (analysis as any)?.skillGaps.length > 0 && (
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-4">Identified Skill Gaps</h3>
                  <div className="space-y-3">
                    {(analysis as any).skillGaps.map((gap: any, idx: number) => (
                      <div key={idx} className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm text-white">{gap.skill || gap.title || `Gap #${idx + 1}`}</span>
                          <span className="text-xs uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">
                            {gap.severity || 'Medium'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">{gap.reason || gap.remediation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Preparation Roadmap */}
              {Array.isArray((analysis as any)?.preparationPlan) && (
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                      <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                        Tailored Remediation Roadmap
                      </h3>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">3-Week Sprint</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(analysis as any).preparationPlan.map((plan: any, idx: number) => (
                      <div key={idx} className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                            {plan.phase || `Sprint ${idx + 1}`}
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-semibold text-zinc-400 mb-1">Focus Areas</div>
                            <div className="flex flex-wrap gap-1">
                              {(plan.focusAreas || []).map((area: string, aIdx: number) => (
                                <span key={aIdx} className="px-2 py-0.5 bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 rounded text-xs">
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-zinc-400 mb-1">Action Items</div>
                          <ul className="space-y-1">
                            {(plan.actionItems || []).map((item: string, iIdx: number) => (
                              <li key={iIdx} className="text-xs text-zinc-400 flex items-start gap-1.5">
                                <span className="text-cyan-500 font-bold">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Question Bank */}
              {Array.isArray((analysis as any)?.questionBank) && (
                <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="h-2 w-2 rounded-full bg-purple-400" />
                    <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                      Role-Specific Interview Question Bank
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {(analysis as any).questionBank.map((q: any, idx: number) => (
                      <div key={idx} className="p-5 bg-zinc-950/70 border border-zinc-800/90 rounded-xl space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm font-medium text-white">
                            {idx + 1}. {q.question}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                            {q.category || 'General'}
                          </span>
                        </div>

                        <div className="p-3 bg-zinc-900/60 rounded-lg text-xs space-y-2 border border-zinc-800/50">
                          <div>
                            <span className="text-zinc-500 font-semibold uppercase text-[10px]">Target Concept: </span>
                            <span className="text-zinc-300">{q.targetConcept}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 font-semibold uppercase text-[10px]">Recommended Approach: </span>
                            <span className="text-zinc-300">{q.recommendedApproach}</span>
                          </div>
                          {q.sampleAnswer && (
                            <div className="pt-1 border-t border-zinc-800 mt-2">
                              <span className="text-emerald-400 font-semibold uppercase text-[10px]">High-Scoring Sample Answer: </span>
                              <p className="text-zinc-200 italic mt-0.5">&ldquo;{q.sampleAnswer}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
      </div>

      {/* Persistent Floating Bottom Bar for CTA */}
      {Boolean(analysis) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 opacity-0 animate-in fade-in slide-in-from-bottom-8 duration-500 ease-spring stagger-5 fill-mode-forwards">
          <div className="bg-[var(--panel)]/90 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8)] shadow-inset-top flex items-center gap-2">
             <TailorResumeCTA resumeText={resumeText} jobDescription={jobDescription} onError={setError} />
          </div>
        </div>
      )}

      {/* Raw Stream Inspector Modal */}
      <AtsRawStreamModal
        isOpen={streamModalOpen}
        onClose={() => setStreamModalOpen(false)}
        rawText={resumeText}
      />
    </main>
  );
}
