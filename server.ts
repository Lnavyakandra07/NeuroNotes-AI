import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add it in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') {
        return parts[1] || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

const lectureExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Concise technical lecture title' },
    courseCode: {
      type: Type.STRING,
      description: 'Course code or subject tag such as CS 224N or SYS 401',
    },
    instructor: { type: Type.STRING, description: 'Instructor or speaker name' },
    domain: {
      type: Type.STRING,
      description: 'Academic domain such as Distributed Systems, Deep Learning, or Algorithms',
    },
    durationSec: {
      type: Type.INTEGER,
      description: 'Estimated or actual lecture duration in seconds (minimum 300)',
    },
    summary: {
      type: Type.STRING,
      description: '2-3 sentence executive technical summary of the lecture',
    },
    keyTakeaways: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '4 to 6 crisp, actionable engineering or academic takeaways',
    },
    notesMarkdown: {
      type: Type.STRING,
      description:
        'Well-structured Markdown notes with ## headings, bullet points, inline [MM:SS] timestamps matching the transcript, fenced ```language code blocks, and $$...$$ LaTeX math formulas.',
    },
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER },
          startSec: { type: Type.INTEGER },
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          highlights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          formulaLatex: { type: Type.STRING },
        },
        required: ['index', 'startSec', 'title', 'subtitle', 'highlights'],
      },
    },
    transcript: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          startSec: { type: Type.INTEGER },
          endSec: { type: Type.INTEGER },
          speaker: { type: Type.STRING },
          text: { type: Type.STRING },
          slideIndex: { type: Type.INTEGER },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['id', 'startSec', 'endSec', 'text'],
      },
    },
    diagrams: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          timestampSec: { type: Type.INTEGER },
          description: { type: Type.STRING },
          mermaidCode: {
            type: Type.STRING,
            description:
              'Valid Mermaid.js diagram code (e.g., flowchart TD, sequenceDiagram, stateDiagram-v2). Avoid unescaped quotes or parentheses inside node labels; wrap labels with special characters in double quotes like A["Step (1)"].',
          },
        },
        required: ['id', 'title', 'timestampSec', 'description', 'mermaidCode'],
      },
    },
    codeBlocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          language: { type: Type.STRING },
          timestampSec: { type: Type.INTEGER },
          code: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ['id', 'title', 'language', 'timestampSec', 'code', 'explanation'],
      },
    },
    mathFormulas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          timestampSec: { type: Type.INTEGER },
          latex: {
            type: Type.STRING,
            description: 'Clean LaTeX expression without surrounding $$ delimiters',
          },
          variables: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                symbol: { type: Type.STRING },
                meaning: { type: Type.STRING },
              },
              required: ['symbol', 'meaning'],
            },
          },
          intuition: { type: Type.STRING },
        },
        required: ['id', 'title', 'timestampSec', 'latex', 'variables', 'intuition'],
      },
    },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          front: { type: Type.STRING },
          back: { type: Type.STRING },
          topic: { type: Type.STRING },
          timestampSec: { type: Type.INTEGER },
          hint: { type: Type.STRING },
        },
        required: ['id', 'front', 'back', 'topic', 'timestampSec'],
      },
    },
    quizQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          correctIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
          timestampSec: { type: Type.INTEGER },
          difficulty: { type: Type.STRING },
        },
        required: [
          'id',
          'question',
          'options',
          'correctIndex',
          'explanation',
          'timestampSec',
          'difficulty',
        ],
      },
    },
  },
  required: [
    'title',
    'courseCode',
    'instructor',
    'domain',
    'durationSec',
    'summary',
    'keyTakeaways',
    'notesMarkdown',
    'slides',
    'transcript',
    'diagrams',
    'codeBlocks',
    'mathFormulas',
    'flashcards',
    'quizQuestions',
  ],
};

