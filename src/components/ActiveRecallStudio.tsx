import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import {
  ConfidenceRating,
  Flashcard,
  FlashcardProgress,
  QuizQuestion,
} from '../types/lecture';
import { formatTimestamp } from '../utils/time';

interface ActiveRecallStudioProps {
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  onSeek: (sec: number) => void;
}

export const ActiveRecallStudio: React.FC<ActiveRecallStudioProps> = ({
  flashcards,
  quizQuestions,
  onSeek,
}) => {
  const [mode, setMode] = useState<'flashcards' | 'quiz'>('flashcards');

  // Flashcard state
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [progress, setProgress] = useState<FlashcardProgress>({});

  // Quiz state
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const safeCardIdx =
    flashcards.length > 0 ? Math.min(cardIdx, flashcards.length - 1) : 0;
  const activeCard = flashcards[safeCardIdx];

  const reviewedCount = Object.keys(progress).length;
  const masteredCount = Object.values(progress).filter(
    (r) => r === 'good' || r === 'easy'
  ).length;

  const handleRateCard = (rating: ConfidenceRating) => {
    if (!activeCard) return;
    setProgress((prev) => ({ ...prev, [activeCard.id]: rating }));
    setIsFlipped(false);
    setShowHint(false);
    if (safeCardIdx < flashcards.length - 1) {
      setTimeout(() => setCardIdx((i) => i + 1), 160);
    }
  };

  const quizAnsweredCount = Object.keys(answers).length;
  const quizCorrectCount = quizQuestions.reduce((acc, q) => {
    return answers[q.id] === q.correctIndex ? acc + 1 : acc;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Sub-mode Switcher & Real Session Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('flashcards')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              mode === 'flashcards'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Flashcards ({flashcards.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('quiz')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              mode === 'quiz'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Concept Quiz ({quizQuestions.length})
          </button>
        </div>

        <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
          {mode === 'flashcards' ? (
            <span>
              Reviewed {reviewedCount}/{flashcards.length} · Confident{' '}
              {masteredCount}
            </span>
          ) : (
            <span>
              Score {quizCorrectCount}/{quizQuestions.length} · Answered{' '}
              {quizAnsweredCount}/{quizQuestions.length}
            </span>
          )}
        </div>
      </div>

      {mode === 'flashcards' ? (
        flashcards.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No flashcards extracted for this lecture yet.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Card Navigation Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                  Card {safeCardIdx + 1} of {flashcards.length}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeCard.topic}</span>
                {progress[activeCard.id] && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize font-medium text-blue-600 dark:text-blue-400">
                      Rated {progress[activeCard.id]}
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSeek(activeCard.timestampSec)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono text-xs tabular-nums hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Review {formatTimestamp(activeCard.timestampSec)}</span>
              </button>
            </div>

            {/* 3D Flip Card */}
            <div
              className="perspective-1000 cursor-pointer select-none"
              onClick={() => setIsFlipped((f) => !f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setIsFlipped((f) => !f);
                }
              }}
              aria-label="Flip flashcard"
            >
              <div
                className={`relative w-full min-h-[240px] transition-transform duration-300 preserve-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-6 sm:p-8 flex flex-col justify-between">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Prompt · Click card to reveal answer
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-snug max-w-2xl">
                    {activeCard.front}
                  </p>
                  <div className="flex items-center justify-between gap-4 pt-2">
                    {activeCard.hint ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHint((h) => !h);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                      </button>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-slate-400">Space or Click</span>
                  </div>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between">
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    Recall Answer
                  </div>
                  <p className="text-[15px] sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed max-w-2xl">
                    {activeCard.back}
                  </p>
                  <div className="text-xs text-slate-400">
                    Rate your recall confidence below
                  </div>
                </div>
              </div>
            </div>

            {showHint && !isFlipped && activeCard.hint && (
              <div className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Hint: </span>
                {activeCard.hint}
              </div>
            )}

            {/* Spaced Repetition Rating & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeCardIdx === 0}
                  onClick={() => {
                    setIsFlipped(false);
                    setShowHint(false);
                    setCardIdx((i) => Math.max(0, i - 1));
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={safeCardIdx >= flashcards.length - 1}
                  onClick={() => {
                    setIsFlipped(false);
                    setShowHint(false);
                    setCardIdx((i) => Math.min(flashcards.length - 1, i + 1));
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {(
                  [
                    {
                      id: 'again',
                      label: 'Again',
                      cls: 'border-rose-200 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50',
                    },
                    {
                      id: 'hard',
                      label: 'Hard',
                      cls: 'border-amber-200 dark:border-amber-900/80 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50',
                    },
                    {
                      id: 'good',
                      label: 'Good',
                      cls: 'border-blue-200 dark:border-blue-900/80 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50',
                    },
                    {
                      id: 'easy',
                      label: 'Easy',
                      cls: 'border-emerald-200 dark:border-emerald-900/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50',
                    },
                  ] as const
                ).map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => handleRateCard(btn.id)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${btn.cls}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      ) : quizQuestions.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No quiz questions extracted for this lecture yet.
        </div>
      ) : (
        <div className="space-y-6">
          {quizQuestions.map((q, qIdx) => {
            const selectedIdx = answers[q.id];
            const isAnswered = selectedIdx !== undefined;
            const isCorrect = selectedIdx === q.correctIndex;

            return (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 bg-white dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      Question {qIdx + 1}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{q.difficulty}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSeek(q.timestampSec)}
                    className="inline-flex items-center gap-1 text-xs font-mono tabular-nums text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{formatTimestamp(q.timestampSec)}</span>
                  </button>
                </div>

                <p className="text-[15px] font-semibold text-slate-900 dark:text-white leading-snug">
                  {q.question}
                </p>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedIdx === optIdx;
                    const isRightOption = optIdx === q.correctIndex;

                    let optionStyle =
                      'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200';
                    if (isAnswered) {
                      if (isRightOption) {
                        optionStyle =
                          'border-emerald-500/70 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                      } else if (isSelected && !isRightOption) {
                        optionStyle =
                          'border-rose-500/70 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                      } else {
                        optionStyle =
                          'border-slate-200/60 dark:border-slate-800/60 text-slate-400 dark:text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={isAnswered}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                        }
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-center justify-between gap-3 ${optionStyle}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-mono text-xs font-semibold pt-0.5 shrink-0">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span>{opt}</span>
                        </div>

                        {isAnswered && isRightOption && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Correct</span>
                          </span>
                        )}
                        {isAnswered && isSelected && !isRightOption && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-300 shrink-0">
                            <XCircle className="w-4 h-4" />
                            <span>Incorrect</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {isCorrect ? 'Explanation: ' : 'Why: '}
                    </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {quizAnsweredCount > 0 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                Final Score: {quizCorrectCount} / {quizQuestions.length}
              </span>
              <button
                type="button"
                onClick={() => setAnswers({})}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Quiz</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
