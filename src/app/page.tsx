'use client';
import { useState } from 'react';
import { ResumeUploadZone } from '@/components/dashboard/ResumeUploadZone';
import { JobDescriptionInput } from '@/components/dashboard/JobDescriptionInput';
import { MatchScoreCard } from '@/components/dashboard/MatchScoreCard';
import { SkillGapList } from '@/components/dashboard/SkillGapList';
import { PreparationRoadmap } from '@/components/dashboard/PreparationRoadmap';
import { InterviewQuestionBank } from '@/components/dashboard/InterviewQuestionBank';
import { TailorResumeCTA } from '@/components/dashboard/TailorResumeCTA';
import { PrepAnalysisResult } from '@/schemas/analysisSchema';
import { Loader2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<PrepAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.data);
      } else {
        setError(data.error || 'Failed to analyze gap.');
      }
    } catch {
      setError('Network error during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      <header className="bg-white border-b border-gray-200 py-6 px-4 md:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Career Copilot</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">ATS Gap Analysis & Tailored Resumes</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Systems Operational
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto mt-8 px-4 md:px-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">1. Upload Resume PDF</label>
            <ResumeUploadZone onParsed={setResumeText} onError={setError} />
          </div>
          <JobDescriptionInput value={jobDescription} onChange={setJobDescription} />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={loading || !resumeText || jobDescription.length < 50}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Analyzing Alignment...' : 'Analyze Alignment & Roadmap'}
          </button>
        </div>

        {analysis && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MatchScoreCard score={analysis.matchScore} summary={analysis.summary} />

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">Identified Skill Gaps</h2>
                  <SkillGapList gaps={analysis.skillGaps} />
                </section>
                <section>
                  <h2 className="text-lg font-bold mb-4">Interview Question Bank</h2>
                  <InterviewQuestionBank questions={analysis.questionBank} />
                </section>
              </div>
              <div className="space-y-8">
                <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="text-lg font-bold mb-6">Preparation Roadmap</h2>
                  <PreparationRoadmap plan={analysis.preparationPlan} />
                </section>
                <section className="bg-white p-6 rounded-xl border border-blue-100 bg-blue-50/30 shadow-sm flex flex-col items-center text-center">
                  <h2 className="text-lg font-bold mb-2">Ready to Apply?</h2>
                  <p className="text-sm text-gray-600 mb-6">Generate an ATS-optimized, single-column resume tailored exactly to this job description.</p>
                  <TailorResumeCTA resumeText={resumeText} jobDescription={jobDescription} onError={setError} />
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
