'use client';
import React from 'react';

const STEPS = [
  {
    step: '1',
    title: 'Smart Document Scan',
    subtitle: 'Upload your PDF. We read it instantly in memory without saving your personal files to any server.',
    tag: 'Zero storage',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    step: '2',
    title: 'Privacy First',
    subtitle: 'Your email, phone number, and address are automatically hidden before any AI model analyzes your text.',
    tag: 'PII Protected',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    step: '3',
    title: 'Exact Keyword Match',
    subtitle: 'Calculates the real mathematical overlap with the job description—no made-up scores or guesswork.',
    tag: 'Strict Math',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    step: '4',
    title: 'Interview Gameplan',
    subtitle: 'Get targeted bullet-point fixes and practice questions based on the exact skills your resume is missing.',
    tag: 'STAR Method',
    tagColor: 'text-teal-300 bg-teal-500/10 border-teal-500/20',
  },
];

export function AuditProcessRoadmap() {
  return (
    <div className="w-full max-w-6xl mx-auto mt-6 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 md:p-5 shadow-xl">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 mb-4 pb-3 border-b border-zinc-800/60">
        <h3 className="text-sm font-medium text-zinc-200">
          How Career Copilot Audits Your Resume
        </h3>
        <span className="text-xs text-zinc-500">
          Built for candidates targeting top engineering roles
        </span>
      </div>

      {/* 4 Clean, Plain-English Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {STEPS.map((s) => (
          <div
            key={s.step}
            className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/70 hover:border-zinc-700 hover:bg-zinc-900/70 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-750 text-zinc-300 text-xs font-semibold flex items-center justify-center group-hover:border-zinc-500 transition-colors">
                  {s.step}
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded font-medium border ${s.tagColor}`}>
                  {s.tag}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-zinc-100 mb-1.5">
                {s.title}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {s.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
