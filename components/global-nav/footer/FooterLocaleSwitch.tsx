"use client";

import { LanguageToggle } from "@/components/global-nav/LanguageToggle";
import type { Locale } from "@/lib/i18n/locale";

type FooterLocaleSwitchProps = {
  locale: Locale;
};

export function FooterLocaleSwitch({ locale }: FooterLocaleSwitchProps) {
  return <LanguageToggle locale={locale} variant="footer" />;
}
