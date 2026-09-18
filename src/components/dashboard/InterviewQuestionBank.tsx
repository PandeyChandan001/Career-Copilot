'use client';
import { useState } from 'react';
import { PrepAnalysisResult } from '@/schemas/analysisSchema';
import { Copy, CheckCircle2, ChevronDown, MessageSquareQuote, Target } from 'lucide-react';

interface Props {
  questions: PrepAnalysisResult['questionBank'];
}

export function InterviewQuestionBank({ questions }: Props) {
  const [activeTab, setActiveTab] = useState<'technical' | 'behavioral' | 'strategic'>('technical');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tabs = [
    { id: 'technical', label: 'Technical' },
    { id: 'behavioral', label: 'Behavioral' },
    { id: 'strategic', label: 'Strategic' },
  ] as const;

  const filteredQuestions = (questions ?? []).filter(q => q.category === activeTab);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Segmented Controller */}
      <div className="inline-flex bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inset-top w-full md:w-auto relative">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative z-10 flex-1 md:flex-none md:w-32 py-2 text-sm font-semibold rounded-lg transition-all ease-spring duration-300 ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
        {/* Animated Sliding Pill */}
        <div 
          className="absolute inset-y-1.5 bg-white/10 rounded-lg shadow-sm border border-white/5 transition-all ease-spring duration-500 md:w-32"
          style={{ 
            width: `calc(33.33% - 6px)`,
            left: `6px`,
            transform: `translateX(calc(${tabs.findIndex(t => t.id === activeTab)} * 100%))` 
          }}
        ></div>
      </div>

      <div className="grid gap-4">
        {filteredQuestions.map((q, idx) => {
          const id = `${q.category}-${idx}`;
          const isExpanded = expandedId === id;
          return (
            <div key={id} className="bg-[var(--panel)] border border-white/5 shadow-inset-top rounded-2xl overflow-hidden group">
              <div 
                className="p-5 flex items-start gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : id)}
              >
                <div className="p-2 bg-white/5 rounded-lg border border-white/5 shrink-0 mt-0.5">
                  <MessageSquareQuote size={20} className="text-cyan-400" />
                </div>
                <div className="flex-1 space-y-3 pr-4">
                  <h4 className="text-base font-bold text-slate-200 leading-snug">{q.question}</h4>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      STAR Method
                    </span>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleCopy(q.question, id); }}
                  className="p-2 rounded-lg text-slate-500 hover:bg-white/10 hover:text-white transition-all active:scale-95 border border-transparent hover:border-white/10 shrink-0"
                  title="Copy Question"
                >
                  {copiedId === id ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
                <ChevronDown size={20} className={`text-slate-600 transition-transform duration-300 ease-spring shrink-0 self-center ${isExpanded ? 'rotate-180 text-cyan-400' : ''}`} />
              </div>

              <div className={`grid transition-all duration-500 ease-spring ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden bg-black/20 border-t border-white/5">
                  <div className="p-6 md:pl-20 space-y-6">
                    <div className="flex items-start gap-4">
                      <Target size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Target Concept</h5>
                        <p className="text-sm text-slate-300 leading-relaxed">{q.targetConcept}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <CheckCircle2 size={18} className="text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Recommended Approach</h5>
                        <p className="text-sm text-slate-300 leading-relaxed">{q.recommendedApproach}</p>
                      </div>
                    </div>
                    {q.sampleAnswer && (
                      <div className="flex items-start gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mt-4">
                        <MessageSquareQuote size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <h5 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">High-Scoring Sample Answer</h5>
                          <p className="text-sm text-slate-200 leading-relaxed italic">"{q.sampleAnswer}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
