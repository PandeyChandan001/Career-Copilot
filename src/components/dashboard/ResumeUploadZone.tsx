'use client';
import { useState, useCallback } from 'react';
import { UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  onParsed: (text: string) => void;
  onError: (msg: string) => void;
}

export function ResumeUploadZone({ onParsed, onError }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);

  const processFile = async (file: File) => {
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
      formData.append('resume', file);
      const res = await fetch('/api/parse', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        onParsed(data.data.text);
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
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative group w-full p-8 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all ease-spring duration-500 overflow-hidden cursor-pointer gpu-accel min-h-[200px] ${isDragging ? 'scale-[1.02] bg-emerald-500/5' : 'hover:scale-[1.01] bg-[var(--panel)]'}`}
    >
      {/* Dashed Border Layer */}
      <div className={`absolute inset-0 rounded-2xl border-2 border-dashed transition-colors duration-300 ${isDragging ? 'border-emerald-500/50' : 'border-white/10 group-hover:border-emerald-500/30'}`}></div>
      
      {/* Animated gradient border on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000 -translate-x-full pointer-events-none"></div>

      <input 
        type="file" 
        accept="application/pdf" 
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500 relative shadow-inset-glow">
            <Loader2 size={24} className="animate-spin" />
            <div className="absolute inset-0 rounded-full ring-2 ring-emerald-500/50 animate-ping"></div>
          </div>
          <p className="text-sm font-semibold text-emerald-400">Extracting Text Vector...</p>
        </div>
      ) : fileDetails ? (
        <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300 relative z-20">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400 shadow-inset-glow">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-sm font-semibold text-white">{fileDetails.name}</p>
          <p className="text-xs text-slate-500">{fileDetails.size} • Click to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-slate-400 relative z-20 transition-colors group-hover:text-emerald-400">
          <div className="p-4 bg-white/5 rounded-full border border-white/5 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all ease-spring duration-500 shadow-inset-top">
            <UploadCloud size={28} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-200">Drop PDF Resume Here</p>
            <p className="text-xs text-slate-500 mt-1">or click to browse (Max 5MB)</p>
          </div>
        </div>
      )}
    </div>
  );
}
