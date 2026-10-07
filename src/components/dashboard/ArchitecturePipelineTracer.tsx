'use client';
import React, { useState } from 'react';
import { Binary, ShieldCheck, Calculator, BrainCircuit, ChevronRight, Info } from 'lucide-react';

interface StageNode {
  id: number;
  step: string;
  title: string;
  sub: string;
  tech: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tooltip: string;
  badgeColor: string;
  glowColor: string;
}

const PIPELINE_NODES: StageNode[] = [
  {
    id: 1,
    step: "01",
    title: "Raw PDF Buffer",
    sub: "In-Memory RAM",
    tech: "pdf-parse v1.1.1",
    icon: Binary,
    tooltip: "In-memory RAM stream via pdf-parse • 0B disk footprint • Auto-detects CID glitches",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    glowColor: "group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/20",
  },
  {
    id: 2,
    step: "02",
    title: "Regex PII Shield",
    sub: "Pre-LLM Masking",
    tech: "Zero-Leakage Guard",
    icon: ShieldCheck,
    tooltip: "Scans for RFC-5322 emails & E.164 phone formats • Redacted to [REDACTED_x] prior to external API hops",
    badgeColor: "text-sky-400 bg-sky-500/10 border-sky-500/30",
    glowColor: "group-hover:border-sky-500/50 group-hover:shadow-sky-500/20",
  },
  {
    id: 3,
    step: "03",
    title: "Jaccard Math Matrix",
    sub: "Deterministic Overlap",
    tech: "|A ∩ B| / |A ∪ B|",
    icon: Calculator,
    tooltip: "Tokenizes N-Grams & calculates exact intersection ratio: |A ∩ B| / |A ∪ B| • 0% hallucination",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    glowColor: "group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/20",
  },
  {
    id: 4,
    step: "04",
    title: "DeepSeek STAR Engine",
    sub: "JSON Synthesis",
    tech: "DeepSeek-V3 Zod Mode",
    icon: BrainCircuit,
    tooltip: "DeepSeek-V3 JSON-mode schema synthesis with Zod structural contract fallbacks",
    badgeColor: "text-teal-400 bg-teal-500/10 border-teal-500/30",
    glowColor: "group-hover:border-teal-500/50 group-hover:shadow-teal-500/20",
  },
];

export function ArchitecturePipelineTracer() {
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);

  const activeNode = PIPELINE_NODES.find((n) => n.id === activeNodeId) || null;

  return (
    <div className="w-full max-w-6xl mx-auto mt-6 bg-zinc-950/70 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
      {/* Background Micro Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-30"></div>
      
      {/* Top Header Label */}
      <div className="flex items-center justify-between mb-3.5 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">
            Live Pipeline Architecture Tracer
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800/90 text-zinc-400 border border-zinc-700/60 hidden sm:inline">
            Interactive Node Stream
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">
          Hover or tap nodes for telemetry specs
        </span>
      </div>

      {/* Main Stepper Pipeline Bar */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Nodes Strip */}
        <div className="flex-1 w-full flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {PIPELINE_NODES.map((node, idx) => {
            const Icon = node.icon;
            const isSelected = activeNodeId === node.id;

            return (
              <React.Fragment key={node.id}>
                {/* Node Pill */}
                <div
                  onMouseEnter={() => setActiveNodeId(node.id)}
                  onMouseLeave={() => setActiveNodeId(null)}
                  onClick={() => setActiveNodeId(isSelected ? null : node.id)}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none flex-1 min-w-[170px] ${
                    isSelected
                      ? 'bg-zinc-900 border-zinc-600 shadow-lg shadow-black/60 scale-[1.02]'
                      : 'bg-zinc-900/60 hover:bg-zinc-900/90 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Icon Box */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${node.badgeColor} shadow-sm`}
                  >
                    <Icon size={16} />
                  </div>

                  {/* Label Block */}
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-mono text-zinc-500 font-bold tracking-wider">
                        STAGE {node.step}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 hidden xl:inline">
                        {node.sub}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-zinc-200 truncate font-mono tracking-tight group-hover:text-white transition-colors">
                      {node.title}
                    </div>
                  </div>

                  {/* Micro Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 hidden md:block">
                    <div className="bg-zinc-900 border border-zinc-750 text-zinc-200 text-[10px] font-mono px-2.5 py-1 rounded-md shadow-xl flex items-center gap-1.5 border-zinc-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{node.tech}</span>
                    </div>
                  </div>
                </div>

                {/* Animated Flow Connector */}
                {idx < PIPELINE_NODES.length - 1 && (
                  <div className="hidden sm:flex items-center gap-1 flex-shrink-0 px-0.5">
                    <div className="h-[2px] w-5 lg:w-7 bg-gradient-to-r from-emerald-500/50 via-teal-500/40 to-cyan-500/50 relative overflow-hidden rounded-full">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300 to-transparent w-full animate-pulse"></div>
                    </div>
                    <ChevronRight size={12} className="text-zinc-600 -ml-1" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Live System Status Widget (Right Corner) */}
        <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-3.5 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-zinc-800/80 lg:pl-5 font-mono">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="absolute w-4 h-4 rounded-full bg-emerald-400/40 animate-ping"></span>
            </div>
            <div className="text-left text-[11px] leading-tight">
              <div className="text-zinc-300 font-semibold tracking-wider flex items-center gap-1.5">
                <span className="text-zinc-500">PIPELINE LATENCY:</span>
                <span className="text-emerald-400 font-bold">~1.2s</span>
              </div>
              <div className="text-[10px] text-zinc-400 tracking-tight mt-0.5">
                MEMORY: <span className="text-cyan-400 font-medium">Ephemeral (Zero-Disk)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Terminal Tooltip Tray (Expands on active node hover or click) */}
      <div
        className={`transition-all duration-300 overflow-hidden relative z-10 ${
          activeNode
            ? 'max-h-20 opacity-100 mt-3.5 pt-2.5 border-t border-zinc-800/80'
            : 'max-h-0 opacity-0 m-0 p-0 border-none'
        }`}
      >
        {activeNode && (
          <div className="flex items-start sm:items-center gap-2.5 bg-zinc-900/90 border border-zinc-750 px-3.5 py-2 rounded-xl text-left border-zinc-700/80 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="p-1 rounded bg-zinc-800 text-cyan-400 mt-0.5 sm:mt-0 flex-shrink-0">
              <Info size={13} />
            </div>
            <div className="font-mono text-xs flex-1">
              <span className="text-emerald-400 font-bold mr-2">
                [{activeNode.step} • {activeNode.title.toUpperCase()}]:
              </span>
              <span className="text-zinc-200 leading-relaxed font-normal">
                {activeNode.tooltip}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
