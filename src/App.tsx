import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Download,
  Moon,
  Plus,
  Search,
  Sun,
} from 'lucide-react';
import { SAMPLE_LECTURES } from './data/sampleLectures';
import { LectureWorkspace } from './types/lecture';
import { exportLectureAsMarkdown, formatTimestamp } from './utils/time';
import { LecturePlayerPane } from './components/LecturePlayerPane';
import {
  KnowledgeStudioPane,
  StudioTab,
} from './components/KnowledgeStudioPane';
import { IngestLectureModal } from './components/IngestLectureModal';
import { LibraryModal } from './components/LibraryModal';
import { ArchitectureModal } from './components/ArchitectureModal';

const STORAGE_KEY = 'neuronotes_custom_lectures_v1';
const THEME_KEY = 'neuronotes_theme_v1';

export default function App() {
  const sampleIds = useMemo(
    () => new Set(SAMPLE_LECTURES.map((l) => l.id)),
    []
  );

  const [customLectures, setCustomLectures] = useState<LectureWorkspace[]>(
    () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as LectureWorkspace[]) : [];
      } catch {
        return [];
      }
    }
  );

  const lectures = useMemo(
    () => [...customLectures, ...SAMPLE_LECTURES],
    [customLectures]
  );

  const [activeLectureId, setActiveLectureId] = useState<string>(
    () => lectures[0]?.id ?? SAMPLE_LECTURES[0].id
  );
  const [activeTab, setActiveTab] = useState<StudioTab>('notes');
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [seekTrigger, setSeekTrigger] = useState<{
    sec: number;
    nonce: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  useEffect(() => {
    try {
      // Omit temporary blob URLs when persisting custom lectures
      const serializable = customLectures.map((l) => ({
        ...l,
        mediaUrl: undefined,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch {
      // ignore storage quota errors
    }
  }, [customLectures]);

  const activeLecture = useMemo(
    () => lectures.find((l) => l.id === activeLectureId) ?? lectures[0],
    [lectures, activeLectureId]
  );

  const handleSeek = useCallback((sec: number) => {
    setCurrentTimeSec(sec);
    setSeekTrigger({ sec, nonce: Date.now() });
  }, []);

  const handleSelectLecture = (id: string) => {
    setActiveLectureId(id);
    setCurrentTimeSec(0);
    setSeekTrigger(null);
    setSearchQuery('');
  };

  const handleLectureCreated = (newLecture: LectureWorkspace) => {
    setCustomLectures((prev) => [newLecture, ...prev]);
    setActiveLectureId(newLecture.id);
    setCurrentTimeSec(0);
    setSeekTrigger(null);
    setActiveTab('notes');
  };

  const handleDeleteLecture = (id: string) => {
    setCustomLectures((prev) => prev.filter((l) => l.id !== id));
    if (activeLectureId === id) {
      setActiveLectureId(SAMPLE_LECTURES[0].id);
      setCurrentTimeSec(0);
    }
  };

  const handleExportMarkdown = () => {
    if (!activeLecture) return;
    const md = exportLectureAsMarkdown(
      activeLecture.title,
      activeLecture.courseCode,
      activeLecture.instructor,
      activeLecture.summary,
      activeLecture.notesMarkdown,
      activeLecture.diagrams,
      activeLecture.mathFormulas
    );
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeLecture.courseCode
      .toLowerCase()
      .replace(/\s+/g, '-')}-notes.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F1F5F9]">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <a
            href="#workspace"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('notes');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            NeuroNotes AI
          </a>

          {/* Zone 2: Clean Typography Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Workspace
            </button>
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Library
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recall')}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Recall Studio
            </button>
            <button
              type="button"
              onClick={() => setIsArchOpen(true)}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Architecture
            </button>
          </nav>

          {/* Zone 3: 1 Primary CTA Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsIngestOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ingest Lecture</span>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Context & Utility Toolbar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="group inline-flex items-center gap-2 text-left max-w-full"
            >
              <h1 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {activeLecture.title}
              </h1>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Zero-pill unboxed metadata line */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {activeLecture.courseCode}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeLecture.domain}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {formatTimestamp(activeLecture.durationSec)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {activeLecture.diagrams.length} diagrams
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {activeLecture.flashcards.length} flashcards
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes & transcript..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export .md</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Split-Screen Study Workspace */}
      <main
        id="workspace"
        className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch lg:h-[calc(100vh-172px)] lg:min-h-[620px]">
          <section
            aria-label="Synchronized lecture player and transcript"
            className="lg:col-span-5 min-h-[480px] lg:h-full"
          >
            <LecturePlayerPane
              lecture={activeLecture}
              currentTimeSec={currentTimeSec}
              seekTrigger={seekTrigger}
              onTimeUpdate={setCurrentTimeSec}
              onSeek={handleSeek}
              searchQuery={searchQuery}
            />
          </section>

          <section
            aria-label="Structured notes, diagrams, code vault, and active recall"
            className="lg:col-span-7 min-h-[540px] lg:h-full"
          >
            <KnowledgeStudioPane
              lecture={activeLecture}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              currentTimeSec={currentTimeSec}
              onSeek={handleSeek}
              searchQuery={searchQuery}
              isDark={isDark}
            />
          </section>
        </div>
      </main>

      {/* Modals */}
      <IngestLectureModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onLectureCreated={handleLectureCreated}
      />

      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        lectures={lectures}
        activeLectureId={activeLecture.id}
        onSelect={handleSelectLecture}
        onDelete={handleDeleteLecture}
        sampleIds={sampleIds}
      />

      <ArchitectureModal
        isOpen={isArchOpen}
        onClose={() => setIsArchOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
