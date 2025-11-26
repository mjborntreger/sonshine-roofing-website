"use client";

import React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  number: string;
  className?: string;
};

export default function CopyPhoneButton({ number, className }: Props) {
  const [copied, setCopied] = React.useState(false);

  async function copyNumber() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(number);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = number;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={copyNumber}
        className={cn(
          "btn btn-lg mb-2 rounded-xl btn-outline not-prose px-3 py-2 w-fit items-center justify-center",
          className
        )}
        title="Copy phone number"
        aria-label="Copy phone number"
        aria-pressed={copied}
      >
        {copied ? (
          <Check className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Copy className="h-5 w-5" aria-hidden="true" />
        )}
        <span className="sr-only">Copy phone number</span>
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Phone number copied" : ""}
      </span>
    </div>
  );
}
