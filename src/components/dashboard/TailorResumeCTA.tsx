'use client';
import { useState } from 'react';
import { FileEdit, Loader2 } from 'lucide-react';
import { ResumeEditorModal } from './ResumeEditorModal';
import { TailoredResumeData } from '@/schemas/resumeSchema';

interface Props {
  resumeText: string;
  jobDescription: string;
  onError: (msg: string) => void;
}

export function TailorResumeCTA({ resumeText, jobDescription, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tailoredData, setTailoredData] = useState<TailoredResumeData | null>(null);

  const handleTailor = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tailor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate tailored resume data');
      }

      const json = await res.json();
      setTailoredData(json.data);
      setModalOpen(true);
    } catch (err: any) {
      onError(err.message || 'An error occurred while preparing resume');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (editedData: TailoredResumeData) => {
    setExporting(true);
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to compile PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tailored-resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setModalOpen(false);
    } catch (err: any) {
      onError(err.message || 'An error occurred while compiling PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleTailor}
        disabled={loading || !resumeText || !jobDescription}
        className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <FileEdit size={14} />}
        {loading ? 'Preparing Resume...' : 'Edit & Export Resume PDF'}
      </button>

      {tailoredData && (
        <ResumeEditorModal
          isOpen={modalOpen}
          initialData={tailoredData}
          onClose={() => setModalOpen(false)}
          onExport={handleExport}
          isExporting={exporting}
        />
      )}
    </>
  );
}
