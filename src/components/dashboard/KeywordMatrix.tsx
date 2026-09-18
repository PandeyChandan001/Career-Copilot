'use client';
import { CheckCircle2, XCircle, Copy } from 'lucide-react';
import { useState } from 'react';

interface Keyword {
  keyword: string;
  category: string;
  isRequired: boolean;
  isMissing: boolean;
  suggestedBullet?: string;
}

interface Props {
  keywords: Keyword[];
}

export function KeywordMatrix({ keywords }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const missingKeywords = keywords.filter(k => k.isMissing);
  const matchedKeywords = keywords.filter(k => !k.isMissing);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!keywords || keywords.length === 0) return null;

  return (
    <div className="bg-[var(--panel)] border border-white/5 shadow-inset-top rounded-2xl p-6 md:p-8 space-y-8">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-white mb-2">Keyword Matrix</h3>
        <p className="text-sm text-slate-400">Optimize your resume for ATS parsers by integrating these critical keywords into your experience.</p>
      </div>

      {missingKeywords.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm uppercase tracking-widest border-b border-rose-500/10 pb-2">
            <XCircle size={16} /> Missing Keywords
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missingKeywords.map((kw, i) => (
              <div key={i} className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 flex flex-col gap-3 group hover:bg-rose-500/10 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white block">{kw.keyword}</span>
                    <span className="text-xs font-medium text-rose-300">{kw.category} • {kw.isRequired ? 'Required' : 'Preferred'}</span>
                  </div>
                </div>
                {kw.suggestedBullet && (
                  <div className="mt-auto">
                    <p className="text-xs text-slate-400 italic mb-2 line-clamp-2 leading-relaxed">
                      "{kw.suggestedBullet}"
                    </p>
                    <button 
                      onClick={() => copyToClipboard(kw.suggestedBullet!, `missing-${i}`)}
                      className="text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                    >
                      <Copy size={12} /> {copiedId === `missing-${i}` ? 'Copied!' : 'Copy Suggestion'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {matchedKeywords.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm uppercase tracking-widest border-b border-emerald-500/10 pb-2">
            <CheckCircle2 size={16} /> Matched Keywords
          </div>
          <div className="flex flex-wrap gap-2">
            {matchedKeywords.map((kw, i) => (
              <span 
                key={i} 
                className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium rounded-lg"
              >
                {kw.keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
