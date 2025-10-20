import type { ReactNode } from "react";

export function renderHighlight(text: string, highlight?: string | null): ReactNode {
  if (!highlight) return text;
  const match = highlight.trim();
  if (!match.length) return text;

  const index = text.indexOf(match);
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span className="text-[--brand-blue]">{match}</span>
      {text.slice(index + match.length)}
    </>
  );
}
