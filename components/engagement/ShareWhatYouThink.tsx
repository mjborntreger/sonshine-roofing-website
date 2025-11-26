"use client";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Pencil, Share2 } from "lucide-react";
import type { Route } from "next";

type Props = {
  /** Path to your review page (relative to site root) */
  reviewPath?: Route;
  /** Lead-in text that appears before the URL when sharing */
  text?: string;
  /** Optional override for the URL to share (absolute). If omitted, uses SITE_URL + reviewPath. */
  urlOverride?: string;
};

export default function ShareWhatYouThink({
  reviewPath = "/reviews" as Route,
  text = "@SonShine Roofing — Sarasota’s trusted roofing pros.",
  urlOverride,
}: Props) {
  const [copied, setCopied] = React.useState(false);
  const FACEBOOK_LOGO_SRC = "https://next.sonshineroofing.com/wp-content/uploads/facebook-logo-for-reviews.webp";

  function getCanonicalWithUTM(override?: string | URL) {
    try {
      if (override) {
        const u = new URL(String(override));
        return `${u.origin}${u.pathname}?utm_source=SonShine+Roofing&utm_medium=website`;
      }
      if (typeof window !== "undefined" && window.location) {
        const { origin, pathname } = window.location;
        return `${origin}${pathname}?utm_source=SonShine+Roofing&utm_medium=website`;
      }
    } catch { }
    const fallback = (process.env.NEXT_PUBLIC_SITE_URL || "https://sonshineroofing.com").replace(/\/$/, "");
    return `${fallback}?utm_source=SonShine+Roofing&utm_medium=website`;
  }

  const router = useRouter();
  const shareUrl = getCanonicalWithUTM(urlOverride);

  // Web-intent links (desktop & mobile browsers)
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  function openPopup(url: string, name = "fbshare") {
    try {
      const w = 560;
      const h = 650;
      const left = Math.max((window.screen.width - w) / 2, 0);
      const top = Math.max((window.screen.height - h) / 2, 0);
      window.open(
        url,
        name,
        `noopener,noreferrer,width=${w},height=${h},left=${left},top=${top}`
      );
    } catch {
      openExternal(url);
    }
  }

  function openExternal(url: string) {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Fallback for strict browsers/environments
      window.location.href = url;
    }
  }

  async function copyUrlToClipboard() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Silently fail; we won't show a blocking alert per request
      setCopied(false);
    }
  }

  function goToReviews() {
    try {
      router.push(reviewPath);
    } catch {
      window.location.href = reviewPath;
    }
  }

  async function handleShareFacebook() {
    const canUseNativeShare =
      typeof navigator !== "undefined" && typeof navigator.share === "function";

    if (canUseNativeShare) {
      try {
        await navigator.share({
          title: "SonShine Roofing",
          text,
          url: shareUrl,
        });
        return;
      } catch {
        // If native share is dismissed or fails, fall back to Facebook popup
      }
    }

    openPopup(fb);
  }

  const facebookBtn = "btn btn-xs md:btn-md btn-press inline-flex items-center gap-2 text-white bg-[#1877F2] hover:bg-[#1c65d6]";
  const copyBtn = "btn btn-outline btn-xs md:btn-md btn-press inline-flex items-center gap-2 text-slate-800";
  const reviewBtn = "btn btn-ghost btn-xs md:btn-md btn-press inline-flex items-center gap-2 text-slate-700";

  return (
    <section className="mt-8 px-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-sm">
          <Image
            src={FACEBOOK_LOGO_SRC}
            alt="Facebook"
            width={28}
            height={28}
            loading="lazy"
            decoding="async"
            className="h-7 w-7 object-contain"
          />
        </span>
        <div className="space-y-0.5">
          <p 
            className="text-sm md:text-lg font-semibold text-slate-700"
            >
              Share what you think
              <Share2 className="h-3 w-3 md:h-4 md:w-4 inline ml-2" />
          </p>
          <p className="text-xs md:text-sm text-slate-600">Spread the word or drop a quick review.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleShareFacebook}
          className={facebookBtn}
          title="Share on Facebook or via native share"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <Image
              src={FACEBOOK_LOGO_SRC}
              alt="Facebook Logo"
              width={18}
              height={18}
              loading="lazy"
              decoding="async"
              className="h-4 w-4 object-contain"
            />
          </span>
          Share
        </button>

        <button
          type="button"
          onClick={copyUrlToClipboard}
          className={copyBtn}
          title="Copy URL to Clipboard"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Copied!" : "Copy URL"}
        </button>

        <button
          type="button"
          onClick={goToReviews}
          className={reviewBtn}
          title="Leave a Review"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Leave a review
        </button>

        <span
          aria-live="polite"
          className={`inline-flex items-center gap-1 text-xs font-semibold text-green-600 transition-opacity duration-300 ${copied ? "opacity-100" : "opacity-0"}`}
        >
          <Check className="h-3 w-3" aria-hidden="true" />
          Link copied
        </span>
      </div>
    </section>
  );
}
