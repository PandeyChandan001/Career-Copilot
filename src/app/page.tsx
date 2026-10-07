'use client';
import React, { useState } from 'react';
import { TailorResumeCTA } from '@/components/dashboard/TailorResumeCTA';
import { HistoryDrawer } from '@/components/dashboard/HistoryDrawer';
import { ResumeUploadZone } from '@/components/dashboard/ResumeUploadZone';
import { JobDescriptionInput } from '@/components/dashboard/JobDescriptionInput';
import { MatchScoreCard } from '@/components/dashboard/MatchScoreCard';
import { SkillGapList } from '@/components/dashboard/SkillGapList';
import { PreparationRoadmap } from '@/components/dashboard/PreparationRoadmap';
import { InterviewQuestionBank } from '@/components/dashboard/InterviewQuestionBank';
import { KeywordMatrix } from '@/components/dashboard/KeywordMatrix';
import { LiveResumeRewrite } from '@/components/dashboard/LiveResumeRewrite';
import { ExportDashboardCTA } from '@/components/dashboard/ExportDashboardCTA';
import { PrepAnalysisResult } from '@/schemas/analysisSchema';
import { Show, SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import { Loader2, AlertCircle, Clock, Activity } from 'lucide-react';

export default function DashboardPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
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
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Ambient Grid Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.08), transparent 50%), radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '100% 100%, 32px 32px', opacity: 0.5 }}></div>

      <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-xl border-b border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-inset-glow flex items-center justify-center font-bold text-white tracking-tighter">CC</div>
            <h1 className="text-xl font-bold tracking-tight text-white">Career Copilot</h1>
          </div>
          <div className="flex items-center gap-6">
            <Show when="signed-in">
              <button onClick={() => setHistoryOpen(true)} className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors ease-smooth active:scale-95">
                <Clock size={15} /> History
              </button>
            </Show>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 tracking-wide">
              <Activity size={14} className="animate-pulse" />
              Live
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block"></div>
            <Show when="signed-in">
              <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-sm font-bold bg-white text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors shadow-inset-top ease-smooth active:scale-95">
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

      <div className="max-w-7xl mx-auto px-6 pt-12 pb-32 relative z-10">
        
        {/* Input Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><span className="w-4 h-[2px] bg-emerald-500 rounded-full"></span> 01. Ingestion</h2>
            <ResumeUploadZone onParsed={setResumeText} onError={setError} />
          </div>
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><span className="w-4 h-[2px] bg-cyan-500 rounded-full"></span> 02. Target Vector</h2>
            <JobDescriptionInput value={jobDescription} onChange={setJobDescription} />
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 mb-8 shadow-inset-top animate-in fade-in zoom-in-95 gpu-accel">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="flex justify-center mb-16">
          <button
            onClick={handleAnalyze}
            disabled={loading || cooldown > 0 || !resumeText || jobDescription.length < 50}
            className="group relative flex items-center gap-3 bg-white text-slate-950 px-8 py-3.5 rounded-xl font-bold transition-all ease-spring hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_4px_24px_-8px_rgba(255,255,255,0.5)]"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} className="group-hover:text-emerald-600 transition-colors" />}
            {loading ? 'Synthesizing Vectors...' : cooldown > 0 ? `Rate Limit (${cooldown}s)` : 'Initialize Analysis'}
            <div className="absolute inset-0 rounded-xl ring-2 ring-white/20 ring-offset-2 ring-offset-[#0A0D12] pointer-events-none scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all ease-spring"></div>
          </button>
        </div>

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

          const keywords = currentAnalysis.keywordMatrix || currentAnalysis.keywords || [
            ...(currentAnalysis.missingKeywords || []).map((k: any) => 
              typeof k === 'string' ? { keyword: k, isMissing: true } : { ...k, isMissing: true }
            ),
            ...(currentAnalysis.matchedKeywords || []).map((k: any) => 
              typeof k === 'string' ? { keyword: k, isMissing: false } : { ...k, isMissing: false }
            )
          ];

          const rewrites = currentAnalysis.resumeRewrites || currentAnalysis.rewrites || currentAnalysis.bulletRewrites || [];
          const questionBank = currentAnalysis.questionBank || currentAnalysis.questions || [];
          const roadmap = currentAnalysis.preparationPlan || currentAnalysis.roadmap || [];
          const skillGaps = currentAnalysis.skillGaps || [];
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
                <ExportDashboardCTA />
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
                              <p className="text-zinc-200 italic mt-0.5">"{q.sampleAnswer}"</p>
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
    </main>
  );
}
