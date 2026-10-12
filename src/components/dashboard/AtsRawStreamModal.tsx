'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { X, Copy, Check, Search } from 'lucide-react';

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { lines, totalPitfalls } = useMemo(() => {
    if (!rawText) {
      return {
        lines: [],
        totalPitfalls: 0,
      };
    }

    const rawLines = rawText.split(/\r?\n/);
    const analyzed: AnalyzedLine[] = [];
    let pitfallCounter = 0;

    rawLines.forEach((line, index) => {
      const pitfalls: LinePitfall[] = [];

      if (/\(cid:\d+\)/i.test(line) || line.includes('\uFFFD')) {
        pitfalls.push({
          type: 'cid_glitch',
          label: 'CID Font Error',
          description: 'Undecoded font characters detected. The PDF font lacks a ToUnicode table.',
          severity: 'high',
        });
        pitfallCounter++;
      }

      if (/(?:[a-zA-Z]\s){4,}[a-zA-Z]/.test(line)) {
        pitfalls.push({
          type: 'spaced_kerning',
          label: 'Spaced Kerning',
          description: 'Characters separated by individual spaces may be indexed as separate letters.',
          severity: 'high',
        });
        pitfallCounter++;
      }

      if (/\s{4,}/.test(line)) {
        pitfalls.push({
          type: 'excessive_whitespace',
          label: 'Collapsed Columns',
          description: 'Large horizontal gaps suggest multi-column layout flattening.',
          severity: 'medium',
        });
        pitfallCounter++;
      }

      if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(line)) {
        pitfalls.push({
          type: 'unprintable',
          label: 'Control Character',
          description: 'Non-printable control character detected in text stream.',
          severity: 'medium',
        });
        pitfallCounter++;
      }

      const yearMatches = line.match(/\b(19|20)\d{2}\b/g);
      if (yearMatches && yearMatches.length >= 3) {
        pitfalls.push({
          type: 'merged_timeline',
          label: 'Merged Dates',
          description: 'Three or more dates on one line suggest merged timeline columns.',
          severity: 'medium',
        });
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[85vh] bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Raw ATS Text Extractor
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Plaintext extracted from your PDF file ({lines.length} lines, {rawText.length.toLocaleString()} characters)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium border border-zinc-700 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Inline Warning Banner & Filter Bar */}
        <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            {totalPitfalls > 0 ? (
              <span className="text-amber-400 font-medium">
                {totalPitfalls} formatting warning{totalPitfalls === 1 ? '' : 's'} detected (CID font errors, collapsed columns, or kerning issues).
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">
                No formatting or character encoding issues detected.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter lines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>
            {totalPitfalls > 0 && (
              <button
                onClick={() => setFilterFlaggedOnly(!filterFlaggedOnly)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  filterFlaggedOnly
                    ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Warnings Only ({totalPitfalls})
              </button>
            )}
          </div>
        </div>

        {/* Monospace Text Stream */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed bg-zinc-950 divide-y divide-zinc-900/60">
          {filteredLines.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-500 py-12">
              No lines match the current filter.
            </div>
          ) : (
            filteredLines.map((item) => {
              const hasPitfall = item.pitfalls.length > 0;
              return (
                <div
                  key={item.lineNumber}
                  className={`py-1.5 px-3 flex flex-col sm:flex-row items-start gap-3 ${
                    hasPitfall ? 'bg-amber-950/20 border-l-2 border-amber-500' : ''
                  }`}
                >
                  <span className="text-zinc-600 select-none text-[11px] w-8 shrink-0 text-right">
                    {item.lineNumber}
                  </span>
                  <div className="flex-1 break-all whitespace-pre-wrap text-zinc-200">
                    {item.text || <span className="text-zinc-700">&lt;empty line&gt;</span>}
                  </div>
                  {hasPitfall && (
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      {item.pitfalls.map((p, pIdx) => (
                        <span
                          key={pIdx}
                          title={p.description}
                          className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-amber-950/80 border border-amber-800/80 text-amber-300"
                        >
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
      </div>
    </div>
  );
}
