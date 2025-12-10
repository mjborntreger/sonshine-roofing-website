import Image from "next/image";
import dynamic from "next/dynamic";
import SmartLink from "@/components/utils/SmartLink";
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
} from "lucide-react";
import { NAV_COMPANY, NAV_SERVICES, NAV_RESOURCES, ROUTES, NAV_LOCATIONS } from "@/lib/routes";
import { DEFAULT_LOCALE, prefixPathWithLocale, type Locale } from "@/lib/i18n/locale";
import { FooterLocaleSwitch } from "@/components/global-nav/footer/FooterLocaleSwitch";

type SocialLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const SOCIALS: SocialLink[] = [
  { href: "https://www.facebook.com/sonshineroofing", label: "Facebook", icon: Facebook },
  { href: "https://www.instagram.com/sonshineroofing", label: "Instagram", icon: Instagram },
  { href: "https://www.youtube.com/c/sonshineroofing", label: "YouTube", icon: Youtube },
  { href: "https://nextdoor.com/pages/sonshine-roofing-sarasota-fl", label: "Nextdoor", icon: Home },
  { href: "https://www.google.com/maps/place/SonShine+Roofing/@27.3105774,-82.4518265,16z/data=!3m1!4b1!4m6!3m5!1s0x88c34710987d2023:0x5318594fb175e958!8m2!3d27.3105727!4d-82.446961!16s%2Fg%2F1wh4gn84?entry=ttu&g_ep=EgoyMDI1MDkxMC4wIKXMDSoASAFQAw%3D%3D", label: "Google Business Profile", icon: MapPin },
  { href: "https://www.yelp.com/biz/sonshine-roofing-sarasota", label: "Yelp", icon: BadgeCheck },
  { href: "https://www.pinterest.com/sonshineroofing", label: "Pinterest", icon: Pin },
  { href: "https://x.com/ssroofinginc", label: "X (Twitter)", icon: Twitter },
];

const LINK_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {},
  es: {
    Home: "Inicio",
    About: "Acerca de",
    Contact: "Contacto",
    Financing: "Financiamiento",
    "Roof Replacement": "Reemplazo de techo",
    "Roof Repair": "Reparacion de techo",
    "Roof Inspection": "Inspeccion de techo",
    "Roof Maintenance": "Mantenimiento de techo",
    "Project Gallery": "Galeria de proyectos",
    "Video Library": "Biblioteca de videos",
    "Roofing Glossary": "Glosario de techado",
    Blog: "Blog",
    FAQ: "Preguntas frecuentes",
    Reviews: "Resenas",
    "Privacy Policy": "Politica de privacidad",
    "XML Sitemap": "Mapa del sitio XML",
  },
};

const FOOTER_COPY = {
  en: {
    roofingServices: "Roofing Services",
    ourWork: "Our Work",
    serviceAreas: "Service Areas",
    hours: "Hours of Operation",
    returnToTop: "Return to Top",
    leaveReview: "Leave a Review",
  },
  es: {
    roofingServices: "Servicios de techado",
    ourWork: "Nuestros trabajos",
    serviceAreas: "Areas de servicio",
    hours: "Horas de operacion",
    returnToTop: "Volver arriba",
    leaveReview: "Dejar una resena",
  },
} satisfies Record<Locale, { roofingServices: string; ourWork: string; serviceAreas: string; hours: string; returnToTop: string; leaveReview: string }>;

const linkStyles = "text-xs md:text-sm text-slate-600 hover:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00e3fe]";
const h3Styles = "text-sm md:text-md font-bold uppercase tracking-wider text-[--brand-blue]";
const hoursStyles = "text-xs md:text-sm text-slate-600"

const logoSrc = "https://next.sonshineroofing.com/wp-content/uploads/sonshine-logo-text.webp";

const FooterBadges = dynamic(() => import("@/components/global-nav/footer/FooterBadges"), {
  loading: () => (
    <div
      aria-hidden="true"
      className="w-full h-24 my-10 rounded-lg animate-pulse bg-slate-300/40"
    />
  ),
});

