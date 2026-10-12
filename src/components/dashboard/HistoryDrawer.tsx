'use client';
import { useState, useEffect } from 'react';
import { X, Clock, Loader2 } from 'lucide-react';
import { PrepAnalysisResult } from '@/schemas/analysisSchema';

interface RecordItem {
  id: string;
  createdAt: string;
  matchScore: number;
  summary: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (resumeText: string, jd: string, analysis: PrepAnalysisResult) => void;
}

export function HistoryDrawer({ isOpen, onClose, onRestore }: Props) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    if (isOpen) {
      queueMicrotask(async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/history');
          const data = await res.json();
          if (!ignore && data.success) setRecords(data.data);
        } catch (e) {
          console.error(e);
        } finally {
          if (!ignore) setLoading(false);
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [isOpen]);

  const handleRestore = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/history/${id}`);
      const data = await res.json();
      if (data.success) {
        onRestore(data.data.rawResumeText, data.data.jobDescription, data.data.analysisPayload);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-zinc-950 border-l border-zinc-800 h-full flex flex-col text-zinc-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-zinc-100">
            <Clock size={16} className="text-zinc-400" /> Past Analyses
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-zinc-500" size={20} />
            </div>
          ) : records.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center mt-6">No saved analyses found.</p>
          ) : (
            (records ?? []).map((rec) => (
              <div
                key={rec.id}
                onClick={() => handleRestore(rec.id)}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg p-3.5 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-zinc-500">
                    {new Date(rec.createdAt).toLocaleDateString()}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded border ${
                      rec.matchScore >= 75
                        ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                        : rec.matchScore >= 50
                        ? 'bg-amber-950/60 border-amber-800/60 text-amber-400'
                        : 'bg-rose-950/60 border-rose-800/60 text-rose-400'
                    }`}
                  >
                    {rec.matchScore}/100
                  </span>
                </div>
                <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">{rec.summary}</p>
                {loadingId === rec.id && (
                  <Loader2 size={14} className="animate-spin text-emerald-500 mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
