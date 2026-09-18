'use client';
import { useState, useEffect } from 'react';
import { TailoredResumeData } from '@/schemas/resumeSchema';
import { X, Plus, Trash2, Loader2, Save, FileText, Command } from 'lucide-react';

interface Props {
  isOpen: boolean;
  initialData: TailoredResumeData;
  onClose: () => void;
  onExport: (data: TailoredResumeData) => void;
  isExporting: boolean;
}

export function ResumeEditorModal({ isOpen, initialData, onClose, onExport, isExporting }: Props) {
  const [data, setData] = useState<TailoredResumeData>(initialData);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onExport(data);
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, data, onClose, onExport]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-300">
      <div className="bg-[var(--background)] w-full h-full md:h-[95vh] md:w-[95vw] md:rounded-3xl md:border border-white/10 shadow-2xl flex flex-col animate-in zoom-in-95 duration-500 ease-spring overflow-hidden">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[var(--panel)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shadow-inset-top">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Studio Editor</h2>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{data.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
              <Command size={12} /> + Enter to export
            </div>
            <button 
              onClick={() => onExport(data)}
              disabled={isExporting}
              className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 flex items-center gap-2 disabled:opacity-50 transition-colors ease-smooth"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isExporting ? 'Compiling...' : 'Export ATS PDF'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>
        </header>
        
        {/* Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Pane: Editor */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 border-r border-white/5">
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Professional Summary</h3>
              <textarea
                className="w-full p-4 bg-black/20 border border-white/10 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-slate-300 text-sm leading-relaxed transition-all shadow-inset-top resize-none"
                rows={4}
                value={data.summary}
                onChange={e => setData({...data, summary: e.target.value})}
              />
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Technical Skills</h3>
              <div className="p-1 bg-black/20 border border-white/10 rounded-xl shadow-inset-top flex-wrap flex gap-1 focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
                <textarea
                  className="w-full p-3 bg-transparent border-none focus:outline-none text-slate-300 text-sm resize-none"
                  rows={2}
                  value={(data.skills ?? []).join(', ')}
                  onChange={e => setData({...data, skills: e.target.value.split(',').map(s => s.trim())})}
                  placeholder="React, TypeScript, Node.js"
                />
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                Work Experience
              </h3>
              {(data.experience ?? []).map((exp, expIdx) => (
                <div key={expIdx} className="bg-black/20 p-5 md:p-6 rounded-2xl border border-white/10 shadow-inset-top space-y-5 group">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-inset-top" value={exp.role} onChange={e => {
                      const newExp = [...data.experience];
                      newExp[expIdx].role = e.target.value;
                      setData({...data, experience: newExp});
                    }} />
                    <input className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-inset-top" value={exp.company} onChange={e => {
                      const newExp = [...data.experience];
                      newExp[expIdx].company = e.target.value;
                      setData({...data, experience: newExp});
                    }} />
                  </div>
                  
                  <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-white/10">
                    {(exp.bulletPoints ?? []).map((bullet, bulletIdx) => (
                      <div key={bulletIdx} className="flex gap-3 relative z-10">
                        <div className="w-6 h-6 rounded-full bg-slate-900 border border-white/10 shrink-0 flex items-center justify-center mt-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                        </div>
                        <textarea
                          className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 min-h-[4rem] focus:ring-1 focus:ring-emerald-500 focus:outline-none shadow-inset-top resize-none"
                          value={bullet}
                          onChange={e => {
                            const newExp = [...data.experience];
                            newExp[expIdx].bulletPoints[bulletIdx] = e.target.value;
                            setData({...data, experience: newExp});
                          }}
                        />
                        <button 
                          onClick={() => {
                            const newExp = [...data.experience];
                            newExp[expIdx].bulletPoints.splice(bulletIdx, 1);
                            setData({...data, experience: newExp});
                          }}
                          className="p-2 h-fit text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg mt-2.5 transition-colors border border-transparent hover:border-rose-500/20"
                          title="Remove Bullet"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newExp = [...data.experience];
                        newExp[expIdx].bulletPoints.push('Accomplished [X] as measured by [Y] by doing [Z].');
                        setData({...data, experience: newExp});
                      }}
                      className="ml-9 flex items-center gap-1.5 text-xs text-slate-400 font-bold hover:text-emerald-400 transition-colors mt-4"
                    >
                      <Plus size={14} strokeWidth={3} /> ADD BULLET POINT
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </div>

          {/* Right Pane: Live Document Preview */}
          <div className="hidden lg:block lg:w-[45%] bg-[#E5E7EB] p-8 overflow-y-auto relative">
            <div className="max-w-[21cm] mx-auto bg-white min-h-[29.7cm] shadow-2xl p-12 space-y-6 select-none font-sans text-slate-900 mb-8">
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <h1 className="text-3xl font-bold tracking-tight uppercase">{data.fullName}</h1>
                <div className="text-sm mt-2 flex items-center justify-center gap-3 text-slate-600">
                  <span>{data.contact.email}</span> • 
                  <span>{data.contact.phone}</span> • 
                  <span>{data.contact.location}</span>
                </div>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Summary</h2>
                <p className="text-sm leading-relaxed text-justify">{data.summary}</p>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Technical Skills</h2>
                <p className="text-sm leading-relaxed">{(data.skills ?? []).join(', ')}</p>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b pb-1">Experience</h2>
                <div className="space-y-4">
                  {(data.experience ?? []).map((exp, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-baseline mb-2">
                        <h3 className="font-bold text-sm">{exp.role}</h3>
                        <span className="text-sm font-semibold text-slate-600">{exp.company}</span>
                      </div>
                      <ul className="list-disc list-outside ml-4 space-y-1">
                        {(exp.bulletPoints ?? []).map((b, i) => (
                          <li key={i} className="text-sm leading-relaxed pl-1">{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="fixed bottom-0 right-0 w-[45%] h-24 bg-gradient-to-t from-[#E5E7EB] to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
