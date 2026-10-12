'use client';
import React from 'react';

const STEPS = [
  {
    step: '1',
    title: 'Two-Column Collapse',
    subtitle: 'Parsers read text horizontally left-to-right across the page, merging side-by-side columns into mixed, unreadable sentences.',
  },
  {
    step: '2',
    title: 'Missing Font Tables (CID)',
    subtitle: 'Canva icons and custom fonts frequently decode as unsearchable [cid:127] placeholder characters.',
  },
  {
    step: '3',
    title: 'Spaced Kerning Traps',
    subtitle: "Styled section headers like 'E x p e r i e n c e' get parsed as individual letters, causing scanners to miss entire sections.",
  },
  {
    step: '4',
    title: 'The XYZ Impact Standard',
    subtitle: "Top recruiters prioritize measurable achievements: 'Accomplished [X], measured by [Y], by doing [Z]' over passive task lists.",
  },
];

export function AuditProcessRoadmap() {
  return (
    <div className="w-full mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mb-4 pb-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-100">
          ATS Screening Fundamentals: Why Resumes Get Filtered
        </h3>
        <span className="text-xs text-zinc-500">
          How enterprise parsers (Workday, Taleo, Greenhouse) actually process your PDF
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
