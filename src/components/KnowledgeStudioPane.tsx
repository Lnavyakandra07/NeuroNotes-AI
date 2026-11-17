import React, { useState } from 'react';
import {
  Check,
  Copy,
  Loader2,
  MessageSquare,
  Play,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LectureWorkspace } from '../types/lecture';
import { formatTimestamp } from '../utils/time';
import { NotesMarkdownRenderer } from './NotesMarkdownRenderer';
import { MermaidCanvas } from './MermaidCanvas';
import { MathRenderer } from './MathRenderer';
import { ActiveRecallStudio } from './ActiveRecallStudio';

export type StudioTab = 'notes' | 'diagrams' | 'vault' | 'recall';

interface KnowledgeStudioPaneProps {
  lecture: LectureWorkspace;
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  currentTimeSec: number;
  onSeek: (sec: number) => void;
  searchQuery: string;
  isDark: boolean;
}

const VaultCodeCard: React.FC<{
  title: string;
  language: string;
  timestampSec: number;
  code: string;
  explanation: string;
  onSeek: (sec: number) => void;
}> = ({ title, language, timestampSec, code, explanation, onSeek }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language} · {explanation}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSeek(timestampSec)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono text-xs tabular-nums hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{formatTimestamp(timestampSec)}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <pre className="p-4 bg-slate-950 text-slate-100 text-xs sm:text-[13px] font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const KnowledgeStudioPane: React.FC<KnowledgeStudioPaneProps> = ({
  lecture,
  activeTab,
  onTabChange,
  currentTimeSec,
  onSeek,
  searchQuery,
  isDark,
}) => {
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<
    Array<{ q: string; a: string; timestampSec: number }>
  >([]);
  const [isAsking, setIsAsking] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    const currentQ = question.trim();
    const ts = currentTimeSec;
    setIsAsking(true);
    setQaError(null);

    try {
      const res = await fetch('/api/lectures/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureTitle: lecture.title,
          currentTimestampSec: ts,
          summary: lecture.summary,
          notesExcerpt: lecture.notesMarkdown,
          question: currentQ,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to clarify concept right now.');
      }
      setQaHistory((prev) => [
        { q: currentQ, a: data.answer, timestampSec: ts },
        ...prev,
      ]);
      setQuestion('');
    } catch (err) {
      setQaError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Segmented Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg overflow-x-auto">
          {(
            [
              { id: 'notes', label: 'Structured Notes' },
              {
                id: 'diagrams',
                label: `Visual Diagrams (${lecture.diagrams.length})`,
              },
              {
                id: 'vault',
                label: `Code & Math (${
                  lecture.codeBlocks.length + lecture.mathFormulas.length
                })`,
              },
              {
                id: 'recall',
                label: `Active Recall (${
                  lecture.flashcards.length + lecture.quizQuestions.length
                })`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAskOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Clarify Concept</span>
          {askOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Collapsible Timestamp-Anchored Concept Clarifier */}
      {askOpen && (
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 space-y-3">
          <form onSubmit={handleAsk} className="flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask about this lecture at ${formatTimestamp(
                currentTimeSec
              )}...`}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              {isAsking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Ask</span>
            </button>
          </form>

          {qaError && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{qaError}</p>
          )}

          {qaHistory.length > 0 && (
            <div className="space-y-3 max-h-56 overflow-y-auto workspace-scroll pt-1">
              {qaHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                    <span>{item.q}</span>
                    <button
                      type="button"
                      onClick={() => onSeek(item.timestampSec)}
                      className="font-mono text-[11px] text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                    >
                      [{formatTimestamp(item.timestampSec)}]
                    </button>
                  </div>
                  <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <NotesMarkdownRenderer
                      markdown={item.a}
                      onSeek={onSeek}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Scrollable Studio Body */}
      <div className="flex-1 overflow-y-auto workspace-scroll p-6">
        {activeTab === 'notes' && (
          <div className="space-y-6">
            {/* Executive Summary & Takeaways */}
            <div className="pb-5 border-b border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Executive Summary · {lecture.instructor}
              </div>
              <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 max-w-[72ch]">
                {lecture.summary}
              </p>

              {lecture.keyTakeaways.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Key Takeaways
                  </div>
                  <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                    {lecture.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 tabular-nums pt-0.5 shrink-0">
                          0{idx + 1}.
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <NotesMarkdownRenderer
              markdown={lecture.notesMarkdown}
              onSeek={onSeek}
              searchQuery={searchQuery}
            />
          </div>
        )}

        {activeTab === 'diagrams' && (
          <div className="space-y-6">
            {lecture.diagrams.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                No architectural diagrams extracted for this lecture.
              </div>
            ) : (
              lecture.diagrams.map((diag) => (
                <div key={diag.id} className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
                      {diag.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => onSeek(diag.timestampSec)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono text-xs tabular-nums hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Jump to {formatTimestamp(diag.timestampSec)}</span>
                    </button>
                  </div>
                  <MermaidCanvas
                    code={diag.mermaidCode}
                    title={diag.title}
                    isDark={isDark}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="space-y-8">
            {/* LaTeX Mathematical Formulations */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Mathematical Formulations
                </h3>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {lecture.mathFormulas.length} equations
                </span>
              </div>

              {lecture.mathFormulas.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No mathematical equations extracted.
                </p>
              ) : (
                <div className="space-y-4">
                  {lecture.mathFormulas.map((formula) => (
                    <div
                      key={formula.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 bg-white dark:bg-slate-900"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {formula.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => onSeek(formula.timestampSec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono text-xs tabular-nums hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{formatTimestamp(formula.timestampSec)}</span>
                        </button>
                      </div>

                      <div className="px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 overflow-x-auto text-center text-slate-900 dark:text-slate-100">
                        <MathRenderer latex={formula.latex} displayMode />
                      </div>

                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {formula.intuition}
                      </p>

                      {formula.variables.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {formula.variables.map((v, vIdx) => (
                            <div
                              key={vIdx}
                              className="flex items-baseline gap-2 text-xs text-slate-700 dark:text-slate-300"
                            >
                              <span className="shrink-0 font-mono text-slate-900 dark:text-white">
                                <MathRenderer latex={v.symbol} />
                              </span>
                              <span className="text-slate-400">—</span>
                              <span className="text-slate-600 dark:text-slate-400">
                                {v.meaning}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Extracted Code Blocks */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Extracted Code & Pseudocode
                </h3>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {lecture.codeBlocks.length} snippets
                </span>
              </div>

              {lecture.codeBlocks.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No code blocks extracted.
                </p>
              ) : (
                <div className="space-y-4">
                  {lecture.codeBlocks.map((snippet) => (
                    <VaultCodeCard
                      key={snippet.id}
                      title={snippet.title}
                      language={snippet.language}
                      timestampSec={snippet.timestampSec}
                      code={snippet.code}
                      explanation={snippet.explanation}
                      onSeek={onSeek}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'recall' && (
          <ActiveRecallStudio
            flashcards={lecture.flashcards}
            quizQuestions={lecture.quizQuestions}
            onSeek={onSeek}
          />
        )}
      </div>
    </div>
  );
};
