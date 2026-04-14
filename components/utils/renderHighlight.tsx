import type { ReactNode } from "react";

const DEFAULT_HIGHLIGHT_CLASS_NAME = "text-[--brand-blue]";

export function renderHighlight(
  text: string,
  highlight?: string | readonly string[] | null,
  highlightClassName: string = DEFAULT_HIGHLIGHT_CLASS_NAME
): ReactNode {
  if (!highlight) return text;

  const matches = (Array.isArray(highlight) ? highlight : [highlight])
    .map((value) => value.trim())
    .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index)
    .map((value) => ({ value, index: text.indexOf(value) }))
    .filter(({ index }) => index !== -1)
    .sort((left, right) => left.index - right.index);

  if (!matches.length) return text;

  const segments: ReactNode[] = [];
  let cursor = 0;

  matches.forEach(({ value, index }) => {
    if (index < cursor) return;

    if (index > cursor) {
      segments.push(text.slice(cursor, index));
    }

    segments.push(
      <span key={`${value}-${index}`} className={highlightClassName}>
        {value}
      </span>
    );
    cursor = index + value.length;
  });

  if (cursor < text.length) {
    segments.push(text.slice(cursor));
  }

  return <>{segments}</>;
}
