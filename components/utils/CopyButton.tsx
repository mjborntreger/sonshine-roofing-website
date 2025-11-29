"use client";

import React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  getStatusMessage,
  normalizeCopyContent,
  writeToClipboard,
} from "./copy-helpers";

type CopyButtonProps = {
  copyContent: string | number | null | undefined;
  className?: string;
  ariaLabel?: string;
  srLabel?: string;
  copiedSrText?: string;
  emptyContentSrText?: string;
  errorSrText?: string;
  copiedDurationMs?: number;
};

const DEFAULT_LABEL = "Copy to clipboard";
const DEFAULT_DURATION_MS = 1500;

export default function CopyButton({
  copyContent,
  className,
  ariaLabel,
  srLabel,
  copiedSrText,
  emptyContentSrText,
  errorSrText,
  copiedDurationMs = DEFAULT_DURATION_MS,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState("");
  const timeoutRef = React.useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    []
  );

  async function handleCopy() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const { content, hasContent } = normalizeCopyContent(copyContent);

    if (!hasContent) {
      setCopied(false);
      setStatusMessage(
        getStatusMessage({
          result: "empty",
          copiedSrText,
          emptyContentSrText,
          errorSrText,
        })
      );
      return;
    }

    try {
      const success = await writeToClipboard(content);
      setCopied(success);
      setStatusMessage(
        getStatusMessage({
          result: success ? "success" : "error",
          copiedSrText,
          emptyContentSrText,
          errorSrText,
        })
      );

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (success) {
        timeoutRef.current = globalThis.setTimeout(
          () => setCopied(false),
          copiedDurationMs
        );
      }
    } catch {
      setCopied(false);
      setStatusMessage(
        getStatusMessage({
          result: "error",
          copiedSrText,
          emptyContentSrText,
          errorSrText,
        })
      );
    }
  }

  const buttonLabel = ariaLabel || srLabel || DEFAULT_LABEL;
  const srCopyLabel = srLabel || ariaLabel || DEFAULT_LABEL;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "btn btn-lg btn-outline hover:bg-slate-100 px-3 py-2 w-fit items-center justify-center",
          className
        )}
        title={buttonLabel}
        aria-label={buttonLabel}
        aria-pressed={copied}
      >
        {copied ? (
          <Check className="h-5 w-5 text-emerald-600" aria-hidden="true" />
        ) : (
          <Copy className="h-5 w-5" aria-hidden="true" />
        )}
        <span className="sr-only">{srCopyLabel}</span>
      </button>
      <span aria-live="polite" className="sr-only">
        {statusMessage}
      </span>
    </div>
  );
}
