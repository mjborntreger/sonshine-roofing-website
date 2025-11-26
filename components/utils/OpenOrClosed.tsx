'use client';

import { useEffect, useMemo, useState } from 'react';

type Interval = { open: string; close: string }; // 24h "HH:mm"
type WeeklyHours = Record<number, Interval[]>; // 0 = Sunday ... 6 = Saturday

type OpenOrClosedProps = {
  /**
   * Weekly schedule, keyed by weekday number (0 = Sunday ... 6 = Saturday).
   * Times are 24h "HH:mm" strings in the given timeZone.
   */
  hours?: WeeklyHours;
  /**
   * IANA time zone for business location. Sarasota uses America/New_York.
   */
  timeZone?: string;
  /**
   * Optional wrapper className.
   */
  className?: string;
};

/**
 * Default business hours for SonShine Roofing:
 * Mon–Fri 07:00–17:30, closed Sat–Sun.
 */
const DEFAULT_HOURS: WeeklyHours = {
  0: [], // Sun
  1: [{ open: '07:00', close: '17:30' }],
  2: [{ open: '07:00', close: '17:30' }],
  3: [{ open: '07:00', close: '17:30' }],
  4: [{ open: '07:00', close: '17:30' }],
  5: [{ open: '07:00', close: '17:30' }],
  6: [], // Sat
};

const DEFAULT_TZ = 'America/New_York';

function zonedNow(tz: string) {
  // Convert "now" into a Date object reflecting the target timezone.
  return new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return h * 60 + (m || 0);
}

function formatTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
  }).format(d);
}

function withTime(d: Date, tz: string, hhmm: string) {
  // Build a Date corresponding to the same calendar day as `d` in tz,
  // but at the provided HH:mm time (tz-local).
  const base = new Date(d.toLocaleString('en-US', { timeZone: tz }));
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  base.setHours(h, m || 0, 0, 0);
  return base;
}

type Status =
  | { kind: 'open'; closesAt: Date }
  | { kind: 'closed'; nextOpensAt: Date | null };

function computeStatus(now: Date, tz: string, hours: WeeklyHours): Status {
  const day = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  // 1) Check today's intervals
  const todays = hours[day] || [];
  for (const itv of todays) {
    const start = toMinutes(itv.open);
    const end = toMinutes(itv.close);
    if (minutesNow >= start && minutesNow < end) {
      return { kind: 'open', closesAt: withTime(now, tz, itv.close) };
    }
    if (minutesNow < start) {
      // still closed but opens later today
      return { kind: 'closed', nextOpensAt: withTime(now, tz, itv.open) };
    }
  }

  // 2) Find next opening within the next 7 days
  for (let i = 1; i <= 7; i++) {
    const future = new Date(now);
    future.setDate(now.getDate() + i);
    const wd = future.getDay();
    const list = hours[wd] || [];
    if (list.length > 0) {
      return { kind: 'closed', nextOpensAt: withTime(future, tz, list[0].open) };
    }
  }

  return { kind: 'closed', nextOpensAt: null }; // no hours configured
}

export default function OpenOrClosed({
  hours = DEFAULT_HOURS,
  timeZone = DEFAULT_TZ,
  className = '',
}: OpenOrClosedProps) {
  const [now, setNow] = useState<Date | null>(null);

  // Tick every 60s to keep the status fresh.
  useEffect(() => {
    setNow(zonedNow(timeZone));
    const id = setInterval(() => setNow(zonedNow(timeZone)), 60_000);
    return () => clearInterval(id);
  }, [timeZone]);

  const status: Status | null = useMemo(() => {
    if (!now) return null;
    return computeStatus(now, timeZone, hours);
  }, [now, timeZone, hours]);

  const baseStyles =
    'inline-flex items-center gap-2 rounded-xl border px-2.5 py-1 font-medium';
  const openStyles =
    'border-green-200 bg-green-50 text-green-700';
  const closedStyles =
    'border-red-200 bg-red-50 text-red-700';

  if (!status) {
    return (
      <div
        className={`flex flex-wrap items-center gap-3 ${className}`}
        aria-live="polite"
      >
        <span
          className={`${baseStyles} border-slate-200 bg-slate-50 text-slate-600`}
        >
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          Checking hours…
        </span>
      </div>
    );
  }

  if (status.kind === 'open') {
    const closes = formatTime(status.closesAt, timeZone);
    return (
      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}
        aria-live="polite"
      >
        <span
          className={`${baseStyles} ${openStyles}`}
          aria-label={`Open now, closes at ${closes}. We are in the office and ready to take your call.`}
        >
          <span className="h-2 w-2 rounded-full bg-green-500 open-or-closed__dot" />
          <span>Open now</span>
          <span className="text-green-600/70">·</span>
          <span className="text-green-700/80">until {closes}</span>
        </span>
        <span className="text-sm md:text-base text-slate-700/90">
          We are in the office and ready to take your call
        </span>
        <style jsx>{`
          @keyframes open-or-closed-blink {
            0%, 55% {
              opacity: 1;
            }
            65%, 100% {
              opacity: 0.2;
            }
          }

          .open-or-closed__dot {
            animation: open-or-closed-blink 1.8s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  const next = status.nextOpensAt;
  const nextText = next
    ? `Opens ${new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone,
      }).format(next)}`
    : 'Closed';

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}
      aria-live="polite"
    >
      <span
        className={`${baseStyles} ${closedStyles}`}
        aria-label={`Closed now. ${next ? nextText + '. ' : ''}Fill out the form below and we will get back to you ASAP.`}
      >
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span>Closed</span>
        {next && (
          <>
            <span className="text-red-600/70">·</span>
            <span className="text-red-700/80">{nextText}</span>
          </>
        )}
      </span>
      <span className="text-sm md:text-base text-slate-700/90">
        Fill out the form below and we will get back to you ASAP
      </span>
    </div>
  );
}
