import React, { useState } from 'react';
import { Search, Trash2, X } from 'lucide-react';
import { LectureWorkspace } from '../types/lecture';
import { formatTimestamp } from '../utils/time';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lectures: LectureWorkspace[];
  activeLectureId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  sampleIds: Set<string>;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  lectures,
  activeLectureId,
  onSelect,
  onDelete,
  sampleIds,
}) => {
  const [filter, setFilter] = useState('');

  if (!isOpen) return null;

  const filtered = lectures.filter((l) => {
    const q = filter.toLowerCase();
    return (
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.courseCode.toLowerCase().includes(q) ||
      l.domain.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="library-modal-title"
    >
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col max-h-[82vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="library-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Lecture Library
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Switch between pre-loaded engineering lectures and your extracted workspaces.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close library"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by course code, topic, or domain..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto workspace-scroll divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No lectures match your search.
            </div>
          ) : (
            filtered.map((lec) => {
              const isActive = lec.id === activeLectureId;
              const isSample = sampleIds.has(lec.id);
              return (
                <div
                  key={lec.id}
                  className={`px-6 py-4 flex items-start justify-between gap-4 transition-colors ${
                    isActive
                      ? 'bg-blue-50/60 dark:bg-blue-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(lec.id);
                      onClose();
                    }}
                    className="text-left flex-1 min-w-0 space-y-1"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {lec.courseCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{lec.domain}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatTimestamp(lec.durationSec)}
                      </span>
                      {isActive && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Active
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {lec.title}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {lec.summary}
                    </p>
                    <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 pt-1">
                      {lec.diagrams.length} diagrams · {lec.codeBlocks.length}{' '}
                      code blocks · {lec.mathFormulas.length} formulas ·{' '}
                      {lec.flashcards.length} flashcards
                    </div>
                  </button>

                  {!isSample && (
                    <button
                      type="button"
                      onClick={() => onDelete(lec.id)}
                      aria-label={`Delete ${lec.title}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
