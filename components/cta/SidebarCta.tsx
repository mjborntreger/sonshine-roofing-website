import { ArrowRight, CalendarDays, Smartphone } from 'lucide-react';
import SmartLink from '../utils/SmartLink';
import OpenOrClosed from '../utils/OpenOrClosed';
import CopyButton from '../utils/CopyButton';
import { getSiteSettings } from '@/lib/content/directus-site';

// Style Constants //
const arrowIconStyles = 'icon-affordance h-4 w-4 inline ml-2';
const semanticIconStyles = 'h-4 w-4 inline mr-2';
const buttonStyles = 'btn w-full btn-lg mt-2';

export default async function SidebarCta() {
  const settings = await getSiteSettings();
  if (!settings) return null;
  const phone = settings.phone;
  const phoneHref = settings.phoneHref;

  return (
    <div className="mt-4 rounded-3xl border border-blue-200 bg-white p-4 shadow-sm not-prose">
      <OpenOrClosed
        holidayClosures={['2026-11-26', '2026-11-27', '2026-01-02']}
        recurringClosures={['12-24', '12-25', '12-26', '07-04', '01-01']}
      />
      <SmartLink
        href="/contact-us#book-an-appointment"
        className={`${buttonStyles} btn-brand-blue`}
        aria-label="Contact Us"
        data-icon-affordance="right"
        proseGuard
      >
        <CalendarDays className={semanticIconStyles} />
        Contact Us
        <ArrowRight className={arrowIconStyles} />
      </SmartLink>
      <div className="flex flex-row justify-between gap-2">
        <SmartLink
          href={phoneHref}
          className={`${buttonStyles} btn-outline phone-affordance`}
          aria-label="Call SonShine Roofing"
          proseGuard
        >
          <Smartphone className={`${semanticIconStyles} phone-affordance-icon`} />
          {phone}
        </SmartLink>
        <CopyButton
          className="mt-2"
          copyContent={phoneHref.replace(/^tel:/, '')}
          ariaLabel="Copy phone number"
        />
      </div>
    </div>
  );
}
