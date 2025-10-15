import type { CSSProperties } from "react";

export const lineClampStyle: CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const truncateText = (text?: string | null, max = 220): string | undefined => {
  if (!text) return undefined;
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  let output = trimmed;
  if (trimmed.length > max) {
    output = trimmed.slice(0, max).replace(/\s+\S*$/, "");
  }
  if (!output.endsWith("…")) output = `${output}…`;
  return output;
};
