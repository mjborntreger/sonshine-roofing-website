import { ArrowUpRight } from 'lucide-react';
import FooterBadges from '@/components/global-nav/footer/FooterBadges';
import StaticImage from '@/components/media/StaticImage';
import SmartLink from '@/components/utils/SmartLink';
import type { SiteSettings } from '@/lib/content/directus-site';
import { OFFICE_HOURS_PREFIXED, PHONE_HOURS_PREFIXED } from '@/lib/contact-hours';

const linkClass = 'text-[#cad8e6] transition-colors hover:text-[#ffb45f] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59ddff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b2b]';
const headingClass = 'text-sm font-bold uppercase tracking-wider text-white after:mt-2 after:block after:h-0.5 after:w-8 after:rounded-full after:bg-[#fb9216]';

export default function LandingFooter({ settings }: { settings: SiteSettings | null }) {
  const brand = settings?.brandName ?? 'SonShine Roofing';
  const hours = settings?.openingHours.length ? settings.openingHours : [OFFICE_HOURS_PREFIXED, PHONE_HOURS_PREFIXED];
  return (
    <>
      {settings?.badges.length ? <div className="my-10 md:my-16"><FooterBadges badges={settings.badges} /></div> : null}
      <footer className="border-t-4 border-[#fb9216] bg-[#071b2b] py-12 text-sm text-slate-100">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h2 className="sr-only">Footer</h2>
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <SmartLink href="/" aria-label={`${brand} home`} prefetch={false}>
                <StaticImage src={settings?.logoInverted.url ?? 'static:sonshine-roofing-wordmark'}
                  alt={settings?.logoInverted.description ?? `${brand} logo`} width={180} height={75}
                  sizes="180px" className="h-auto w-44" loading="lazy" />
              </SmartLink>
              <p className="mt-5 text-[#cad8e6]">{settings?.brandSlogan ?? 'Since 1987, we’ve got you covered.'}</p>
              {settings?.licenseNumber && settings.licenseUrl ? (
                <SmartLink href={settings.licenseUrl} target="_blank" rel="noopener noreferrer"
                  aria-label={`View Florida roofing contractor license ${settings.licenseNumber}`}
                  className="mt-5 inline-flex items-center font-bold uppercase tracking-wide text-[#ffb45f] hover:text-white"
                  data-icon-affordance="up-right">
                  License: #{settings.licenseNumber}<ArrowUpRight className="icon-affordance ml-1 size-4" aria-hidden="true" />
                </SmartLink>
              ) : null}
            </div>
            <div>
              <h3 className={headingClass}>Contact</h3>
              <address className="mt-5 space-y-3 not-italic text-[#cad8e6]">
                {settings?.address ? <p>{settings.address.street}<br />{settings.address.city}, {settings.address.region} {settings.address.postalCode}</p> : null}
                <p><SmartLink href={settings?.phoneHref ?? 'tel:+19418664320'} className={linkClass}>{settings?.phone ?? '(941) 866-4320'}</SmartLink></p>
                <p><SmartLink href='tel:+19418664320' className={linkClass}>{settings?.email ?? 'messages@sonshineroofing.com'}</SmartLink></p>
              </address>
            </div>
            <div>
              <h3 className={headingClass}>Hours of operation</h3>
              <div className="mt-5 space-y-4 text-[#cad8e6]">
                {hours.map((line) => {
                  const [label, ...parts] = line.split(':');
                  return <p key={line}><span className="font-semibold text-white">{label}:</span><br />{parts.join(':').trim() || line}</p>;
                })}
              </div>
            </div>
            <div>
              <h3 className={headingClass}>Quick Links</h3>
              <div className="mt-5 space-y-3 text-[#cad8e6]">
                <nav aria-label="Footer" className="mt-5">
                  <SmartLink href="/" prefetch={false} className={linkClass}>Site Home</SmartLink>
                </nav>
                <nav>
                  <SmartLink href="/project" prefetch={false} className={linkClass}>Project Gallery</SmartLink>
                </nav>
                <nav>
                  <SmartLink href="/financing" prefetch={false} className={linkClass}>Financing</SmartLink>
                </nav>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#24445f] pt-6 text-xs text-[#9db2c6]">
            <p>© {new Date().getFullYear()} {brand} | All Rights Reserved</p>
            <nav aria-label="Legal" className="flex flex-wrap gap-5">
              <SmartLink href="/privacy-policy" prefetch={false} className={linkClass}>Privacy Policy</SmartLink>
              <SmartLink href="/sms-terms-and-conditions" prefetch={false} className={linkClass}>SMS Terms</SmartLink>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
