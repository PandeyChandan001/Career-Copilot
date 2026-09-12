'use client';
import { PrepAnalysisResult } from '@/schemas/analysisSchema';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface Props {
  plan: PrepAnalysisResult['preparationPlan'];
}

export function PreparationRoadmap({ plan }: Props) {
  return (
    <div className="space-y-6">
      {plan.map((phase, i) => (
        <div key={i} className="relative pl-6 border-l-2 border-blue-200 last:border-transparent pb-2">
          <div className="absolute -left-[9px] top-0 bg-blue-500 text-white rounded-full p-1">
            <CheckCircle2 size={12} className="opacity-0" />
            <div className="absolute inset-0 bg-blue-500 rounded-full border-2 border-white" />
          </div>
          <h4 className="font-bold text-sm text-blue-600 mb-1">{phase.phase}</h4>
          <h5 className="font-semibold text-gray-900 text-lg mb-2">{phase.focusTopic}</h5>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-3">
            <ul className="space-y-2">
              {phase.actionItems.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                  <ChevronRight size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {phase.suggestedConcepts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {phase.suggestedConcepts.map((concept, j) => (
                <span key={j} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">
                  {concept}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
