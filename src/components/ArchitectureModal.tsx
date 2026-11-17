import React from 'react';
import { X } from 'lucide-react';
import { MermaidCanvas } from './MermaidCanvas';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const PIPELINE_DIAGRAM = `flowchart LR
  IN["Video / Audio / YouTube / Slides"] --> TR["Multi-Modal Transcription"]
  IN --> VIS["Visual Slide & Diagram Extraction"]
  TR --> ALIGN["Timestamp & Concept Alignment"]
  VIS --> ALIGN
  ALIGN --> NOTES["Markdown Notes + Clickable [MM:SS]"]
  ALIGN --> MMD["Mermaid.js Architecture Flowcharts"]
  ALIGN --> VAULT["KaTeX LaTeX & Code Vault"]
  ALIGN --> RECALL["Active Recall Flashcards & Quiz"]`;

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
  isDark,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="arch-modal-title"
    >
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="arch-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Problem Statement & Platform Architecture
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              NeuroNotes AI MVP Specification — Automated Multi-Modal Lecture Intelligence
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close overview"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto workspace-scroll space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                01. The Core Problem
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                University students and engineers consume hours of dense technical lectures, yet recorded videos are linear and tedious to scrub. Basic speech-to-text tools produce unformatted walls of text that mangle programming syntax, math equations, and visual slide diagrams.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                02. Value Proposition
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Reduce lecture revision time by transforming long-form video, audio, and YouTube links into a synchronized split-screen workspace featuring clickable timestamps, Mermaid.js architecture diagrams, KaTeX math, formatted code blocks, and active recall loops.
              </p>
            </div>
          </div>

          <MermaidCanvas
            code={PIPELINE_DIAGRAM}
            title="Multi-Modal Knowledge Extraction Pipeline"
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
};
