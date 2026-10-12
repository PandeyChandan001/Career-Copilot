'use client';
import React from 'react';

const STEPS = [
  {
    step: '1',
    title: 'Raw ATS Text Extractor',
    subtitle: 'Reads your PDF directly in memory without storing files on disk.',
  },
  {
    step: '2',
    title: 'Privacy Filter (Contact Redaction)',
    subtitle: 'Redacts email addresses, phone numbers, and profile links before analysis.',
  },
  {
    step: '3',
    title: 'Keyword & Role Match',
    subtitle: 'Computes deterministic keyword overlap and role alignment against the job description.',
  },
  {
    step: '4',
    title: 'Interview Preparation',
    subtitle: 'Generates targeted resume bullet rewrites, study tasks, and STAR practice questions.',
  },
];

export function AuditProcessRoadmap() {
  return (
    <div className="w-full mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mb-4 pb-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-100">
          How Career Copilot Works
        </h3>
        <span className="text-xs text-zinc-500">
          In-memory parsing, contact redaction, and keyword matching
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((s) => (
          <div
            key={s.step}
            className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col justify-between"
          >
            <div>
              <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center mb-2.5">
                {s.step}
              </div>
              <h4 className="text-sm font-medium text-zinc-100 mb-1">
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
