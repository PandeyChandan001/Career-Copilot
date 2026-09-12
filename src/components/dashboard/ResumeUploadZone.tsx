'use client';
import { useState, useRef } from 'react';
import { UploadCloud, FileText, X, Loader2 } from 'lucide-react';

interface Props {
  onParsed: (text: string) => void;
  onError: (msg: string) => void;
}

export function ResumeUploadZone({ onParsed, onError }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', selected);

    try {
      const res = await fetch('/api/parse', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        onParsed(data.data.rawText);
      } else {
        onError(data.error || 'Failed to parse PDF.');
        setFile(null);
      }
    } catch {
      onError('Network error while parsing PDF.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
      <input type="file" ref={inputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
      {file ? (
        <div className="flex items-center justify-between bg-white border rounded p-3">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-500" />
            <div className="text-left">
              <p className="text-sm font-medium line-clamp-1 max-w-[200px]">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          {loading ? (
            <Loader2 className="animate-spin text-gray-400" />
          ) : (
            <button onClick={() => { setFile(null); onParsed(''); }} className="p-1 hover:bg-gray-100 rounded text-red-500">
              <X size={18} />
            </button>
          )}
        </div>
      ) : (
        <div className="cursor-pointer" onClick={() => inputRef.current?.click()}>
          <UploadCloud className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-sm font-medium text-gray-700">Click to upload your resume (PDF)</p>
          <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
        </div>
      )}
    </div>
  );
}
