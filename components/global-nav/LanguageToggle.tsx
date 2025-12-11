"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import SmartLink from "@/components/utils/SmartLink";
import { DEFAULT_LOCALE, swapLocaleInPath, type Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";



const COPY = {
  en: { label: "Español", aria: "Ver sitio en Español" },
  es: { label: "English", aria: "View site in English" },
} satisfies Record<Locale, { label: string; aria: string }>;

type LanguageToggleProps = {
  locale?: Locale;
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
  className,
}: LanguageToggleProps) {
  const contextLocale = useLocale();
  const activeLocale = contextLocale ?? locale ?? DEFAULT_LOCALE;
  const targetLocale: Locale = activeLocale === "en" ? "es" : DEFAULT_LOCALE;
  const href = useLocaleSwitchHref(targetLocale);
  const copy = COPY[activeLocale] ?? COPY.en;

  return (
    <SmartLink
      href={href}
      className={cn(
        "inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-600 transition-colors",
        className
      )}
      aria-label={copy.aria}
      prefetch={false}
    >
      <span className="whitespace-nowrap">{copy.label}</span>
    </SmartLink>
  );
}
