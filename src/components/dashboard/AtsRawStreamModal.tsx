'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Terminal, X, Copy, Check, AlertTriangle, AlertOctagon, Info, Search, Filter } from 'lucide-react';

export type PitfallType = 'cid_glitch' | 'excessive_whitespace' | 'spaced_kerning' | 'unprintable' | 'merged_timeline';

export interface LinePitfall {
  type: PitfallType;
  label: string;
  description: string;
  severity: 'high' | 'medium';
}

export interface AnalyzedLine {
  lineNumber: number;
  text: string;
  pitfalls: LinePitfall[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rawText: string;
}

export function AtsRawStreamModal({ isOpen, onClose, rawText }: Props) {
  const [copied, setCopied] = useState(false);
  const [filterFlaggedOnly, setFilterFlaggedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Analyze raw stream lines for known ATS parser pitfalls
  const { lines, totalPitfalls, summaryCounts } = useMemo(() => {
    if (!rawText) {
      return {
        lines: [],
        totalPitfalls: 0,
        summaryCounts: { cid: 0, spacing: 0, kerning: 0, unprintable: 0, timeline: 0 },
      };
    }

    const rawLines = rawText.split(/\r?\n/);
    const analyzed: AnalyzedLine[] = [];
    const counts = { cid: 0, spacing: 0, kerning: 0, unprintable: 0, timeline: 0 };
    let pitfallCounter = 0;

    rawLines.forEach((line, index) => {
      const pitfalls: LinePitfall[] = [];

      // 1. CID font glitches / replacement characters
      if (/\(cid:\d+\)/i.test(line) || line.includes('\uFFFD')) {
        pitfalls.push({
          type: 'cid_glitch',
          label: 'CID Font Glitch',
          description: 'Un-decoded font characters. The PDF font lacks proper ToUnicode mapping, rendering text illegible to ATS.',
          severity: 'high',
        });
        counts.cid++;
        pitfallCounter++;
      }

      // 2. Spaced kerning (e.g., "E x p e r i e n c e")
      if (/(?:[a-zA-Z]\s){4,}[a-zA-Z]/.test(line)) {
        pitfalls.push({
          type: 'spaced_kerning',
          label: 'Spaced Kerning',
          description: 'Characters separated by individual spaces. ATS algorithms will treat each letter as a separate word.',
          severity: 'high',
        });
        counts.kerning++;
        pitfallCounter++;
      }

      // 3. Excessive whitespace (4+ spaces indicating multi-column or table collapse)
      if (/\s{4,}/.test(line)) {
        pitfalls.push({
          type: 'excessive_whitespace',
          label: 'Multi-Column Collapse',
          description: 'Large gaps detected. Suggests multi-column tables were flattened horizontally onto a single line.',
          severity: 'medium',
        });
        counts.spacing++;
        pitfallCounter++;
      }

      // 4. Unprintable or corrupted control characters
      if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(line)) {
        pitfalls.push({
          type: 'unprintable',
          label: 'Control Character',
          description: 'Hidden binary control byte detected which can crash or truncate legacy parser pipelines.',
          severity: 'medium',
        });
        counts.unprintable++;
        pitfallCounter++;
      }

      // 5. Multiple date ranges on a single line (indicates merged timeline columns)
      const yearMatches = line.match(/\b(19|20)\d{2}\b/g);
      if (yearMatches && yearMatches.length >= 3) {
        pitfalls.push({
          type: 'merged_timeline',
          label: 'Merged Timeline',
          description: 'Three or more dates found on one line. Separate job timelines may have merged.',
          severity: 'medium',
        });
        counts.timeline++;
        pitfallCounter++;
      }

      analyzed.push({
        lineNumber: index + 1,
        text: line,
        pitfalls,
      });
    });

    return {
      lines: analyzed,
      totalPitfalls: pitfallCounter,
      summaryCounts: counts,
    };
  }, [rawText]);

  const filteredLines = useMemo(() => {
    return lines.filter((line) => {
      if (filterFlaggedOnly && line.pitfalls.length === 0) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = line.text.toLowerCase().includes(query);
        const matchesPitfall = line.pitfalls.some(p => p.label.toLowerCase().includes(query));
        return matchesText || matchesPitfall;
      }
      return true;
    });
  }, [lines, filterFlaggedOnly, searchQuery]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl h-[88vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/60 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center shadow-inset-glow">
              <Terminal size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  ATS Parser Raw Text Stream
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">
                  pdf-parse output
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Exact plaintext stream as ingested by Applicant Tracking Systems before LLM synthesis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-medium border border-zinc-700/60 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Raw Text'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Diagnostics & Filter Strip */}
        <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-400 font-mono">
              Total Lines: <strong className="text-white">{lines.length}</strong>
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 font-mono">
              Characters: <strong className="text-white">{rawText.length.toLocaleString()}</strong>
            </span>
            <span className="text-zinc-600">•</span>
            {totalPitfalls > 0 ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold font-mono">
                <AlertTriangle size={12} />
                {totalPitfalls} Potential Parser Pitfalls
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold font-mono">
                ✓ Clean Stream (No Major Glitches)
              </span>
            )}
          </div>

          {/* Search & Flag Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search stream..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <button
              onClick={() => setFilterFlaggedOnly(!filterFlaggedOnly)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                filterFlaggedOnly
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Filter size={12} />
              Flagged Only ({totalPitfalls})
            </button>
          </div>
        </div>

        {/* Pitfalls Legend Pill Strip if pitfalls exist */}
        {totalPitfalls > 0 && (
          <div className="px-5 py-2 bg-zinc-950 border-b border-zinc-800/60 flex flex-wrap gap-2 text-[11px]">
            {summaryCounts.cid > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
                🚨 CID Glitches: {summaryCounts.cid}
              </span>
            )}
            {summaryCounts.kerning > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                ⚠️ Spaced Kerning: {summaryCounts.kerning}
              </span>
            )}
            {summaryCounts.spacing > 0 && (
              <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-300">
                ⚡ Multi-Column Gaps: {summaryCounts.spacing}
              </span>
            )}
            {summaryCounts.timeline > 0 && (
              <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300">
                📅 Merged Timelines: {summaryCounts.timeline}
              </span>
            )}
            {summaryCounts.unprintable > 0 && (
              <span className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
                ⚙️ Control Bytes: {summaryCounts.unprintable}
              </span>
            )}
          </div>
        )}

        {/* Code / Text Stream View */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed bg-zinc-950 divide-y divide-zinc-900">
          {filteredLines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-12">
              <Info size={32} className="mb-2 text-zinc-600" />
              <p>No lines match the current filter criteria.</p>
            </div>
          ) : (
            filteredLines.map((item) => {
              const hasPitfall = item.pitfalls.length > 0;
              const isHigh = item.pitfalls.some(p => p.severity === 'high');

              return (
                <div
                  key={item.lineNumber}
                  className={`py-1.5 px-3 rounded flex flex-col sm:flex-row items-start gap-3 transition-colors ${
                    hasPitfall
                      ? isHigh
                        ? 'bg-rose-950/20 border-l-2 border-rose-500 text-rose-200'
                        : 'bg-amber-950/20 border-l-2 border-amber-500 text-amber-200'
                      : 'hover:bg-zinc-900/40 text-zinc-300'
                  }`}
                >
                  {/* Line Number */}
                  <span className="text-zinc-600 select-none text-[11px] w-8 shrink-0 text-right font-mono">
                    {item.lineNumber}
                  </span>

                  {/* Line Text Content */}
                  <div className="flex-1 break-all whitespace-pre-wrap">
                    {item.text || <span className="text-zinc-700 italic font-mono">&lt;empty line&gt;</span>}
                  </div>

                  {/* Pitfall Badges */}
                  {hasPitfall && (
                    <div className="flex flex-wrap gap-1.5 shrink-0 self-start sm:self-center">
                      {item.pitfalls.map((p, pIdx) => (
                        <span
                          key={pIdx}
                          title={p.description}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 cursor-help border ${
                            p.severity === 'high'
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                              : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          }`}
                        >
                          {p.severity === 'high' ? <AlertOctagon size={10} /> : <AlertTriangle size={10} />}
                          {p.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info strip */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 text-[11px] text-zinc-500 flex justify-between items-center px-5">
          <span>
            Tip: ATS systems parse top-to-bottom sequentially. Highlighted issues can lead to dropped keywords or rejected applications.
          </span>
          <span className="font-mono text-zinc-400">Esc to close</span>
        </div>
      </div>
    </div>
  );
}