const EXTRACTION_SYSTEM_INSTRUCTION = `You are NeuroNotes AI, an expert multi-modal technical lecture intelligence engine for university CS, engineering, and STEM students.
Transform the provided lecture content (transcript, YouTube context, audio/video recording, or slide image/PDF) into a complete, accurate, timestamp-aligned study workspace.

Strict formatting requirements:
1. Transcript segments must have sequential startSec / endSec integers in seconds, and tags selected only from: "diagram", "code", "formula", "definition".
2. notesMarkdown must use clear ## section headings, concise technical explanations, clickable timestamps formatted exactly like [02:15] or [14:08], fenced code blocks (\`\`\`python ... \`\`\`), and LaTeX math ($$...$$ for display equations, $...$ for inline symbols).
3. Mermaid diagrams must use valid Mermaid v10+ syntax (flowchart TD, sequenceDiagram, or stateDiagram-v2). Always enclose node labels containing spaces, punctuation, or parentheses in double quotes, e.g. A["Input Embedding (X)"] --> B["Query Projection"]. Never use HTML tags or unescaped brackets inside labels.
4. Extract at least 2 Mermaid diagrams, 2 clean code blocks (or algorithmic pseudocode if conceptual), 2 LaTeX mathematical formulations with variable definitions, 5 active recall flashcards, and 4 multiple-choice quiz questions with 4 options each and difficulty set to "Core", "Applied", or "Deep".
5. Ensure all timestamps across notesMarkdown, diagrams, codeBlocks, mathFormulas, flashcards, and quizQuestions fall within 0..durationSec and align meaningfully with the transcript.`;

async function fetchYouTubeOEmbed(youtubeUrl: string): Promise<{
  title?: string;
  author_name?: string;
} | null> {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      youtubeUrl
    )}&format=json`;
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    return (await res.json()) as { title?: string; author_name?: string };
  } catch {
    return null;
  }
}

app.post('/api/lectures/ingest', upload.single('file'), async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { mode, youtubeUrl, rawText, customTitle, courseCode } = req.body as {
      mode?: string;
      youtubeUrl?: string;
      rawText?: string;
      customTitle?: string;
      courseCode?: string;
    };
    const file = req.file;

    let sourceType: 'youtube' | 'uploaded-media' | 'text-notes' = 'text-notes';
    let youtubeId: string | undefined;
    let gatheredContext = '';
    const contentParts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [];

    if (mode === 'youtube' && youtubeUrl) {
      sourceType = 'youtube';
      const id = extractYouTubeId(youtubeUrl);
      if (!id) {
        res.status(400).json({
          error: 'Please enter a valid YouTube lecture URL (youtube.com/watch?v=... or youtu.be/...).',
        });
        return;
      }
      youtubeId = id;
      const oembed = await fetchYouTubeOEmbed(youtubeUrl);

      // Step 1: Ground context on the YouTube URL using URL Context & Search
      const researchResponse = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analyze this technical YouTube lecture and produce a detailed, timestamped technical outline of its topics, concepts, equations, code snippets, and architecture diagrams.
URL: ${youtubeUrl}
Known Title: ${oembed?.title ?? customTitle ?? 'Unknown'}
Channel/Instructor: ${oembed?.author_name ?? 'Unknown'}
Additional user notes: ${rawText || 'None'}`,
        config: {
          tools: [{ urlContext: {} }, { googleSearch: {} }],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      gatheredContext = `Source: YouTube Video (${youtubeUrl})
Title: ${customTitle || oembed?.title || 'YouTube Lecture'}
Instructor/Channel: ${oembed?.author_name || 'Lecturer'}
Course Code Hint: ${courseCode || 'CS / Engineering'}

Extracted Technical Lecture Outline & Context:
${researchResponse.text || ''}

User Supplementary Context:
${rawText || 'None'}`;

      contentParts.push({ text: gatheredContext });
    } else if (file) {
      sourceType = 'uploaded-media';
      const base64Data = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'application/octet-stream';

      if (mimeType.startsWith('audio/')) {
        // Transcribe pre-recorded audio with gemini-3.5-transcribe first
        const transcribeResp = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: 'Transcribe this technical lecture accurately, preserving technical terminology, variable names, code syntax mentions, and mathematical terms.',
              },
            ],
          },
        });

        const rawTranscript = transcribeResp.text || '';
        contentParts.push({
          text: `Source: Uploaded Audio Lecture (${file.originalname})
Title Hint: ${customTitle || file.originalname}
Course Code Hint: ${courseCode || 'ENG 301'}
Supplementary Notes: ${rawText || 'None'}

Full Lecture Audio Transcription:
${rawTranscript}`,
        });
      } else {
        // Video, slide image, or PDF document
        contentParts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
        contentParts.push({
          text: `Source: Uploaded Lecture Media/Slide (${file.originalname}, ${mimeType})
Title Hint: ${customTitle || file.originalname}
Course Code Hint: ${courseCode || 'CS / Engineering'}
Supplementary Notes: ${rawText || 'Analyze the uploaded lecture recording, slide deck, or whiteboard diagram thoroughly and extract timestamped structured notes, Mermaid diagrams, code blocks, LaTeX math, flashcards, and quiz questions.'}`,
        });
      }
    } else if (rawText && rawText.trim().length > 15) {
      sourceType = 'text-notes';
      contentParts.push({
        text: `Source: Raw Lecture Transcript / Notes
Title Hint: ${customTitle || 'Technical Lecture Analysis'}
Course Code Hint: ${courseCode || 'CS 301'}

Content to Transform:
${rawText}`,
      });
    } else {
      res.status(400).json({
        error:
          'Please provide a YouTube URL, upload an audio/video/slide file, or paste at least a short lecture transcript or topic notes.',
      });
      return;
    }

    // Step 2: Structured Knowledge Extraction via gemini-4-hydrogen
    const extractionResponse = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts: contentParts },
      config: {
        systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: lectureExtractionSchema,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
      },
    });

    const jsonText = (extractionResponse.text || '').trim();
    if (!jsonText) {
      throw new Error('Model returned an empty structured response.');
    }

    const parsed = JSON.parse(jsonText);

    const workspace = {
      ...parsed,
      id: `lec_${Date.now()}`,
      sourceType,
      youtubeId,
      createdAt: new Date().toISOString(),
      slides: Array.isArray(parsed.slides)
        ? parsed.slides.map((s: Record<string, unknown>, idx: number) => ({
            ...s,
            index: typeof s.index === 'number' ? s.index : idx,
            visualType: 'generic-slide',
          }))
        : [],
    };

    res.json({ lecture: workspace });
  } catch (err: unknown) {
    console.error('Lecture ingest error:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to process lecture content.';
    const status = message.includes('GEMINI_API_KEY') ? 500 : 502;
    res.status(status).json({ error: message });
  }
});

