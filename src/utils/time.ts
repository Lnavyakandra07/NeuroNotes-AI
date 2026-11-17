export function formatTimestamp(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
}

export function parseTimestampToSeconds(label: string): number {
  const cleaned = label.replace(/[\[\]]/g, '').trim();
  const parts = cleaned.split(':').map((n) => parseInt(n, 10));
  if (parts.some((p) => Number.isNaN(p))) return 0;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export function exportLectureAsMarkdown(
  title: string,
  courseCode: string,
  instructor: string,
  summary: string,
  notesMarkdown: string,
  diagrams: Array<{ title: string; mermaidCode: string }>,
  mathFormulas: Array<{ title: string; latex: string }>
): string {
  const diagramSection = diagrams
    .map((d) => `### ${d.title}\n\n\`\`\`mermaid\n${d.mermaidCode}\n\`\`\``)
    .join('\n\n');

  const mathSection = mathFormulas
    .map((m) => `### ${m.title}\n\n$$\n${m.latex}\n$$`)
    .join('\n\n');

  return `# ${title}
**Course:** ${courseCode} · **Instructor:** ${instructor}

## Executive Summary
${summary}

---

${notesMarkdown}

---

## Visual Architecture Diagrams

${diagramSection}

---

## Key Mathematical Formulations

${mathSection}
`;
}
