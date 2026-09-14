'use client';
import { useState, useEffect } from 'react';
import { X, Clock, Loader2 } from 'lucide-react';
import { PrepAnalysisResult } from '@/schemas/analysisSchema';

interface Record {
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
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchRecords();
  }, [isOpen]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.success) setRecords(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold flex items-center gap-2"><Clock size={18} /> Analysis History</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-500"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : records.length === 0 ? (
            <p className="text-sm text-gray-500 text-center mt-4">No history found.</p>
          ) : (
            records.map(rec => (
              <div key={rec.id} className="border rounded-lg p-3 hover:border-blue-300 cursor-pointer transition-colors" onClick={() => handleRestore(rec.id)}>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs text-gray-500">{new Date(rec.createdAt).toLocaleDateString()}</div>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${rec.matchScore >= 75 ? 'bg-emerald-100 text-emerald-700' : rec.matchScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    Score: {rec.matchScore}
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">{rec.summary}</p>
                {loadingId === rec.id && <Loader2 size={16} className="animate-spin text-blue-500 mt-2" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
