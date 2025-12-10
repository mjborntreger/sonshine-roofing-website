"use client";

import SmartLink from "@/components/utils/SmartLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { openQuickQuoteSlideout } from "@/lib/quickquote";
import { Zap } from "lucide-react";
import { useCallback, type MouseEvent } from "react";

export const INSTANT_QUOTE_CTA = {
  href: "https://www.myquickroofquote.com/contractors/sonshine-roofing",
  label: "Instant Quote",
  buttonClassName: "bg-neutral-900/60 text-white font-display py-6 md:py-3 items-center text-2xl md:text-xl backdrop-blur hover:bg-neutral-900/90",
  linkClassName: "flex items-center gap-2",
  iconClassName: "h-4 w-4 text-[--brand-orange]",
} as const;

type InstantQuoteCTAProps = {
  buttonClassName?: string;
  linkClassName?: string;
  iconClassName?: string;
  size?: "default" | "sm" | "lg" | "xl" | "icon";
  onClick?: () => void;
};

export function InstantQuoteCTA({
  buttonClassName,
  linkClassName,
  iconClassName,
  size = "sm",
  onClick,
}: InstantQuoteCTAProps) {
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
        {INSTANT_QUOTE_CTA.label}
      </SmartLink>
    </Button>
  );
}
