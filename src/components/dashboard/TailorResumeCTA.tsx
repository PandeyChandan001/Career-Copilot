'use client';
import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

interface Props {
  resumeText: string;
  jobDescription: string;
  onError: (msg: string) => void;
}

export function TailorResumeCTA({ resumeText, jobDescription, onError }: Props) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate tailored resume');
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
    } catch (err: any) {
      onError(err.message || 'An error occurred while generating PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading || !resumeText || !jobDescription}
      className="flex items-center justify-center gap-2 w-full sm:w-auto bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
      {loading ? 'Compiling PDF...' : 'Generate ATS Tailored Resume'}
    </button>
  );
}
