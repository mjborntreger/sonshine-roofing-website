"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Share2, Copy, Check } from "lucide-react";
import type { Route } from "next";

type Props = {
  /** Path to your review page (relative to site root) */
  reviewPath?: Route;
  /** Lead-in text that appears before the URL when sharing */
  text?: string;
  /** Optional override for the URL to share (absolute). If omitted, uses SITE_URL + reviewPath. */
  urlOverride?: string;
};

function getSiteOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://sonshineroofing.com";
}

export default function ShareWhatYouThink({
  reviewPath = "/reviews" as Route,
  text = "@SonShine Roofing — Sarasota’s trusted roofing pros.",
  urlOverride,
}: Props) {
  const [copied, setCopied] = React.useState(false);
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
  const caption = `${text} ${shareUrl}`;
  const facebookAppId = process.env.NEXT_PUBLIC_FB_APP_ID;
  const origin = getSiteOrigin();
  const redirect = `${origin}/share`;

  // Web-intent links (desktop & mobile browsers)
  const fb = facebookAppId
    ? `https://www.facebook.com/dialog/share?app_id=${encodeURIComponent(
      facebookAppId
    )}&href=${encodeURIComponent(shareUrl)}&display=popup&hashtag=%23SonShineRoofing&quote=${encodeURIComponent(
      text || ""
    )}&redirect_uri=${encodeURIComponent(redirect)}`
    : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const x = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
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

  const instagramProfile = "https://instagram.com/sonshineroofing";
  const nextdoorProfile = "https://nextdoor.com/pages/sonshine-roofing-sarasota-fl";

  function openExternal(url: string) {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Fallback for strict browsers/environments
      window.location.href = url;
    }
  }

  async function shareNative(fallbackUrl?: string) {
    try {
      if (navigator.share) {
        await navigator.share({ title: "SonShine Roofing", text: caption, url: shareUrl });
        return;
      }
    } catch {
      // continue to fallback below
    }
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // silently fail; if clipboard write is blocked we still open the fallback
    }
    if (fallbackUrl) openExternal(fallbackUrl);
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

  const btn = "btn btn-outline btn-sm btn-press inline-flex items-center gap-2";
  const orange = "text-white bg-[#fb9216] btn btn-outline btn-sm btn-press inline-flex items-center gap-2 hover:bg-[#fb9216]"
  const facebook_blue = "text-white bg-[#385898] btn btn-outline btn-sm btn-press inline-flex items-center gap-2 hover:bg-[#385898]"
  const x_black = "text-white bg-black btn btn-outline btn-sm btn-press inline-flex items-center gap-2 hover:bg-black"
  const instagram_gradient = "text-white bg-[#dd2a7b] btn btn-outline btn-sm btn-press inline-flex items-center gap-2 hover:bg-[#dd2a7b]"
  const nextdoor_green = "text-white bg-[#479261] btn btn-outline btn-sm btn-press inline-flex items-center gap-2 hover:bg-[#479261]"

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Leave a Review (no icon) */}
        <button type="button" onClick={goToReviews} className={orange} title="Leave a Review">
          Leave a Review
        </button>

        {/* Facebook share */}
        <button
          type="button"
          onClick={() => openPopup(fb)}
          className={facebook_blue}
          title="Share on Facebook"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share on Facebook
        </button>

        {/* X share */}
        <button type="button" onClick={() => openExternal(x)} className={x_black} title="Share on X">
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share on X
        </button>

        {/* Instagram: native share or copy + open profile */}
        <button
          type="button"
          onClick={() => shareNative(instagramProfile)}
          className={instagram_gradient}
          title="Share on Instagram (copy caption)"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share on Instagram
        </button>

        {/* Nextdoor: native share or copy + open profile */}
        <button
          type="button"
          onClick={() => shareNative(nextdoorProfile)}
          className={nextdoor_green}
          title="Share on Nextdoor (copy caption)"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share on Nextdoor
        </button>

        {/* Utility: copy URL only */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={copyUrlToClipboard} className={btn} title="Copy URL to Clipboard">
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy URL to Clipboard
          </button>
          <span
            aria-live="polite"
            className={`inline-flex items-center gap-1 text-sm font-semibold text-green-600 transition-opacity duration-300 ${copied ? "opacity-100" : "opacity-0"}`}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Copied!
          </span>
        </div>
      </div>
    </div>
  );
}
