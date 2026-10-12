'use client';
import { useState, useCallback, useRef } from 'react';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  onParsed: (text: string) => void;
  onError: (msg: string) => void;
}

export function ResumeUploadZone({ onParsed, onError }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      onError('Please upload a valid PDF document.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError('File size must be under 5MB.');
      return;
    }

    setIsUploading(true);
    setFileDetails({ name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        onParsed(data.data.rawText || data.data.text);
      } else {
        onError(data.error || 'Failed to extract text from PDF.');
        setFileDetails(null);
      }
    } catch {
      onError('Network error occurred during parsing.');
      setFileDetails(null);
    } finally {
      setIsUploading(false);
    }
  }, [onError, onParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
      onDrop={handleDrop}
      className={`w-full min-h-[220px] p-6 rounded-xl border border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
        isDragging
          ? 'border-emerald-600 bg-emerald-950/20'
          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900/50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            processFile(file);
          }
          e.target.value = '';
        }}
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-2.5 text-zinc-300">
          <Loader2 size={22} className="animate-spin text-emerald-500" />
          <p className="text-sm font-medium">Reading PDF in memory...</p>
        </div>
      ) : fileDetails ? (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <CheckCircle2 size={22} className="text-emerald-500 mb-1" />
          <p className="text-sm font-medium text-zinc-100">{fileDetails.name}</p>
          <p className="text-xs text-zinc-500">{fileDetails.size} • Click to replace file</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2.5 text-center pointer-events-none">
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
            <Upload size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">Drag and drop your PDF resume</p>
            <p className="text-xs text-zinc-500 mt-1">or click to browse (PDF up to 5MB)</p>
          </div>
        </div>
      )}
    </div>
  );
}
