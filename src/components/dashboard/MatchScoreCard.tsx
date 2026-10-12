'use client';

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
  const totalScore = typeof score === 'number' ? score : (score?.total || 70);
  const techScore = typeof score === 'number' ? score : (score?.technicalMatch || 70);
  const expScore = typeof score === 'number' ? score : (score?.experienceRelevance || 70);
  const parseScore = typeof score === 'number' ? 100 : (score?.parseabilityScore || 90);

  const statusLabel =
    totalScore >= 75
      ? 'Strong Match'
      : totalScore >= 50
      ? 'Moderate Match'
      : 'Needs Improvement';

  const statusClasses =
    totalScore >= 75
      ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
      : totalScore >= 50
      ? 'bg-amber-950/60 border-amber-800/60 text-amber-400'
      : 'bg-rose-950/60 border-rose-800/60 text-rose-400';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-100">Match Score</h2>
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${statusClasses}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl">{summary}</p>
        </div>

        <div className="sm:text-right shrink-0">
          <div className="text-3xl sm:text-4xl font-bold text-zinc-100 tabular-nums">
            {totalScore}<span className="text-lg font-normal text-zinc-500">/100</span>
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">Keyword &amp; Role Match</div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 w-full bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, totalScore))}%` }}
          />
        </div>
      </div>

      {/* Three Concrete Score Components */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-zinc-300">Keyword Overlap (50%)</span>
            <span className="text-zinc-100 font-semibold tabular-nums">{techScore}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, techScore))}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-zinc-300">Experience Relevance (30%)</span>
            <span className="text-zinc-100 font-semibold tabular-nums">{expScore}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, expScore))}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-zinc-300">Parseability (20%)</span>
            <span className="text-zinc-100 font-semibold tabular-nums">{parseScore}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, parseScore))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
