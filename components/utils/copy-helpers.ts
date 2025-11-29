export const DEFAULT_COPIED_MESSAGE = "Copied to clipboard";
export const DEFAULT_EMPTY_MESSAGE = "Nothing to copy";
export const DEFAULT_ERROR_MESSAGE = "Unable to copy content right now";

export async function writeToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const result = document.execCommand("copy");
  document.body.removeChild(textarea);

  return result;
}

export function normalizeCopyContent(copyContent: string | number | null | undefined) {
  if (typeof copyContent === "string" || typeof copyContent === "number") {
    const content = String(copyContent);
    return { content, hasContent: content.trim().length > 0 };
  }

  return { content: "", hasContent: false };
}

export function getStatusMessage({
  result,
  copiedSrText,
  emptyContentSrText,
  errorSrText,
}: {
  result: "empty" | "success" | "error";
  copiedSrText?: string;
  emptyContentSrText?: string;
  errorSrText?: string;
}) {
  if (result === "empty") {
    return emptyContentSrText ?? DEFAULT_EMPTY_MESSAGE;
  }

  if (result === "success") {
    return copiedSrText ?? DEFAULT_COPIED_MESSAGE;
  }

  return errorSrText ?? DEFAULT_ERROR_MESSAGE;
}
