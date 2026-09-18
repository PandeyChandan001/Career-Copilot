'use client';
import { useEffect, useState } from 'react';

interface ScoreDetails {
  total: number;
  technicalMatch: number;
  experienceRelevance: number;
  parseabilityScore: number;
}

interface Props {
  score: ScoreDetails | number;
  summary: string;
}

export function MatchScoreCard({ score, summary }: Props) {
  const [displayScore, setDisplayScore] = useState(0);

  // Safely extract the scores regardless of if it's an object or a fallback number
  const totalScore = typeof score === 'number' ? score : (score?.total || 70);
  const techScore = typeof score === 'number' ? score : (score?.technicalMatch || 70);
  const expScore = typeof score === 'number' ? score : (score?.experienceRelevance || 70);
  const parseScore = typeof score === 'number' ? 100 : (score?.parseabilityScore || 90);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1500; // 1.5s

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayScore(Math.floor(easeProgress * totalScore));
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  }, [totalScore]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const [strokeDashoffset, setStrokeDashoffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStrokeDashoffset(circumference - (totalScore / 100) * circumference);
    }, 50);
    return () => clearTimeout(timer);
  }, [totalScore, circumference]);

  const getColor = (s: number) => {
    if (s >= 75) return { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.4)', text: 'text-emerald-400', label: 'High Interview Probability', badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' };
    if (s >= 50) return { stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-400', label: 'Needs Optimization', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
    return { stroke: '#F43F5E', glow: 'rgba(244, 63, 94, 0.4)', text: 'text-rose-400', label: 'Low Match Probability', badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400' };
  };

  const colors = getColor(totalScore);

  return (
    <div className="bg-[var(--panel)] border border-white/5 shadow-inset-top rounded-2xl p-8 flex flex-col lg:flex-row items-center gap-10 relative overflow-hidden group">
      {/* Background Ambient Glow */}
      <div 
        className="absolute top-1/2 left-32 -translate-y-1/2 w-48 h-48 blur-[100px] rounded-full pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: colors.stroke, opacity: 0.15 }}
      ></div>

      <div className="relative flex-shrink-0">
        <svg width="180" height="180" className="transform -rotate-90">
          <circle
            cx="90"
            cy="90"
            r={radius}
            className="stroke-white/5"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke={colors.stroke}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-[1500ms] ease-smooth"
            style={{ 
              strokeDasharray: circumference, 
              strokeDashoffset,
              filter: `drop-shadow(0 0 12px ${colors.glow})`
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold tracking-tighter ${colors.text} font-mono tabular-nums`}>
            {displayScore}
          </span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Match Score</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-6 relative z-10 text-center lg:text-left">
        <div className="space-y-2">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3">
            <h3 className="text-2xl font-bold tracking-tight text-white">Analysis Complete</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors.badge} shadow-inset-top`}>
              {colors.label}
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed text-sm max-w-2xl">{summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider">Technical</span>
              <span className="text-white">{techScore}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${techScore}%` }}
              ></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider">Experience</span>
              <span className="text-white">{expScore}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-400 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${expScore}%` }}
              ></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400 uppercase tracking-wider">ATS Parseability</span>
              <span className="text-white">{parseScore}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${parseScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
