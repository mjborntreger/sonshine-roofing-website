"use client";

import SmartLink from "@/components/utils/SmartLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { openQuickQuoteSlideout } from "@/lib/quickquote";
import type { Locale } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Zap } from "lucide-react";
import { useCallback, type MouseEvent } from "react";

export const INSTANT_QUOTE_CTA = {
  href: "https://www.myquickroofquote.com/contractors/sonshine-roofing",
  buttonClassName: "bg-neutral-900/60 text-white font-display py-6 md:py-3 items-center text-2xl md:text-xl backdrop-blur hover:bg-neutral-900/90",
  linkClassName: "flex items-center gap-2",
  iconClassName: "h-4 w-4 text-[--brand-orange]",
} as const;

const COPY = {
  en: { label: "Instant Quote" },
  es: { label: "Cotización" },
} satisfies Record<Locale, { label: string }>;

type InstantQuoteCTAProps = {
  buttonClassName?: string;
  linkClassName?: string;
  iconClassName?: string;
  size?: "default" | "sm" | "lg" | "xl" | "icon";
  onClick?: () => void;
  locale?: Locale;
};

export function InstantQuoteCTA({
  buttonClassName,
  linkClassName,
  iconClassName,
  size = "sm",
  onClick,
  locale,
}: InstantQuoteCTAProps) {
  const contextLocale = useLocale();
  const activeLocale = locale ?? contextLocale ?? "en";
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      const opened = openQuickQuoteSlideout();
      if (opened) {
        event.preventDefault();
      }
      onClick?.();
    },
    [onClick]
  );

  const label = COPY[activeLocale]?.label ?? COPY.en.label;

  return (
    <Button
      asChild
      size={size}
      variant="outline"
      className={cn(INSTANT_QUOTE_CTA.buttonClassName, buttonClassName)}
    >
      <SmartLink
        href={INSTANT_QUOTE_CTA.href}
        className={cn(INSTANT_QUOTE_CTA.linkClassName, linkClassName)}
        onClick={handleClick}
        external={false}
      >
        <Zap className={cn(INSTANT_QUOTE_CTA.iconClassName, iconClassName)} aria-hidden="true" />
        {label}
      </SmartLink>
    </Button>
  );
}