app.post('/api/lectures/ask', async (req, res) => {
  try {
    const ai = getGeminiClient();
    const {
      lectureTitle,
      currentTimestampSec,
      summary,
      notesExcerpt,
      question,
    } = req.body as {
      lectureTitle?: string;
      currentTimestampSec?: number;
      summary?: string;
      notesExcerpt?: string;
      question?: string;
    };

    if (!question || !question.trim()) {
      res.status(400).json({ error: 'Question cannot be empty.' });
      return;
    }

    const mm = Math.floor((currentTimestampSec || 0) / 60)
      .toString()
      .padStart(2, '0');
    const ss = Math.floor((currentTimestampSec || 0) % 60)
      .toString()
      .padStart(2, '0');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Lecture: ${lectureTitle || 'Technical Lecture'}
Student's Current Video Timestamp: [${mm}:${ss}]
Lecture Summary: ${summary || ''}
Relevant Notes Context:
${(notesExcerpt || '').slice(0, 6000)}

Student Question:
${question}`,
      config: {
        systemInstruction:
          'You are a concise, deeply technical teaching assistant inside NeuroNotes AI. Answer the student question directly using clear prose, inline LaTeX ($...$) or display math ($$...$$) if helpful, and reference timestamps like [MM:SS] from the notes when relevant. Keep answers focused and under 220 words.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    res.json({ answer: response.text || 'No response generated.' });
  } catch (err: unknown) {
    console.error('Lecture Q&A error:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to answer question.';
    res.status(502).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NeuroNotes AI server running on http://localhost:${PORT}`);
  });
}

startServer();
