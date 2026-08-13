'use client';

import { createContext, useContext } from 'react';

export type PublicSiteAsset = {
  url: string;
  description: string;
  width: number | null;
  height: number | null;
  type: string | null;
};

export type PublicSiteSettings = {
  brandName: string;
  phone: string;
  phoneHref: string;
  email: string;
  licenseNumber: string;
  licenseUrl: string;
  heroImage: PublicSiteAsset | null;
  heroVideo: PublicSiteAsset | null;
};

const SiteSettingsContext = createContext<PublicSiteSettings | null>(null);

export function SiteSettingsProvider({
  value,
  children,
}: {
  value: PublicSiteSettings;
  children: React.ReactNode;
}) {
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): PublicSiteSettings {
  const value = useContext(SiteSettingsContext);
  if (!value) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider.');
  }
  return value;
}
