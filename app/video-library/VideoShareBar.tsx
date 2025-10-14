"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Props = {
  collectionUrl: string;
};

export default function VideoShareBar({ collectionUrl }: Props) {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const slug = (searchParams?.get("v") ?? "").trim();

  useEffect(() => {
    if (!slug) setCopied(false);
  }, [slug]);

  if (!slug) return null;

  const shareUrl = `${collectionUrl}?v=${encodeURIComponent(slug)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        // If copy fails, leave copied state as-is.
      }
    }
  };

  return (
    <div className="mb-6 rounded-md border border-slate-300 bg-white p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="video-share-url" className="text-sm font-medium text-slate-700">Share this video</label>
        <div className="flex w-full items-center gap-2">
          <input
            id="video-share-url"
            readOnly
            value={shareUrl}
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
          />
          <button
            id="video-share-copy"
            type="button"
            onClick={handleCopy}
            className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-2 text-sm transition hover:bg-slate-50"
          >
            Copy link
          </button>
          <span
            id="video-share-copied"
            className={`text-xs font-medium text-green-700 ${copied ? "" : "hidden"}`}
          >
            Copied!
          </span>
        </div>
      </div>
    </div>
  );
}
