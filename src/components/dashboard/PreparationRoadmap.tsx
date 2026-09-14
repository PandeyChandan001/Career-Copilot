'use client';
import { useState } from 'react';
import { PrepAnalysisResult } from '@/schemas/analysisSchema';
import { ChevronDown, Target } from 'lucide-react';

interface Props {
  plan: PrepAnalysisResult['preparationPlan'];
}

export function PreparationRoadmap({ plan }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[1.15rem] before:-translate-x-px md:before:ml-6 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/0 before:via-emerald-500/20 before:to-transparent pt-4">
      {plan.map((phase, idx) => {
        const isExpanded = expanded === idx;
        return (
          <div key={idx} className="relative flex items-start gap-4 md:gap-6 group">
            {/* Timeline Node */}
            <button 
              onClick={() => setExpanded(isExpanded ? null : idx)}
              className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border border-white/10 shadow-[0_0_0_8px_var(--panel)] shrink-0 transition-all ease-spring duration-500 ${isExpanded ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
            >
              <span className="text-sm font-bold tracking-tighter">{idx + 1}</span>
            </button>
            
            {/* Content Card */}
            <div 
              className={`flex-1 p-5 rounded-2xl border transition-all ease-spring duration-500 cursor-pointer shadow-inset-top mt-[-8px] ${isExpanded ? 'bg-white/[0.03] border-white/10 ring-1 ring-emerald-500/20' : 'bg-transparent border-transparent hover:bg-white/[0.02]'}`} 
              onClick={() => setExpanded(isExpanded ? null : idx)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white tracking-tight text-base">{phase.phase}</h3>
                <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 ease-spring ${isExpanded ? 'rotate-180 text-emerald-400' : ''}`} />
              </div>
              
              <div className={`grid transition-all duration-500 ease-spring ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {phase.focusAreas.map((area, aIdx) => (
                      <span key={aIdx} className="px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs font-semibold border border-white/10 tracking-wide">
                        {area}
                      </span>
                    ))}
                  </div>
                  <ul className="space-y-3">
                    {phase.actionItems.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-3 text-sm text-slate-400">
                        <Target size={16} className="text-emerald-500/50 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
