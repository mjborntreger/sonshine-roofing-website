import Image from 'next/image';
import dynamic from 'next/dynamic';
import SmartLink from '@/components/utils/SmartLink';
import {
  ArrowUpRight,
  ArrowUp,
  Star,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Home,
  MapPin,
  Pin,
  BadgeCheck,
  type LucideIcon,
} from 'lucide-react';
import { NAV_COMPANY, NAV_SERVICES, NAV_RESOURCES, ROUTES, NAV_LOCATIONS } from '@/lib/routes';
import type { NavItem } from '@/lib/routes';
import type { ServiceSummary, SiteSettings } from '@/lib/content/directus-site';

type SocialLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const SOCIALS: SocialLink[] = [
  { href: 'https://www.facebook.com/sonshineroofing', label: 'Facebook', icon: Facebook },
  { href: 'https://www.instagram.com/sonshineroofing', label: 'Instagram', icon: Instagram },
  { href: 'https://www.youtube.com/c/sonshineroofing', label: 'YouTube', icon: Youtube },
  {
    href: 'https://nextdoor.com/pages/sonshine-roofing-sarasota-fl',
    label: 'Nextdoor',
    icon: Home,
  },
  {
    href: 'https://www.google.com/maps/place/SonShine+Roofing/@27.3105774,-82.4518265,16z/data=!3m1!4b1!4m6!3m5!1s0x88c34710987d2023:0x5318594fb175e958!8m2!3d27.3105727!4d-82.446961!16s%2Fg%2F1wh4gn84?entry=ttu&g_ep=EgoyMDI1MDkxMC4wIKXMDSoASAFQAw%3D%3D',
    label: 'Google Business Profile',
    icon: MapPin,
  },
  { href: 'https://www.yelp.com/biz/sonshine-roofing-sarasota', label: 'Yelp', icon: BadgeCheck },
  { href: 'https://www.pinterest.com/sonshineroofing', label: 'Pinterest', icon: Pin },
  { href: 'https://x.com/ssroofinginc', label: 'X (Twitter)', icon: Twitter },
];

const linkStyles =
  'text-xs md:text-sm text-[#cad8e6] transition-colors hover:text-[#ffb45f] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59ddff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b2b]';
const h3Styles =
  'text-sm md:text-md font-bold uppercase tracking-wider text-white after:mt-2 after:block after:h-0.5 after:w-8 after:rounded-full after:bg-[#fb9216]';
const hoursStyles = 'text-xs md:text-sm text-[#cad8e6]';
const hoursLabelStyles = 'text-xs md:text-sm font-semibold text-white';
const legalLinkStyles =
  'transition-colors hover:text-[#ffb45f] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59ddff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b2b]';

const logoSrc = 'https://wp.sonshineroofing.com/wp-content/uploads/sonshine-logo-text.webp';

const FooterBadges = dynamic(() => import('@/components/global-nav/footer/FooterBadges'), {
  loading: () => (
    <div
      aria-hidden="true"
      className="w-full h-24 my-10 rounded-lg animate-pulse bg-slate-300/40"
    />
  ),
});

type FooterProps = {
  settings?: SiteSettings | null;
  services?: ServiceSummary[];
  navigation?: NavItem[];
};

type FooterLink = { label: string; href: string };

function findNavigationItem(navigation: NavItem[], label: string): NavItem | undefined {
  return navigation.find((item) => item.label === label);
}

