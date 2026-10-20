import type { CSSProperties, ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Phone } from 'lucide-react';
import { StaticMediaProvider } from '@/components/media/StaticMediaProvider';
import { DirectusImage } from '@/components/media/DirectusImage';
import SmartLink from '@/components/utils/SmartLink';
import LeadAttributionCapture from '@/components/lead-capture/LeadAttributionCapture';
import { getSiteSettings } from '@/lib/content/directus-site';
import { SiteSettingsProvider } from '@/lib/content/site-settings-context';
import { SITE_CLIENT_IMAGE_KEYS } from '@/lib/content/static-image-client-keys';
import { selectStaticImages, staticImage } from '@/lib/content/static-media';
import AnalyticsScripts from '@/lib/telemetry/analytics';
import { SITE_ORIGIN } from '@/lib/seo/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  robots: { index: false, follow: true },
};

export const viewport: Viewport = { themeColor: '#0045d7' };

export default async function LandingLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  const brand = settings?.brandName ?? 'SonShine Roofing';
  const phone = settings?.phone ?? '(941) 866-4320';
  const phoneHref = settings?.phoneHref ?? 'tel:+19418664320';
  const publicSettings = {
    brandName: brand,
    phone,
    phoneHref,
    email: settings?.email ?? 'messages@sonshineroofing.com',
    licenseNumber: settings?.licenseNumber ?? '',
    licenseUrl: settings?.licenseUrl ?? '',
    heroImage: settings?.heroImage ?? null,
    heroVideo: settings?.heroVideo ?? null,
  };

  return (
    <SiteSettingsProvider value={publicSettings}>
      <StaticMediaProvider images={selectStaticImages(SITE_CLIENT_IMAGE_KEYS)}>
        <div id="page-top" className="min-h-svh bg-white text-slate-900" style={{ '--sticky-offset': '16px' } as CSSProperties}>
          <AnalyticsScripts enabled={settings?.enableSiteAnalytics ?? false} />
          <Suspense fallback={null}><LeadAttributionCapture /></Suspense>
          <a href="#landing-content" className="sr-only focus:not-sr-only focus:block focus:p-4">Skip to content</a>
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
              <SmartLink href="/" aria-label={`${brand} home`} className="shrink-0" prefetch={false}>
                <DirectusImage media={staticImage('sonshine-roofing-blue-orange-logo')} alt={brand} className="h-auto w-36 sm:w-44" sizes="176px" />
              </SmartLink>
              <SmartLink href={phoneHref} aria-label={`Call ${brand} at ${phone}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[--brand-blue] sm:text-base">
                <Phone className="size-4 shrink-0" aria-hidden="true" /><span>{phone}</span>
              </SmartLink>
            </div>
          </header>
          <main id="landing-content">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-8 text-sm text-slate-600">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{brand}</p>
                {settings?.address ? <p>{settings.address.street}, {settings.address.city}, {settings.address.region} {settings.address.postalCode}</p> : null}
                {settings?.licenseNumber ? <p>Florida roofing license: {settings.licenseNumber}</p> : null}
                <p className="mt-2">© {new Date().getFullYear()} {brand}</p>
              </div>
              <nav aria-label="Legal" className="flex flex-wrap items-start gap-x-5 gap-y-3">
                <SmartLink href="/privacy-policy" prefetch={false} className="underline underline-offset-4">Privacy policy</SmartLink>
                <SmartLink href="/sms-terms-and-conditions" prefetch={false} className="underline underline-offset-4">SMS terms</SmartLink>
              </nav>
            </div>
          </footer>
        </div>
      </StaticMediaProvider>
    </SiteSettingsProvider>
  );
}
