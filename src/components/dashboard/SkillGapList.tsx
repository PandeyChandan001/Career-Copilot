'use client';
import { PrepAnalysisResult } from '@/schemas/analysisSchema';

interface Props {
  gaps: PrepAnalysisResult['skillGaps'];
}

export function SkillGapList({ gaps }: Props) {
  if (!gaps || !gaps.length) return <p className="text-sm text-gray-500">No major skill gaps identified.</p>;

  const getImpColor = (imp: string) => {
    if (imp === 'critical') return 'bg-red-100 text-red-700';
    if (imp === 'important') return 'bg-orange-100 text-orange-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(gaps ?? []).map((gap, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h4 className="font-semibold text-gray-900 break-words">{gap.skill}</h4>
            <span className={`text-[10px] shrink-0 font-bold uppercase px-2 py-1 rounded-full ${getImpColor(gap.importance)}`}>
              {gap.importance}
            </span>
          </div>
          <div className="text-xs text-gray-500 mb-2 capitalize">{gap.category.replace('_', ' ')}</div>
          <p className="text-sm text-gray-700 line-clamp-3 hover:line-clamp-none transition-all" title={gap.reason}>{gap.reason}</p>
        </div>
      ))}
    </div>
  );
}