export default function Footer({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const activeLocale = locale ?? DEFAULT_LOCALE;
  const copy = FOOTER_COPY[activeLocale] ?? FOOTER_COPY.en;
  const translate = (label: string) => LINK_TRANSLATIONS[activeLocale]?.[label] ?? label;
  const localizeHref = (href: string) => (/^[a-z]+:/i.test(href) ? href : prefixPathWithLocale(href, activeLocale));

  return (
    <>
      <SmartLink
        href="#page-top"
        className="text-center hover:text-slate-600"
        data-icon-affordance="up"
        aria-label={copy.returnToTop}
      >
        {copy.returnToTop}
        <ArrowUp className="inline w-4 h-4 ml-2 icon-affordance" />
      </SmartLink>

      <FooterBadges />

      <footer className="bg-[#cef3ff] pt-20">
        <div className="max-w-6xl px-10 mx-auto">
          <h2 className="sr-only">Footer</h2>

          {/* Columns */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-12 lg:grid-cols-5"
          >
            {/* Company */}
            <div>
              <SmartLink
                href={localizeHref(ROUTES.home)}
                aria-label="SonShine Roofing Logo"
                title="SonShine Roofing Logo"
              >
                <Image
                  src={logoSrc}
                  alt="SonShine Roofing Logo"
                  aria-label="SonShine Roofing Logo"
                  width={180}
                  height={75}
                  sizes="(max-width: 120px) 20vw, 768px"
                  loading="lazy"
                  fetchPriority="low"
                  className="mb-4"
                />
              </SmartLink>
              <ul className="mt-3 space-y-3 text-sm">
                <li>
                </li>
                <li>
                  <SmartLink
                    className="font-display tracking-wider text-sm md:text-md uppercase font-bold text-[--brand-blue] hover:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00e3fe]"
                    href="https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=601EB27C16D2369E36FD9B81C20A0755"
                    aria-label="Florida Roofing Contractor's License Number CCC1331483"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-icon-affordance="up-right"
                  >
                    License: #CCC1331483
                    <ArrowUpRight
                      className="icon-affordance inline ml-1 h-3 w-3 md:h-4 md:w-4 align-[-0.125em] text-[--brand-blue]"
                      aria-hidden="true"
                    />
                  </SmartLink>
                </li>
                {NAV_COMPANY.map((r) => (
                  <li key={r.href}>
                    <SmartLink href={localizeHref(r.href)} className={linkStyles}>
                      {translate(r.label)}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Roofing Services */}
            <div>
              <h3 className={h3Styles}>
                {copy.roofingServices}
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                {/* NAV_SERVICES pulls from buildServiceHref; supply location slug once scoped pages exist. */}
                {NAV_SERVICES.map((r) => (
                  <li key={r.href}>
                    <SmartLink href={localizeHref(r.href)} className={linkStyles}>
                      {translate(r.label)}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className={h3Styles}>
                {copy.ourWork}
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                {NAV_RESOURCES.map((r) => (
                  <li key={r.href}>
                    <SmartLink href={localizeHref(r.href)} className={linkStyles}>
                      {translate(r.label)}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Locations */}
            <div>
              <h3 className={h3Styles}>{copy.serviceAreas}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {NAV_LOCATIONS.map((r) => (
                  <li key={r.href}>
                    <SmartLink href={localizeHref(r.href)} className={linkStyles}>
                      {r.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>


            {/* Hours */}
            <div>
              <h3 className={h3Styles}>
                {copy.hours}
              </h3>
              <dl className="grid grid-cols-2 pr-8 mt-4 text-sm gap-x-1 gap-y-3">
                <dt className={hoursStyles}>Mon.</dt>
                <dd className={`${hoursStyles} text-right whitespace-nowrap`}>7:00a – 5:30p</dd>
                <dt className={hoursStyles}>Tues.</dt>
                <dd className={`${hoursStyles} text-right whitespace-nowrap`}>7:00a – 5:30p</dd>
                <dt className={hoursStyles}>Wed.</dt>
                <dd className={`${hoursStyles} text-right whitespace-nowrap`}>7:00a – 5:30p</dd>
                <dt className={hoursStyles}>Thurs.</dt>
                <dd className={`${hoursStyles} text-right whitespace-nowrap`}>7:00a – 5:30p</dd>
                <dt className={hoursStyles}>Fri.</dt>
                <dd className={`${hoursStyles} text-right whitespace-nowrap`}>7:00a – 5:30p</dd>
                <dt className={hoursStyles}>Sat.</dt>
                <dd className={`${hoursStyles} text-right whitespace-nowrap`}>Closed</dd>
                <dt className={hoursStyles}>Sun.</dt>
                <dd className={`${hoursStyles} text-right whitespace-nowrap`}>Closed</dd>
              </dl>
            </div>

          </nav>

          <div className="flex flex-wrap justify-between gap-8 mt-24 mb-8">
            <SmartLink
              href={localizeHref("/reviews")}
              className="px-3 py-2 text-sm text-white md:text-md btn btn-brand-orange"
              data-icon-affordance="up-right"
            >
              <Star className="w-3 h-3 mr-2 text-white md:h-4 md:w-4" />
              {copy.leaveReview}
              <ArrowUpRight className="inline w-3 h-3 ml-1 text-white md:h-4 md:w-4 icon-affordance" />
            </SmartLink>

            {/* Socials Badges Row */}
            <div className="flex items-center gap-2">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="flex h-6 w-6 items-center justify-center text-[--brand-blue] transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00e3fe]"
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                );
              })}
            </div>

          </div>

          {/* Bottom bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-3 border-t border-slate-300">
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} SonShine Roofing — Since 1987 we’ve got you covered. | All Rights Reserved
            </div>

            <nav className="flex items-center justify-end gap-4 text-xs font-semibold text-slate-500">
              <SmartLink href={localizeHref(ROUTES.privacyPolicy)}>{translate("Privacy Policy")}</SmartLink>
              <SmartLink href={localizeHref(ROUTES.sitemapIndex)}>{translate("XML Sitemap")}</SmartLink>
              <FooterLocaleSwitch locale={activeLocale} />
            </nav>
          </div>
          <div className="py-4">
            <div className="text-xs font-semibold text-right text-slate-500">
              <SmartLink href="https://michaelborntreger.life">Website created by: Michael Borntreger</SmartLink>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
