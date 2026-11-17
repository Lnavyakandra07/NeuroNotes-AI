import React, { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';
import { Check, Code2, Copy, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface MermaidCanvasProps {
  code: string;
  title: string;
  isDark: boolean;
}

export const MermaidCanvas: React.FC<MermaidCanvasProps> = ({
  code,
  title,
  isDark,
}) => {
  const rawId = useId().replace(/:/g, '_');
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: isDark ? 'dark' : 'neutral',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
        });
        const uniqueId = `mmd_${rawId}_${isDark ? 'd' : 'l'}`;
        const { svg: rendered } = await mermaid.render(uniqueId, code.trim());
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Unable to parse Mermaid diagram syntax.'
          );
        }
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [code, isDark, rawId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
          {title}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {!showSource && (
            <>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
                aria-label="Zoom out diagram"
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.75, +(z + 0.15).toFixed(2)))}
                aria-label="Zoom in diagram"
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                aria-label="Reset diagram zoom"
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowSource((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showSource ? 'View Diagram' : 'Mermaid Source'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
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

      {showSource || error ? (
        <div className="p-4">
          {error && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
              Diagram preview fallback ({error})
            </p>
          )}
          <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      ) : (
        <div className="p-5 overflow-auto workspace-scroll bg-white dark:bg-slate-900 min-h-[220px] flex items-center justify-center">
          <div
            className="transition-transform duration-150 origin-center"
            style={{ transform: `scale(${zoom})` }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      )}
    </div>
  );
};
