"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Turnstile from "@/components/Turnstile";
import SmartLink from "@/components/SmartLink";
import { sanitizePhoneInput, isUsPhoneComplete, normalizePhoneForSubmit, formatPhoneExample } from "@/lib/phone";

function TellUsWhyForm() {
  const qs = useSearchParams();
  const ratingParam = qs.get("rating");
  const rating = ratingParam && ["1", "2", "3"].includes(ratingParam) ? ratingParam : "3"; // default to 3 if missing

  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();

  useEffect(() => {
    if (status !== "ok") return;

    setCountdown(3);
    const tick = setInterval(() =>
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0)),
    1000);
    const redirectTimer = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => {
      clearInterval(tick);
      clearTimeout(redirectTimer);
    };
  }, [status, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErr(null);

    const fd = new FormData(e.currentTarget);

    const first = String(fd.get("firstName") || "").trim();
    const last = String(fd.get("lastName") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const message = String(fd.get("message") || "").trim();

    const cfToken = String(fd.get("cfToken") || ""); // provided by <Turnstile />
    const hp_field = String(fd.get("company") || ""); // honeypot

    const phoneDigits = sanitizePhoneInput(phone);
    if (!isUsPhoneComplete(phoneDigits)) {
      setStatus("err");
      setErr("Enter a valid US phone number (10 digits).");
      return;
    }
    const normalizedPhone = normalizePhoneForSubmit(phoneDigits);
    if (!normalizedPhone) {
      setStatus("err");
      setErr("Enter a valid US phone number (10 digits).");
      return;
    }

    const payload: Record<string, unknown> = {
      type: "feedback",
      firstName: first,
      lastName: last,
      email,
      phone: normalizedPhone,
      rating: Number(rating),
      message,
      cfToken,
      hp_field,
      page: "/tell-us-why",
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
      tz: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
    };

    const utmSource = qs.get("utm_source");
    const utmMedium = qs.get("utm_medium");
    const utmCampaign = qs.get("utm_campaign");
    if (utmSource) payload.utm_source = utmSource.trim();
    if (utmMedium) payload.utm_medium = utmMedium.trim();
    if (utmCampaign) payload.utm_campaign = utmCampaign.trim();

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: { ok?: boolean; error?: string } | null = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setStatus("ok");
        // GTM event
        try {
          type DataLayerWindow = Window & { dataLayer?: Array<Record<string, unknown>> };
          const dlWindow = window as DataLayerWindow;
          dlWindow.dataLayer = dlWindow.dataLayer || [];
          dlWindow.dataLayer.push({
            event: "feedback_submitted",
            rating,
            page: "/tell-us-why",
          });
        } catch {}
      } else {
        setStatus("err");
        setErr(json?.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("err");
      setErr("Network error. Please try again.");
    }
  }

  if (status === "ok") {
    return (
      <main className="container-edge mx-auto max-w-2xl py-10">
        <h1 className="text-3xl font-semibold">Thanks for telling us.</h1>
        <p className="mt-2 text-slate-700">
          We read every note and will reach out if we need more details. Since 1987 we’ve got you covered.
        </p>
        <p className="mt-4 text-slate-700">Redirecting in {countdown}…</p>
        <SmartLink href="/" className="mt-2 inline-block text-[--brand-blue]">
          If you are not redirected automatically, click here.
        </SmartLink>
      </main>
    );
  }

  return (
    <main className="container-edge mx-auto max-w-2xl py-10">
      <h1 className="text-3xl font-semibold">Tell us what went wrong</h1>
      <p className="mt-2 text-slate-700">
        Your honest feedback helps us fix issues fast and do right by you.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
        {/* Honeypot field (hidden from humans) */}
        <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm">First name*</span>
            <input
              name="firstName"
              required
              autoComplete="given-name"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[--brand-cyan]"
            />
          </label>
          <label className="block">
            <span className="text-sm">Last name*</span>
            <input
              name="lastName"
              required
              autoComplete="family-name"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[--brand-cyan]"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm">Email address*</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[--brand-cyan]"
          />
        </label>

        <label className="block">
          <span className="text-sm">Phone number*</span>
          <input
            type="tel"
            name="phone"
            required
            autoComplete="tel"
            inputMode="tel"
            aria-describedby="phone-hint"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[--brand-cyan]"
          />
          <p id="phone-hint" className="mt-1 text-xs text-slate-500">
            Digits only, US numbers. Example: {formatPhoneExample()}
          </p>
        </label>

        <label className="block">
          <span className="text-sm">Message*</span>
          <textarea
            name="message"
            rows={6}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[--brand-cyan]"
          />
        </label>

        {/* Hidden rating (from query param) */}
        <input type="hidden" name="rating" value={rating} readOnly />

        {/* Turnstile widget injects cfToken hidden input too */}
        <Turnstile className="pt-1" />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={status === "sending"}
            className="btn btn-brand-orange btn-md"
          >
            {status === "sending" ? "Sending…" : "Send feedback"}
          </button>
          {status === "err" && (
            <p className="text-sm text-red-600">{err}</p>
          )}
        </div>
      </form>
    </main>
  );
}

export default function TellUsWhyPage() {
  return (
    <Suspense
      fallback={
        <main className="container-edge mx-auto max-w-2xl py-10">
          <h1 className="text-3xl font-semibold">Tell us what went wrong</h1>
          <p className="mt-2 text-slate-700">Loading…</p>
        </main>
      }
    >
      <TellUsWhyForm />
    </Suspense>
  );
}
