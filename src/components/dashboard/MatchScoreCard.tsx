'use client';
import { useEffect, useState } from 'react';

interface Props {
  score: number;
  summary: string;
}

export function MatchScoreCard({ score, summary }: Props) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1500; // 1.5s

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo for spring-like deceleration
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayScore(Math.floor(easeProgress * score));
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  }, [score]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // Initialize to 0 so it animates from empty
  const [strokeDashoffset, setStrokeDashoffset] = useState(circumference);

  useEffect(() => {
    // Small delay to trigger CSS transition after mount
    const timer = setTimeout(() => {
      setStrokeDashoffset(circumference - (score / 100) * circumference);
    }, 50);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  const getColor = (s: number) => {
    if (s >= 75) return { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.4)', text: 'text-emerald-400' };
    if (s >= 50) return { stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-400' };
    return { stroke: '#F43F5E', glow: 'rgba(244, 63, 94, 0.4)', text: 'text-rose-400' };
  };

  const colors = getColor(score);

  return (
    <div className="bg-[var(--panel)] border border-white/5 shadow-inset-top rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
      {/* Background Ambient Glow */}
      <div 
        className="absolute top-1/2 left-24 -translate-y-1/2 w-32 h-32 blur-[80px] rounded-full pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: colors.stroke, opacity: 0.15 }}
      ></div>

      <div className="relative flex-shrink-0">
        <svg width="160" height="160" className="transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-white/5"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={colors.stroke}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-[1500ms] ease-smooth"
            style={{ 
              strokeDasharray: circumference, 
              strokeDashoffset,
              filter: `drop-shadow(0 0 8px ${colors.glow})`
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold tracking-tighter ${colors.text} font-mono tabular-nums`}>
            {displayScore}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">Match</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 relative z-10 text-center md:text-left">
        <h3 className="text-2xl font-bold tracking-tight text-white">Analysis Complete</h3>
        <p className="text-slate-400 leading-relaxed text-sm max-w-2xl">{summary}</p>
      </div>
    </div>
  );
}
