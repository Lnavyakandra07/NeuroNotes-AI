# NeuroNotes AI

Automated Multi-Modal Lecture Transcription, Visual Alignment, and Interactive Knowledge Extraction Platform.

## Features
- **Synchronized Split-Screen Workspace**: Adaptive video, audio, YouTube, and slide-synced lecture player paired with a searchable timestamped transcript.
- **Structured Markdown Notes**: Clickable `[MM:SS]` timestamp jump buttons that seek the active lecture directly to the relevant explanation.
- **Visual Architecture Diagrams**: Auto-generated Mermaid.js flowcharts, state machines, and sequence diagrams with zoom controls and source inspection.
- **Code & LaTeX Math Vault**: Extracted syntax-formatted code blocks and KaTeX-rendered mathematical formulations with variable breakdowns.
- **Active Recall Studio**: Interactive 3D flip flashcards with spaced-repetition confidence ratings and conceptual multiple-choice quizzes.
- **Timestamp-Anchored Q&A**: Ask clarifying questions anchored to the current playback timestamp.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Mermaid.js, KaTeX, Lucide React
- **Backend**: Express, Multer, `@google/genai` (`gemini-4-hydrogen`, `gemini-3.5-transcribe`)

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (copy `.env.example` to `.env`):
   ```bash
   cp .env.example .env
   ```
   Set `GEMINI_API_KEY` in `.env`.
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   npm start
   ```
