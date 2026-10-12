'use client';
import { useState } from 'react';

interface KeywordItem {
  keyword: string;
  category?: string;
  isRequired?: boolean;
  isMissing?: boolean;
  suggestedBullet?: string;
  [key: string]: any;
}

interface KeywordMatrixProps {
  keywords?: KeywordItem[];
  missingKeywords?: (string | KeywordItem)[];
  matchedKeywords?: (string | KeywordItem)[];
}

export function KeywordMatrix({
  keywords = [],
  missingKeywords: missingProp = [],
  matchedKeywords: matchedProp = [],
}: KeywordMatrixProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const safeKeywords = Array.isArray(keywords) ? keywords : [];

  const missingKeywords: KeywordItem[] = safeKeywords.length > 0
    ? safeKeywords.filter(k => k?.isMissing)
    : (Array.isArray(missingProp) ? missingProp : []).map(k =>
        typeof k === 'string' ? { keyword: k, isMissing: true } : k
      );

  const matchedKeywords: KeywordItem[] = safeKeywords.length > 0
    ? safeKeywords.filter(k => !k?.isMissing)
    : (Array.isArray(matchedProp) ? matchedProp : []).map(k =>
        typeof k === 'string' ? { keyword: k, isMissing: false } : k
      );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (missingKeywords.length === 0 && matchedKeywords.length === 0) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-base font-semibold text-zinc-100">Keyword &amp; Role Match</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Comparison of terms found in your resume against terms in the target job description.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Matched in Resume ({matchedKeywords.length})
          </h4>
          {matchedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {matchedKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium rounded-md"
                >
                  {kw.keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No direct keyword matches found.</p>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Missing from Job Description ({missingKeywords.length})
          </h4>
          {missingKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {missingKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-medium rounded-md"
                >
                  {kw.keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-400">All target keywords are present in your resume.</p>
          )}
        </div>
      </div>

      {missingKeywords.some(k => k.suggestedBullet) && (
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Suggested Bullet Additions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {missingKeywords.filter(k => k.suggestedBullet).map((kw, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-zinc-200">{kw.keyword}</span>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    &ldquo;{kw.suggestedBullet}&rdquo;
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(kw.suggestedBullet!, `missing-${i}`)}
                  className="self-start text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {copiedId === `missing-${i}` ? 'Copied' : 'Copy bullet'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
