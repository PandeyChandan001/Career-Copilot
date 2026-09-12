'use client';

interface Props {
  score: number;
  summary: string;
}

export function MatchScoreCard({ score, summary }: Props) {
  let colorClass = 'text-rose-600 bg-rose-50 border-rose-200';
  if (score >= 75) colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  else if (score >= 50) colorClass = 'text-amber-600 bg-amber-50 border-amber-200';

  return (
    <div className={`p-6 rounded-xl border ${colorClass} flex flex-col md:flex-row gap-6 items-center shadow-sm`}>
      <div className="flex flex-col items-center justify-center min-w-[120px]">
        <div className="text-5xl font-extrabold tracking-tighter">{score}</div>
        <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-80">Match Score</div>
      </div>
      <div className="flex-1 md:border-l md:pl-6 border-black/10 text-center md:text-left">
        <h3 className="text-sm font-bold uppercase mb-2 opacity-80">Executive Summary</h3>
        <p className="text-sm leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}
