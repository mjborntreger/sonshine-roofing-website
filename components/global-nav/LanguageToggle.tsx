"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Languages } from "lucide-react";
import SmartLink from "@/components/utils/SmartLink";
import { DEFAULT_LOCALE, swapLocaleInPath, type Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

const COPY = {
  en: { label: "ES", aria: "Ver sitio en Español" },
  es: { label: "EN", aria: "View site in English" },
} satisfies Record<Locale, { label: string; aria: string }>;

type LanguageToggleProps = {
  locale: Locale;
  variant?: "desktop" | "mobile" | "footer";
  onNavigate?: () => void;
  className?: string;
};

function useLocaleSwitchHref(targetLocale: Locale) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useMemo(() => {
    const basePath = pathname || "/";
    const nextPath = swapLocaleInPath(basePath, targetLocale);
    const qs = searchParams?.toString();
    return qs ? `${nextPath}?${qs}` : nextPath;
  }, [pathname, searchParams, targetLocale]);
}

export function LanguageToggle({
  locale,
  variant = "desktop",
  onNavigate,
  className,
}: LanguageToggleProps) {
  const activeLocale = locale ?? DEFAULT_LOCALE;
  const targetLocale: Locale = activeLocale === "en" ? "es" : DEFAULT_LOCALE;
  const href = useLocaleSwitchHref(targetLocale);
  const copy = COPY[activeLocale] ?? COPY.en;

  const variantClass =
    variant === "mobile"
      ? "flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2 text-slate-800 hover:bg-slate-200 border border-blue-100"
      : variant === "footer"
        ? "inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-500"
        : "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-slate-700 bg-white/80 hover:bg-white shadow-sm";

  return (
    <SmartLink
      href={href}
      className={cn(variantClass, className)}
      aria-label={copy.aria}
      onClick={onNavigate}
      prefetch={false}
    >
      <Languages className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
      <span className="whitespace-nowrap">{copy.label}</span>
    </SmartLink>
  );
}
