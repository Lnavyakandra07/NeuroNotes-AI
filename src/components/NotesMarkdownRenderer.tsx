import React, { useState } from 'react';
import { Check, Copy, Play } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { parseTimestampToSeconds } from '../utils/time';

interface NotesMarkdownRendererProps {
  markdown: string;
  onSeek: (seconds: number) => void;
  searchQuery?: string;
}

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'math'; latex: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'paragraph'; text: string };

function parseMarkdownBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: 'code', language, code: codeLines.join('\n') });
      continue;
    }

    // Display math block $$...$$
    if (trimmed.startsWith('$$')) {
      if (trimmed.endsWith('$$') && trimmed.length > 4) {
        blocks.push({ type: 'math', latex: trimmed.slice(2, -2).trim() });
        i++;
        continue;
      }
      const mathLines: string[] = [trimmed.slice(2)];
      i++;
      while (i < lines.length && !lines[i].trim().endsWith('$$')) {
        mathLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        mathLines.push(lines[i].trim().slice(0, -2));
        i++;
      }
      blocks.push({ type: 'math', latex: mathLines.join('\n').trim() });
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: trimmed.slice(4) });
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: trimmed.slice(3) });
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, text: trimmed.slice(2) });
      i++;
      continue;
    }

    // Bullet or numbered list
    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const ordered = /^\d+\.\s+/.test(trimmed);
      const items: string[] = [];
      while (i < lines.length) {
        const current = lines[i].trim();
        if (ordered && /^\d+\.\s+/.test(current)) {
          items.push(current.replace(/^\d+\.\s+/, ''));
          i++;
        } else if (!ordered && /^[-*]\s+/.test(current)) {
          items.push(current.replace(/^[-*]\s+/, ''));
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    // Paragraph
    const paraLines: string[] = [trimmed];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('$$') &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  return blocks;
}

const InlineTokens: React.FC<{
  text: string;
  onSeek: (sec: number) => void;
  searchQuery?: string;
}> = ({ text, onSeek, searchQuery }) => {
  // Tokenize [MM:SS] timestamps, $inline math$, `inline code`, **bold**
  const tokenRegex =
    /(\[\d{1,2}:\d{2}(?::\d{2})?\]|\$[^$\n]+?\$|`[^`\n]+?`|\*\*[^*\n]+?\*\*)/g;
  const parts = text.split(tokenRegex);

  const renderHighlightedText = (str: string, keyPrefix: string) => {
    if (!searchQuery || !searchQuery.trim()) return str;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const chunks = str.split(regex);
    return chunks.map((chunk, idx) =>
      regex.test(chunk) ? (
        <mark
          key={`${keyPrefix}_${idx}`}
          className="bg-amber-200/80 dark:bg-amber-500/30 text-slate-900 dark:text-amber-100 rounded px-0.5"
        >
          {chunk}
        </mark>
      ) : (
        <React.Fragment key={`${keyPrefix}_${idx}`}>{chunk}</React.Fragment>
      )
    );
  };

  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;

        // Clickable timestamp [MM:SS]
        if (/^\[\d{1,2}:\d{2}(?::\d{2})?\]$/.test(part)) {
          const secs = parseTimestampToSeconds(part);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSeek(secs)}
              title={`Jump lecture to ${part}`}
              className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 font-mono text-[11px] font-medium tabular-nums hover:bg-blue-100 dark:hover:bg-blue-900/70 transition-colors align-baseline"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>{part.slice(1, -1)}</span>
            </button>
          );
        }

        // Inline LaTeX $...$
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          return (
            <MathRenderer
              key={idx}
              latex={part.slice(1, -1)}
              className="mx-0.5 text-slate-900 dark:text-slate-100"
            />
          );
        }

        // Inline code `...`
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={idx}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[0.84em]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        // Bold **...**
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
              {renderHighlightedText(part.slice(2, -2), `b_${idx}`)}
            </strong>
          );
        }

        return (
          <React.Fragment key={idx}>
            {renderHighlightedText(part, `t_${idx}`)}
          </React.Fragment>
        );
      })}
    </>
  );
};

const InlineCodeBlock: React.FC<{ language: string; code: string }> = ({
  language,
  code,
}) => {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <div className="my-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-slate-900/90">
        <span className="text-xs font-mono text-slate-400">{language}</span>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
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
      <pre className="p-4 text-xs sm:text-[13px] font-mono text-slate-100 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const NotesMarkdownRenderer: React.FC<NotesMarkdownRendererProps> = ({
  markdown,
  onSeek,
  searchQuery,
}) => {
  const blocks = parseMarkdownBlocks(markdown);

  return (
    <div className="space-y-4 text-[15px] leading-[1.7] text-slate-700 dark:text-slate-300">
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          if (block.level === 1) {
            return (
              <h2
                key={idx}
                className="text-xl font-bold text-slate-900 dark:text-white pt-2"
              >
                <InlineTokens text={block.text} onSeek={onSeek} searchQuery={searchQuery} />
              </h2>
            );
          }
          if (block.level === 2) {
            return (
              <h3
                key={idx}
                className="text-lg font-semibold text-slate-900 dark:text-white pt-3 pb-1 border-b border-slate-200/80 dark:border-slate-800"
              >
                <InlineTokens text={block.text} onSeek={onSeek} searchQuery={searchQuery} />
              </h3>
            );
          }
          return (
            <h4
              key={idx}
              className="text-base font-semibold text-slate-900 dark:text-slate-100 pt-2"
            >
              <InlineTokens text={block.text} onSeek={onSeek} searchQuery={searchQuery} />
            </h4>
          );
        }

        if (block.type === 'code') {
          return (
            <InlineCodeBlock key={idx} language={block.language} code={block.code} />
          );
        }

        if (block.type === 'math') {
          return (
            <div
              key={idx}
              className="my-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 overflow-x-auto text-center text-slate-900 dark:text-slate-100"
            >
              <MathRenderer latex={block.latex} displayMode />
            </div>
          );
        }

        if (block.type === 'list') {
          const Tag = block.ordered ? 'ol' : 'ul';
          return (
            <Tag
              key={idx}
              className={`space-y-2 pl-5 ${
                block.ordered ? 'list-decimal' : 'list-disc'
              } marker:text-slate-400 dark:marker:text-slate-500`}
            >
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="pl-1">
                  <InlineTokens
                    text={item}
                    onSeek={onSeek}
                    searchQuery={searchQuery}
                  />
                </li>
              ))}
            </Tag>
          );
        }

        return (
          <p key={idx} className="max-w-[72ch]">
            <InlineTokens
              text={block.text}
              onSeek={onSeek}
              searchQuery={searchQuery}
            />
          </p>
        );
      })}
    </div>
  );
};