export default function Footer({ settings, services = [], navigation = [] }: FooterProps) {
  const brandName = settings?.brandName ?? 'SonShine Roofing';
  const brandSlogan = settings?.brandSlogan ?? 'Since 1987, we’ve got you covered.';
  const resolvedLogoSrc = settings?.logoInverted.url ?? logoSrc;
  const resolvedLogoAlt = settings?.logoInverted.description ?? `${brandName} logo`;
  const companyLinks = NAV_COMPANY.map((fallback) => {
    const directusItem = findNavigationItem(navigation, fallback.label);
    return { ...fallback, href: directusItem?.href ?? fallback.href };
  });
  const roofingNavigation = findNavigationItem(navigation, 'Roofing Services');
  const referralLink = roofingNavigation?.children?.find(
    (item) => item.label === 'Referral Program',
  );
  const serviceLinks: FooterLink[] = services.length
    ? [
        ...services.map((service) => ({
          label: service.navLabel,
          href: service.href,
        })),
        ...(referralLink?.href ? [{ label: referralLink.label, href: referralLink.href }] : []),
      ]
    : [...NAV_SERVICES];
  const directusResources = findNavigationItem(navigation, 'Our Work')?.children;
  const configuredResourceLinks: FooterLink[] =
    directusResources?.flatMap((item) =>
      item.href ? [{ label: item.label, href: item.href }] : [],
    ) ?? [];
  const resourceLinks: FooterLink[] = configuredResourceLinks.length
    ? configuredResourceLinks
    : [...NAV_RESOURCES];
  const openingHours = settings?.openingHours.length
    ? settings.openingHours
    : ['Office: M-F 7:00 AM to 4:00 PM', 'Phone: 24/7'];
  const configuredSocials: SocialLink[] = [
    ...(settings?.socials.facebook
      ? [{ href: settings.socials.facebook, label: 'Facebook', icon: Facebook }]
      : []),
    ...(settings?.socials.instagram
      ? [{ href: settings.socials.instagram, label: 'Instagram', icon: Instagram }]
      : []),
    ...(settings?.socials.youtube
      ? [{ href: settings.socials.youtube, label: 'YouTube', icon: Youtube }]
      : []),
  ];
  const configuredLabels = new Set(configuredSocials.map((social) => social.label));
  const socialLinks = [
    ...configuredSocials,
    ...SOCIALS.filter((social) => !configuredLabels.has(social.label)),
  ];

  return (
    <>
      <SmartLink
        href="#page-top"
        className="mx-auto flex w-fit rounded-lg items-center border border-[#24445f] bg-[#071b2b] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:border-[#fb9216] hover:bg-[#0d2942] hover:text-[#ffb45f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59ddff] focus-visible:ring-offset-2"
        data-icon-affordance="up"
        aria-label="Return to top of page"
      >
        Return to Top
        <ArrowUp className="inline w-4 h-4 ml-2 icon-affordance" />
      </SmartLink>

      <div className="my-16 sm:my-24 md:my-32">
        <FooterBadges />
      </div>

      <footer className="border-t-4 border-[#fb9216] bg-[#071b2b] pt-20 text-slate-100">
        <div className="max-w-6xl px-10 mx-auto">
          <h2 className="sr-only">Footer</h2>

          {/* Columns */}
          <nav aria-label="Footer" className="grid grid-cols-2 gap-12 lg:grid-cols-5">
            {/* Company */}
            <div>
              <SmartLink
                href={ROUTES.home}
                aria-label={`${brandName} logo`}
                title={`${brandName} logo`}
              >
                <Image
                  src={resolvedLogoSrc}
                  alt={resolvedLogoAlt}
                  aria-label={`${brandName} logo`}
                  width={180}
                  height={75}
                  sizes="(max-width: 120px) 20vw, 768px"
                  loading="lazy"
                  fetchPriority="low"
                  className="my-48"
                />
              </SmartLink>
              <ul className="mt-8 space-y-3 text-sm">
                <li className="mb-8">
                  <SmartLink
                    className="font-display text-sm font-bold uppercase tracking-wider text-[#ffb45f] transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59ddff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b2b] md:text-md"
                    href="https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=601EB27C16D2369E36FD9B81C20A0755"
                    aria-label="Florida Roofing Contractor's License Number CCC1331483"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-icon-affordance="up-right"
                  >
                    License: #CCC1331483
                    <ArrowUpRight
                      className="icon-affordance ml-1 inline h-3 w-3 align-[-0.125em] text-[#ffb45f] md:h-4 md:w-4"
                      aria-hidden="true"
                    />
                  </SmartLink>
                </li>
                {companyLinks.map((r) => (
                  <li key={r.href}>
                    <SmartLink href={r.href} className={linkStyles}>
                      {r.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Roofing Services */}
            {settings?.footerIncludeServices !== false ? (
              <div>
                <h3 className={h3Styles}>Roofing Services</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {serviceLinks.map((r) => (
                    <li key={r.href}>
                      <SmartLink href={r.href} className={linkStyles}>
                        {r.label}
                      </SmartLink>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Resources */}
            <div>
              <h3 className={h3Styles}>Our Work</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {resourceLinks.map((r) => (
                  <li key={r.href}>
                    <SmartLink href={r.href} className={linkStyles}>
                      {r.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dynamic Location Pages */}
            <div>
              <h3 className={h3Styles}>Service Areas</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {NAV_LOCATIONS.map((r) => (
                  <li key={r.href}>
                    <SmartLink href={r.href} className={linkStyles}>
                      {r.label}
                    </SmartLink>
                  </li>
                ))}
                {/* Hardcoded Locations (no href yet) */}
                <li className={linkStyles}>Palmetto, FL</li>
                <li className={linkStyles}>Parrish, FL</li>
                <li className={linkStyles}>Myakka City, FL</li>
                <li className={linkStyles}>Port Charlotte, FL</li>
                <li className={linkStyles}>Punta Gorda, FL</li>
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h3 className={h3Styles}>Hours of Operation</h3>
              <div className="mt-4 pr-8 space-y-4">
                {openingHours.map((line) => {
                  const [label, ...valueParts] = line.split(':');
                  const value = valueParts.join(':').trim();
                  return (
                    <div key={line} className="space-y-1">
                      <p className={hoursLabelStyles}>{label.trim()}:</p>
                      <p className={hoursStyles}>{value || line}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </nav>

          <div className="flex flex-wrap justify-between gap-8 mt-24 mb-8">
            <SmartLink
              href="/reviews"
              className="btn bg-[#fb9216] px-3 py-2 text-sm font-bold !text-[#071b2b] shadow-lg shadow-black/25 transition-colors hover:bg-[#ffb45f] focus-visible:!ring-[#59ddff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b2b] md:text-md"
              data-icon-affordance="up-right"
            >
              <Star className="mr-2 h-3 w-3 text-[#071b2b] md:h-4 md:w-4" />
              Leave a Review
              <ArrowUpRight className="icon-affordance ml-1 inline h-3 w-3 text-[#071b2b] md:h-4 md:w-4" />
            </SmartLink>

            {/* Socials Badges Row */}
            {settings?.footerIncludeSocials !== false ? (
              <div className="flex flex-wrap items-center gap-2">
                {socialLinks.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.href}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#24445f] bg-[#0d2942] text-[#ffb45f] transition-colors hover:border-[#fb9216] hover:bg-[#fb9216] hover:text-[#071b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59ddff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b2b]"
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Bottom bar */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-[#24445f] pt-6">
            <div className="text-xs text-[#9db2c6]">
              © {new Date().getFullYear()} {brandName} — {brandSlogan} | All Rights Reserved
            </div>

            <nav className="flex items-center justify-end gap-4 text-xs font-semibold text-[#b9cad9]">
              {settings?.footerIncludeLegal !== false ? (
                <SmartLink href={ROUTES.privacyPolicy} className={legalLinkStyles}>
                  Privacy Policy
                </SmartLink>
              ) : null}
              <SmartLink href={ROUTES.sitemapIndex} className={legalLinkStyles}>
                XML Sitemap
              </SmartLink>
            </nav>
          </div>
          <div className="py-4">
            <div className="text-right text-xs font-semibold text-[#9db2c6]">
              <SmartLink href="https://borntregerdigital.com" className={legalLinkStyles}>
                Website created by Borntreger Digital LLC
                <ArrowUpRight className="inline h-4 w-4 ml-1" />
              </SmartLink>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
