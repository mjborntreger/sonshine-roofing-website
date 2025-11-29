"use client";
import { useRouter } from "next/navigation";
import { Pencil, Share } from "lucide-react";
import type { Route } from "next";
import CopyButton from "../utils/CopyButton";

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

  const shareBtn = "btn btn-lg inline-flex items-center gap-2 text-white bg-[--brand-blue]";
  const reviewBtn = "btn btn-ghost btn-md md:btn-lg inline-flex items-center gap-2 text-slate-700";

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-row gap-3">
          <button
            type="button"
            onClick={handleShareFacebook}
            className={shareBtn}
            title="Share on Facebook or via native share"
          >
            <Share className="inline-flex h-5 w-5 items-center justify-center" />
            Share
          </button>

          <CopyButton
            copyContent={shareUrl}
            ariaLabel="Copy share link"
            srLabel="Copy share link"
            copiedSrText="Share link copied"
            emptyContentSrText="No share link available to copy"
            copiedDurationMs={1600}
          />
        </div>


        <button
          type="button"
          onClick={goToReviews}
          className={reviewBtn}
          title="Leave a Review"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Leave a review
        </button>
      </div>
    </section>
  );
}
