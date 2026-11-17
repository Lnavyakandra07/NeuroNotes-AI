import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
} from 'lucide-react';
import { LectureWorkspace, SlideFrame, TranscriptTag } from '../types/lecture';
import { formatTimestamp } from '../utils/time';
import { MathRenderer } from './MathRenderer';

interface LecturePlayerPaneProps {
  lecture: LectureWorkspace;
  currentTimeSec: number;
  seekTrigger: { sec: number; nonce: number } | null;
  onTimeUpdate: (sec: number) => void;
  onSeek: (sec: number) => void;
  searchQuery: string;
}

const SlideVisualGraphic: React.FC<{ slide: SlideFrame }> = ({ slide }) => {
  if (slide.visualType === 'attention-matrix') {
    const tokens = ['The', 'model', 'attends', 'here'];
    const weights = [
      [0.72, 0.14, 0.08, 0.06],
      [0.18, 0.54, 0.21, 0.07],
      [0.09, 0.34, 0.45, 0.12],
      [0.05, 0.19, 0.48, 0.28],
    ];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div className="space-y-2">
          {slide.highlights.map((h, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed"
            >
              <span className="font-mono text-blue-400 tabular-nums shrink-0">
                0{i + 1}.
              </span>
              <span>{h}</span>
            </div>
          ))}
          {slide.formulaLatex && (
            <div className="mt-3 pt-3 border-t border-slate-800 text-slate-100 overflow-x-auto">
              <MathRenderer latex={slide.formulaLatex} displayMode />
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span>Softmax(QK^T / sqrt(d_k))</span>
            <span>4 x 4</span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-[10px] font-mono">
            <div />
            {tokens.map((t) => (
              <div key={t} className="text-center text-slate-400 truncate">
                {t}
              </div>
            ))}
            {weights.map((row, rIdx) => (
              <React.Fragment key={rIdx}>
                <div className="text-slate-400 flex items-center truncate pr-1">
                  {tokens[rIdx]}
                </div>
                {row.map((val, cIdx) => {
                  const masked = cIdx > rIdx && slide.index >= 3;
                  const opacity = masked ? 0.08 : Math.max(0.15, val);
                  return (
                    <div
                      key={cIdx}
                      className="h-7 rounded flex items-center justify-center tabular-nums text-white border border-slate-800/80"
                      style={{
                        backgroundColor: masked
                          ? 'rgba(15, 23, 42, 0.9)'
                          : `rgba(37, 99, 235, ${opacity})`,
                      }}
                    >
                      {masked ? '0.00' : val.toFixed(2)}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (slide.visualType === 'raft-consensus') {
    const nodes = [
      { id: 'S1', role: 'Leader', x: 140, y: 36, active: true },
      { id: 'S2', role: 'Follower', x: 46, y: 92, active: true },
      { id: 'S3', role: 'Follower', x: 234, y: 92, active: true },
      { id: 'S4', role: 'Follower', x: 76, y: 158, active: false },
      { id: 'S5', role: 'Partition', x: 204, y: 158, active: false },
    ];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div className="space-y-2">
          {slide.highlights.map((h, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed"
            >
              <span className="font-mono text-blue-400 tabular-nums shrink-0">
                0{i + 1}.
              </span>
              <span>{h}</span>
            </div>
          ))}
          {slide.formulaLatex && (
            <div className="mt-3 pt-3 border-t border-slate-800 text-slate-100 overflow-x-auto">
              <MathRenderer latex={slide.formulaLatex} displayMode />
            </div>
          )}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-2 flex flex-col items-center">
          <svg viewBox="0 0 280 190" className="w-full max-w-[260px] h-auto">
            <line x1="140" y1="36" x2="46" y2="92" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="140" y1="36" x2="234" y2="92" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="140" y1="36" x2="76" y2="158" stroke="#475569" strokeWidth="1" />
            <line x1="140" y1="36" x2="204" y2="158" stroke="#EF4444" strokeWidth="1" strokeDasharray="2 4" />
            {nodes.map((n) => (
              <g key={n.id}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r="19"
                  fill={n.role === 'Leader' ? '#1D4ED8' : n.active ? '#0F172A' : '#1E293B'}
                  stroke={n.role === 'Leader' ? '#60A5FA' : n.active ? '#3B82F6' : '#64748B'}
                  strokeWidth="1.5"
                />
                <text
                  x={n.x}
                  y={n.y - 1}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {n.id}
                </text>
                <text
                  x={n.x}
                  y={n.y + 10}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="7"
                  fontFamily="DM Sans, sans-serif"
                >
                  {n.role}
                </text>
              </g>
            ))}
          </svg>
          <span className="text-[11px] font-mono text-slate-400">
            Quorum Majority: 3 / 5 Nodes Active
          </span>
        </div>
      </div>
    );
  }

  if (slide.visualType === 'bplus-tree') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div className="space-y-2">
          {slide.highlights.map((h, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed"
            >
              <span className="font-mono text-blue-400 tabular-nums shrink-0">
                0{i + 1}.
              </span>
              <span>{h}</span>
            </div>
          ))}
          {slide.formulaLatex && (
            <div className="mt-3 pt-3 border-t border-slate-800 text-slate-100 overflow-x-auto">
              <MathRenderer latex={slide.formulaLatex} displayMode />
            </div>
          )}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
          <svg viewBox="0 0 280 155" className="w-full h-auto">
            <rect x="92" y="10" width="96" height="26" rx="4" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="1.2" />
            <text x="140" y="27" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontFamily="JetBrains Mono, monospace">
              [ 50 | 120 ]
            </text>

            <line x1="115" y1="36" x2="55" y2="62" stroke="#64748B" strokeWidth="1.2" />
            <line x1="140" y1="36" x2="140" y2="62" stroke="#64748B" strokeWidth="1.2" />
            <line x1="165" y1="36" x2="225" y2="62" stroke="#64748B" strokeWidth="1.2" />

            <rect x="12" y="62" width="84" height="24" rx="4" fill="#0F172A" stroke="#334155" />
            <text x="54" y="78" textAnchor="middle" fill="#E2E8F0" fontSize="9" fontFamily="JetBrains Mono, monospace">
              Leaf 5, 10
            </text>

            <rect x="102" y="62" width="76" height="24" rx="4" fill="#0F172A" stroke="#334155" />
            <text x="140" y="78" textAnchor="middle" fill="#E2E8F0" fontSize="9" fontFamily="JetBrains Mono, monospace">
              Leaf 50, 75
            </text>

            <rect x="184" y="62" width="84" height="24" rx="4" fill="#0F172A" stroke="#334155" />
            <text x="226" y="78" textAnchor="middle" fill="#E2E8F0" fontSize="9" fontFamily="JetBrains Mono, monospace">
              Leaf 120..
            </text>

            <line x1="96" y1="74" x2="102" y2="74" stroke="#3B82F6" strokeWidth="2" />
            <line x1="178" y1="74" x2="184" y2="74" stroke="#3B82F6" strokeWidth="2" />
            <text x="140" y="114" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="DM Sans, sans-serif">
              Doubly-linked sequential leaf pointers
            </text>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        {slide.highlights.map((h, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed"
          >
            <span className="font-mono text-blue-400 tabular-nums shrink-0">
              0{i + 1}.
            </span>
            <span>{h}</span>
          </div>
        ))}
      </div>
      {slide.formulaLatex && (
        <div className="mt-3 pt-3 border-t border-slate-800 text-slate-100 overflow-x-auto">
          <MathRenderer latex={slide.formulaLatex} displayMode />
        </div>
      )}
    </div>
  );
};

export const LecturePlayerPane: React.FC<LecturePlayerPaneProps> = ({
  lecture,
  currentTimeSec,
  seekTrigger,
  onTimeUpdate,
  onSeek,
  searchQuery,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [tagFilter, setTagFilter] = useState<'all' | TranscriptTag>('all');

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeTranscriptRef = useRef<HTMLButtonElement | null>(null);

  // Handle imperative seeks from notes/diagrams/flashcards
  useEffect(() => {
    if (!seekTrigger) return;
    const targetSec = seekTrigger.sec;

    if (lecture.sourceType === 'youtube' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [targetSec, true],
        }),
        '*'
      );
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'playVideo',
          args: [],
        }),
        '*'
      );
    }

    if (videoRef.current) {
      videoRef.current.currentTime = targetSec;
      videoRef.current.play().catch(() => {});
    }

    if (audioRef.current) {
      audioRef.current.currentTime = targetSec;
      audioRef.current.play().catch(() => {});
    }
  }, [seekTrigger, lecture.sourceType]);

  // Simulated lecture clock for slide-synced / text-analyzed lectures
  useEffect(() => {
    if (
      !isPlaying ||
      lecture.sourceType === 'youtube' ||
      (lecture.sourceType === 'uploaded-media' && lecture.mediaUrl)
    ) {
      return;
    }

    const interval = setInterval(() => {
      onTimeUpdate(
        currentTimeSec + playbackRate >= lecture.durationSec
          ? 0
          : currentTimeSec + playbackRate
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isPlaying,
    playbackRate,
    currentTimeSec,
    lecture.durationSec,
    lecture.sourceType,
    lecture.mediaUrl,
    onTimeUpdate,
  ]);

  const currentSlide = useMemo(() => {
    if (!lecture.slides || lecture.slides.length === 0) return null;
    let match = lecture.slides[0];
    for (const s of lecture.slides) {
      if (currentTimeSec >= s.startSec) {
        match = s;
      }
    }
    return match;
  }, [lecture.slides, currentTimeSec]);

  const activeSegmentId = useMemo(() => {
    const seg = lecture.transcript.find(
      (t) => currentTimeSec >= t.startSec && currentTimeSec <= t.endSec
    );
    return seg?.id ?? null;
  }, [lecture.transcript, currentTimeSec]);

  const filteredTranscript = useMemo(() => {
    return lecture.transcript.filter((seg) => {
      const matchesTag =
        tagFilter === 'all' || (seg.tags && seg.tags.includes(tagFilter));
      const matchesSearch =
        !searchQuery.trim() ||
        seg.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTag && matchesSearch;
    });
  }, [lecture.transcript, tagFilter, searchQuery]);

  const visualMarkers = useMemo(() => {
    const items: Array<{ sec: number; label: string; kind: string }> = [];
    lecture.diagrams.forEach((d) =>
      items.push({ sec: d.timestampSec, label: d.title, kind: 'Diagram' })
    );
    lecture.codeBlocks.forEach((c) =>
      items.push({ sec: c.timestampSec, label: c.title, kind: 'Code' })
    );
    lecture.mathFormulas.forEach((m) =>
      items.push({ sec: m.timestampSec, label: m.title, kind: 'Math' })
    );
    return items.sort((a, b) => a.sec - b.sec);
  }, [lecture.diagrams, lecture.codeBlocks, lecture.mathFormulas]);

  const slideIndex = currentSlide
    ? lecture.slides.findIndex((s) => s.index === currentSlide.index)
    : 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Media / Visual Slide Stage */}
      <div className="bg-slate-950 text-white border-b border-slate-800">
        {lecture.sourceType === 'youtube' && lecture.youtubeId ? (
          <div className="aspect-video w-full bg-black">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${lecture.youtubeId}?enablejsapi=1&rel=0`}
              title={lecture.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : lecture.sourceType === 'uploaded-media' &&
          lecture.mediaUrl &&
          lecture.mediaMimeType?.startsWith('video/') ? (
          <div className="aspect-video w-full bg-black">
            <video
              ref={videoRef}
              src={lecture.mediaUrl}
              controls
              className="w-full h-full"
              onTimeUpdate={(e) =>
                onTimeUpdate(Math.floor(e.currentTarget.currentTime))
              }
            />
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {lecture.sourceType === 'uploaded-media' &&
              lecture.mediaUrl &&
              lecture.mediaMimeType?.startsWith('audio/') && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <Volume2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <audio
                    ref={audioRef}
                    src={lecture.mediaUrl}
                    controls
                    className="w-full h-8"
                    onTimeUpdate={(e) =>
                      onTimeUpdate(Math.floor(e.currentTarget.currentTime))
                    }
                  />
                </div>
              )}

            {/* Synchronized Lecture Slide Visual Frame */}
            <div className="min-h-[210px] flex flex-col justify-between">
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3 mb-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-mono text-slate-400 tabular-nums mb-1">
                    Slide {slideIndex + 1} of {Math.max(1, lecture.slides.length)} ·{' '}
                    {formatTimestamp(currentSlide?.startSec ?? 0)}
                  </div>
                  <h3 className="text-base font-semibold text-white leading-snug">
                    {currentSlide?.title ?? lecture.title}
                  </h3>
                  {currentSlide?.subtitle && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentSlide.subtitle}
                    </p>
                  )}
                </div>

                {lecture.slides.length > 1 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = lecture.slides[Math.max(0, slideIndex - 1)];
                        if (prev) onSeek(prev.startSec);
                      }}
                      disabled={slideIndex <= 0}
                      aria-label="Previous slide"
                      className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next =
                          lecture.slides[
                            Math.min(lecture.slides.length - 1, slideIndex + 1)
                          ];
                        if (next) onSeek(next.startSec);
                      }}
                      disabled={slideIndex >= lecture.slides.length - 1}
                      aria-label="Next slide"
                      className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {currentSlide && <SlideVisualGraphic slide={currentSlide} />}
            </div>

            {/* Interactive Timeline Scrubber + Playback Bar */}
            <div className="pt-2 space-y-2">
              <div className="relative h-6 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, lecture.durationSec)}
                  value={Math.min(currentTimeSec, lecture.durationSec)}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  aria-label="Lecture timeline scrubber"
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Sync</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPlaybackRate((r) => (r === 1 ? 1.5 : r === 1.5 ? 2 : 1))
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono tabular-nums transition-colors whitespace-nowrap shrink-0"
                  >
                    {playbackRate}x
                  </button>
                </div>

                <span className="font-mono tabular-nums text-slate-300">
                  {formatTimestamp(currentTimeSec)} /{' '}
                  {formatTimestamp(lecture.durationSec)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Visual Checkpoint Bar */}
        {visualMarkers.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/70 flex items-center gap-2 overflow-x-auto workspace-scroll">
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap shrink-0">
              Key Moments:
            </span>
            {visualMarkers.map((m, idx) => (
              <button
                key={`${m.kind}_${idx}`}
                type="button"
                onClick={() => onSeek(m.sec)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors whitespace-nowrap shrink-0"
              >
                <span className="font-mono text-blue-400 tabular-nums">
                  {formatTimestamp(m.sec)}
                </span>
                <span className="text-slate-400">·</span>
                <span className="max-w-[140px] truncate">{m.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Synchronized Transcript Feed */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
            Timestamped Transcript
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums whitespace-nowrap">
            {filteredTranscript.length} segments
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg shrink-0">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'diagram', label: 'Diagrams' },
              { id: 'code', label: 'Code' },
              { id: 'formula', label: 'Math' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTagFilter(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                tagFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto workspace-scroll divide-y divide-slate-100 dark:divide-slate-800/80">
        {filteredTranscript.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No transcript segments match the current filter or search query.
          </div>
        ) : (
          filteredTranscript.map((seg) => {
            const isActive = seg.id === activeSegmentId;
            return (
              <button
                key={seg.id}
                ref={isActive ? activeTranscriptRef : undefined}
                type="button"
                onClick={() => onSeek(seg.startSec)}
                className={`w-full text-left px-4 py-3.5 transition-colors flex items-start gap-3 ${
                  isActive
                    ? 'bg-blue-50/80 dark:bg-blue-950/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <span
                  className={`font-mono text-xs tabular-nums pt-0.5 shrink-0 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {formatTimestamp(seg.startSec)}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {seg.speaker && (
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {seg.speaker}
                      </span>
                    )}
                    {seg.tags && seg.tags.length > 0 && (
                      <>
                        {seg.speaker && <span aria-hidden="true">·</span>}
                        <span className="capitalize">
                          {seg.tags.join(' · ')}
                        </span>
                      </>
                    )}
                  </div>
                  <p
                    className={`text-[13.5px] leading-relaxed ${
                      isActive
                        ? 'text-slate-900 dark:text-white font-medium'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {seg.text}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
