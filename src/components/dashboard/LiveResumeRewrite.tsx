'use client';
import { Sparkles, ArrowRight, Copy } from 'lucide-react';
import { useState } from 'react';

interface Rewrite {
  originalBullet: string;
  rewrittenBullet: string;
  metricAdded: string;
}

interface Props {
  rewrites: Rewrite[];
}

export function LiveResumeRewrite({ rewrites }: Props) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (!rewrites || rewrites.length === 0) return null;

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[var(--panel)] border border-white/5 shadow-inset-top rounded-2xl p-6 md:p-8 space-y-8">
      <div>
        <h3 className="text-xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
          <Sparkles className="text-purple-400" size={20} /> Tailored Experience
        </h3>
        <p className="text-sm text-slate-400">High-impact, STAR-method bullet points injected with missing keywords and quantified metrics tailored specifically for this role.</p>
      </div>

      <div className="space-y-6">
        {rewrites.map((item, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1.5fr] gap-4 items-center">
            {/* Before */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 h-full">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Before</h4>
              <p className="text-sm text-slate-300 line-through opacity-70">{item.originalBullet}</p>
            </div>
            
            {/* Arrow (hidden on mobile, shown on md) */}
            <div className="hidden md:flex justify-center text-zinc-700">
              <ArrowRight size={20} />
            </div>
            {/* Arrow for mobile */}
            <div className="md:hidden flex justify-center text-zinc-700 rotate-90 my-[-10px]">
              <ArrowRight size={20} />
            </div>

            {/* After */}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5 h-full flex flex-col justify-between shadow-[0_0_15px_-3px_rgba(168,85,247,0.1)] relative group">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2 flex justify-between">
                  <span>After</span>
                  {item.metricAdded && <span className="bg-purple-500/20 px-2 rounded-sm text-[9px]">{item.metricAdded}</span>}
                </h4>
                <p className="text-sm font-medium text-white leading-relaxed">{item.rewrittenBullet}</p>
              </div>
              
              <button 
                onClick={() => copyToClipboard(item.rewrittenBullet, i)}
                className="absolute bottom-4 right-4 text-xs font-semibold flex items-center gap-1.5 text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-purple-500/30 hover:bg-zinc-800"
              >
                <Copy size={14} /> {copiedId === i ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
