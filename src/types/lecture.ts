export type LectureSourceType =
  | 'demo-slides'
  | 'youtube'
  | 'uploaded-media'
  | 'text-notes';

export type TranscriptTag = 'diagram' | 'code' | 'formula' | 'definition';

export interface TranscriptSegment {
  id: string;
  startSec: number;
  endSec: number;
  speaker?: string;
  text: string;
  slideIndex?: number;
  tags?: TranscriptTag[];
}

export interface SlideFrame {
  index: number;
  startSec: number;
  title: string;
  subtitle: string;
  visualType:
    | 'attention-matrix'
    | 'raft-consensus'
    | 'bplus-tree'
    | 'generic-slide';
  highlights: string[];
  formulaLatex?: string;
}

export interface MermaidDiagram {
  id: string;
  title: string;
  timestampSec: number;
  description: string;
  mermaidCode: string;
}

export interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  timestampSec: number;
  code: string;
  explanation: string;
}

export interface MathVariable {
  symbol: string;
  meaning: string;
}

export interface MathFormula {
  id: string;
  title: string;
  timestampSec: number;
  latex: string;
  variables: MathVariable[];
  intuition: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
  timestampSec: number;
  hint?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  timestampSec: number;
  difficulty: 'Core' | 'Applied' | 'Deep';
}

export interface LectureWorkspace {
  id: string;
  title: string;
  courseCode: string;
  instructor: string;
  domain: string;
  durationSec: number;
  sourceType: LectureSourceType;
  youtubeId?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  createdAt: string;
  summary: string;
  keyTakeaways: string[];
  notesMarkdown: string;
  slides: SlideFrame[];
  transcript: TranscriptSegment[];
  diagrams: MermaidDiagram[];
  codeBlocks: CodeSnippet[];
  mathFormulas: MathFormula[];
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
}

export type ConfidenceRating = 'again' | 'hard' | 'good' | 'easy';

export interface FlashcardProgress {
  [cardId: string]: ConfidenceRating;
}
