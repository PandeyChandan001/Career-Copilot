'use client';
import { useState } from 'react';
import { PrepAnalysisResult } from '@/schemas/analysisSchema';

interface Props {
  questions: PrepAnalysisResult['questionBank'];
}

export function InterviewQuestionBank({ questions }: Props) {
  const [activeTab, setActiveTab] = useState<'technical' | 'behavioral' | 'situational'>('technical');

  const tabs = [
    { id: 'technical', label: `Technical (${questions.technical.length})` },
    { id: 'behavioral', label: `Behavioral (${questions.behavioral.length})` },
    { id: 'situational', label: `Situational (${questions.situational.length})` },
  ] as const;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-6 space-y-6">
        {activeTab === 'technical' && questions.technical.map((q, i) => (
          <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-2">
              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded uppercase mt-0.5 shrink-0">{q.targetSkill}</span>
              <p className="font-semibold text-gray-900">{q.question}</p>
            </div>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 sm:ml-12">
              {q.expectedKeyPoints.map((kp, j) => <li key={j}>{kp}</li>)}
            </ul>
          </div>
        ))}
        {activeTab === 'behavioral' && questions.behavioral.map((q, i) => (
          <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
            <p className="font-semibold text-gray-900 mb-2">{q.question}</p>
            <div className="text-sm bg-gray-50 p-3 rounded text-gray-700">
              <span className="font-semibold text-gray-900">Competency:</span> {q.targetedCompetency}<br/>
              <span className="font-semibold text-gray-900">STAR Hint:</span> {q.starContextHint}
            </div>
          </div>
        ))}
        {activeTab === 'situational' && questions.situational.map((q, i) => (
          <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
            <p className="text-sm text-gray-500 italic mb-2">Scenario: {q.scenario}</p>
            <p className="font-semibold text-gray-900 mb-2">{q.question}</p>
            <p className="text-sm text-gray-600"><span className="font-semibold">Criteria:</span> {q.evaluationCriteria}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
