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

    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const raw = await res.json();
      console.log("[ANALYZE_RAW_PAYLOAD]:", raw);
      
      if (!res.ok) {
        if (res.status === 429) {
          setCooldown(15);
          throw new Error('High traffic volume: Rate limit temporarily reached. Please wait 15 seconds before retrying.');
        }
        throw new Error(raw.error || raw.message || `Server responded with ${res.status}`);
      }
      
      // Normalize whether the payload is top-level or nested under .data or .analysis
      const payload = raw.analysis || raw.data || raw;
      
      if (payload && typeof payload.matchScore === 'number') {
        setAnalysis(payload);
      } else if (!raw.success) {
        throw new Error(raw.error || 'Failed to analyze gap.');
      } else {
        throw new Error('Analysis returned an invalid payload structure.');
      }
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please check connection and try again.');
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
        {analysis && typeof analysis.matchScore === 'number' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-spring">
            <div className="opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-smooth stagger-1 fill-mode-forwards">
              <MatchScoreCard score={analysis.matchScore} summary={analysis.summary} />
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-12">
                <section className="opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-smooth stagger-2 fill-mode-forwards">
                  <h2 className="text-xl font-bold tracking-tight text-white mb-6">Skill Gap Matrix</h2>
                  <SkillGapList gaps={analysis.skillGaps} />
                </section>
                <section className="opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-smooth stagger-3 fill-mode-forwards">
                  <h2 className="text-xl font-bold tracking-tight text-white mb-6">Scenario Simulator</h2>
                  <InterviewQuestionBank questions={analysis.questionBank} />
                </section>
              </div>
              <div className="lg:col-span-4 space-y-12">
                <section className="bg-[var(--panel)] p-6 rounded-2xl panel-border shadow-inset-top opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-smooth stagger-4 fill-mode-forwards">
                  <h2 className="text-xl font-bold tracking-tight text-white mb-6">Action Roadmap</h2>
                  <PreparationRoadmap plan={analysis.preparationPlan} />
                </section>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Floating Bottom Bar for CTA */}
      {analysis && typeof analysis.matchScore === 'number' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 opacity-0 animate-in fade-in slide-in-from-bottom-8 duration-500 ease-spring stagger-5 fill-mode-forwards">
          <div className="bg-[var(--panel)]/90 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8)] shadow-inset-top flex items-center gap-2">
             <TailorResumeCTA resumeText={resumeText} jobDescription={jobDescription} onError={setError} />
          </div>
        </div>
      )}
    </main>
  );
}
