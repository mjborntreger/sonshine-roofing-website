"use client";

import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE, getLocaleFromPath, type Locale } from "./locale";

type LocaleContextValue = {
  locale: Locale;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = {
  value: Locale;
  children: React.ReactNode;
};

export function LocaleProvider({ value, children }: LocaleProviderProps) {
  const pathname = usePathname();
  const pathLocale = useMemo<Locale>(() => getLocaleFromPath(pathname), [pathname]);
  const activeLocale = pathLocale ?? value ?? DEFAULT_LOCALE;
  const contextValue = useMemo<LocaleContextValue>(() => ({ locale: activeLocale }), [activeLocale]);
  return <LocaleContext.Provider value={contextValue}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  const ctx = useContext(LocaleContext);
  return ctx?.locale ?? DEFAULT_LOCALE;
}
