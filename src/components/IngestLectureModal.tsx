import React, { useState } from 'react';
import { FileAudio, FileText, Link2, Loader2, Upload, X } from 'lucide-react';
import { LectureWorkspace } from '../types/lecture';

interface IngestLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLectureCreated: (lecture: LectureWorkspace) => void;
}

type IngestMode = 'youtube' | 'file' | 'text';

const SAMPLE_TRANSCRIPT_SNIPPET = `Welcome to CS 342: Operating Systems Kernel Concurrency.
At 01:15, notice why spinlocks disable local interrupts before acquiring a lock on a single-CPU core: if a timer interrupt triggers a context switch while holding a spinlock, the next thread spins forever causing deadlock.
At 05:40, let us trace Peterson's Algorithm for 2-thread mutual exclusion:
flag[i] = true; turn = j; while (flag[j] && turn == j) {}
Modern out-of-order CPUs reorder stores and loads, so we need a memory barrier (mfence) between setting flag[i] and reading flag[j].
At 11:20, compare Mutexes vs Semaphores: A mutex enforces strict ownership—only the thread that acquired it can release it—whereas a counting semaphore tracks available resource permits S >= 0 via wait(P) and signal(V).
Let us write the atomic Compare-And-Swap spinlock loop in C:
while (__atomic_exchange_n(&lock->locked, 1, __ATOMIC_ACQUIRE) != 0) { while (lock->locked) {} }`;

export const IngestLectureModal: React.FC<IngestLectureModalProps> = ({
  isOpen,
  onClose,
  onLectureCreated,
}) => {
  const [mode, setMode] = useState<IngestMode>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setStatusMessage(
      mode === 'file'
        ? 'Transcribing & extracting visual structures...'
        : mode === 'youtube'
        ? 'Analyzing YouTube lecture & building knowledge graph...'
        : 'Structuring Markdown notes, diagrams & recall deck...'
    );

    try {
      let response: Response;
      let localMediaUrl: string | undefined;
      let localMediaMime: string | undefined;

      if (mode === 'file') {
        if (!selectedFile) {
          throw new Error('Please choose an audio, video, slide image, or PDF file.');
        }
        if (
          selectedFile.type.startsWith('video/') ||
          selectedFile.type.startsWith('audio/')
        ) {
          localMediaUrl = URL.createObjectURL(selectedFile);
          localMediaMime = selectedFile.type;
        }
        const formData = new FormData();
        formData.append('mode', 'file');
        formData.append('file', selectedFile);
        if (customTitle) formData.append('customTitle', customTitle);
        if (courseCode) formData.append('courseCode', courseCode);
        if (rawText) formData.append('rawText', rawText);

        response = await fetch('/api/lectures/ingest', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/lectures/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: mode === 'youtube' ? 'youtube' : 'text',
            youtubeUrl: mode === 'youtube' ? youtubeUrl.trim() : undefined,
            rawText: rawText.trim(),
            customTitle: customTitle.trim() || undefined,
            courseCode: courseCode.trim() || undefined,
          }),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process lecture.');
      }

      const created: LectureWorkspace = {
        ...data.lecture,
        mediaUrl: localMediaUrl,
        mediaMimeType: localMediaMime,
      };

      onLectureCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected ingestion error.');
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ingest-modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="ingest-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Ingest New Lecture
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Convert raw video, audio, slides, or YouTube links into a split-screen study workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Source Type Segmented Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(
              [
                { id: 'youtube', label: 'YouTube Link', icon: Link2 },
                { id: 'file', label: 'Upload Media / Slide', icon: FileAudio },
                { id: 'text', label: 'Transcript / Notes', icon: FileText },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMode(tab.id);
                    setError(null);
                  }}
                  className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Lecture Title (Optional)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Virtual Memory & Page Tables"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Course Code (Optional)
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g., CS 162"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {mode === 'youtube' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  YouTube Lecture URL
                </label>
                <input
                  type="url"
                  required
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Supplementary Focus or Transcript Snippet (Optional)
                </label>
                <textarea
                  rows={3}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Optional: paste key topics or sections you want emphasized in the diagrams and flashcards..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {mode === 'file' && (
            <div className="space-y-4">
              <label className="block rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/60 p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="audio/*,video/*,image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {selectedFile
                    ? selectedFile.name
                    : 'Choose audio, video, slide image, or PDF (max 25 MB)'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · ${
                        selectedFile.type || 'Binary file'
                      }`
                    : 'MP3, WAV, M4A, MP4, WebM, PNG, JPG, or PDF slides'}
                </div>
              </label>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Context Note (Optional)
                </label>
                <input
                  type="text"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="e.g., Extract the dynamic programming recurrence and Python code"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {mode === 'text' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Raw Whisper Transcript or Lecture Notes
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCustomTitle('Kernel Concurrency, Spinlocks & Memory Barriers');
                    setCourseCode('CS 342');
                    setRawText(SAMPLE_TRANSCRIPT_SNIPPET);
                  }}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Load sample OS transcript
                </button>
              </div>
              <textarea
                rows={6}
                required
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste an unformatted speech-to-text dump, lecture slides text, or rough notes..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              />
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isSubmitting
                ? statusMessage
                : 'Generates timestamped notes, Mermaid diagrams, KaTeX & flashcards'}
            </span>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition-colors whitespace-nowrap"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Extracting...' : 'Extract Knowledge'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
