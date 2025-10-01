import Image from "next/image";
import dynamic from "next/dynamic";
import SmartLink from "@/components/SmartLink";
import { ArrowUpRight, ArrowUp, ArrowRight, Phone, Calendar } from "lucide-react";
import { NAV_COMPANY, NAV_SERVICES, NAV_RESOURCES, ROUTES } from "@/lib/routes";

const SOCIALS = [
  { href: "https://www.facebook.com/sonshineroofing", label: "Facebook", domain: "facebook.com" },
  { href: "https://www.instagram.com/sonshineroofing", label: "Instagram", domain: "instagram.com" },
  { href: "https://www.youtube.com/c/sonshineroofing", label: "YouTube", domain: "youtube.com" },
  { href: "https://nextdoor.com/pages/sonshine-roofing-sarasota-fl", label: "Nextdoor", domain: "nextdoor.com" },
  { href: "https://www.google.com/maps/place/SonShine+Roofing/@27.3105774,-82.4518265,16z/data=!3m1!4b1!4m6!3m5!1s0x88c34710987d2023:0x5318594fb175e958!8m2!3d27.3105727!4d-82.446961!16s%2Fg%2F1wh4gn84?entry=ttu&g_ep=EgoyMDI1MDkxMC4wIKXMDSoASAFQAw%3D%3D", label: "Google Business Profile", domain: "google.com" },
  { href: "https://www.yelp.com/biz/sonshine-roofing-sarasota", label: "Yelp", domain: "yelp.com" },
  { href: "https://www.pinterest.com/sonshineroofing", label: "Pinterest", domain: "pinterest.com" },
  { href: "https://x.com/ssroofinginc", label: "X (Twitter)", domain: "x.com" },
];

const linkStyles = "text-sm text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00e3fe]";
const h3Styles = "text-xs font-semibold uppercase tracking-wider text-slate-700";

const FooterBadges = dynamic(() => import("./FooterBadges"), {
  loading: () => (
    <div
      aria-hidden="true"
      className="my-10 h-24 w-full animate-pulse rounded-lg bg-slate-300/40"
    />
  ),
});

export default function Footer() {
  return (
    <>
      <SmartLink
        href="#page-top"
        className="text-center"
        data-icon-affordance="up"
      >
        Return to Top
        <ArrowUp className="icon-affordance h-4 w-4 inline ml-2" />
      </SmartLink>

      <FooterBadges />

      <footer className="bg-slate-200 pt-20">
        <div className="mx-auto max-w-6xl px-10">
          <h2 className="sr-only">Footer</h2>

          {/* Columns */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-12 lg:grid-cols-4"
          >
            {/* Company */}
            <div>
              <SmartLink
                href={ROUTES.home}
                aria-label="SonShine Roofing Logo"
                title="SonShine Roofing Logo"
              >
                <Image
                  src="https://next.sonshineroofing.com/wp-content/uploads/sonshine-logo-text.webp"
                  alt="SonShine Roofing Logo"
                  width={158.5}
                  height={66}
                  sizes="(max-width: 158.5px) 33vw 366px"
                  loading="lazy"
                  fetchPriority="low"
                  className="mb-5"
                />
              </SmartLink>
              <ul className="mt-3 space-y-3 text-sm">
                <li>
                </li>
                <li>
                  <SmartLink
                    className={linkStyles}
                    href="https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=601EB27C16D2369E36FD9B81C20A0755"
                    aria-label="Florida Roofing Contractor's License Number CCC1331483"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-icon-affordance="up-right"
                  >
                    License: #CCC1331483
                    <ArrowUpRight
                      className="icon-affordance inline ml-1 h-3 w-3 align-[-0.125em] text-slate-700"
                      aria-hidden="true"
                    />
                  </SmartLink>
                </li>
                {NAV_COMPANY.map((r) => (
                  <li key={r.href}>
                    <SmartLink href={r.href} className={linkStyles}>
                      {r.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Roofing Services */}
            <div>
              <h3 className={h3Styles}>
                Roofing Services
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                {NAV_SERVICES.map((r) => (
                  <li key={r.href}>
                    <SmartLink href={r.href} className={linkStyles}>
                      {r.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className={h3Styles}>
                Resources
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                {NAV_RESOURCES.map((r) => (
                  <li key={r.href}>
                    <SmartLink href={r.href} className={linkStyles}>
                      {r.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h3 className={h3Styles}>
                Hours of Operation
              </h3>
              <dl className="mt-4 grid grid-cols-2 text-sm gap-x-1 gap-y-3 pr-8">
                <dt className="text-slate-600">Mon.</dt>
                <dd className="text-right text-slate-600 whitespace-nowrap">7:00a – 5:30p</dd>
                <dt className="text-slate-600">Tues.</dt>
                <dd className="text-right text-slate-600 whitespace-nowrap">7:00a – 5:30p</dd>
                <dt className="text-slate-600">Wed.</dt>
                <dd className="text-right text-slate-600 whitespace-nowrap">7:00a – 5:30p</dd>
                <dt className="text-slate-600">Thurs.</dt>
                <dd className="text-right text-slate-600 whitespace-nowrap">7:00a – 5:30p</dd>
                <dt className="text-slate-600">Fri.</dt>
                <dd className="text-right text-slate-600 whitespace-nowrap">7:00a – 5:30p</dd>
                <dt className="text-slate-600">Sat.</dt>
                <dd className="text-right text-slate-600 whitespace-nowrap">Closed</dd>
                <dt className="text-slate-600">Sun.</dt>
                <dd className="text-right text-slate-600 whitespace-nowrap">Closed</dd>
              </dl>
            </div>

          </nav>

          <div className="flex flex-wrap justify-between gap-8 mt-24 mb-8">
            <SmartLink
              href="/contact-us#book-an-appointment"
              className="text-xs btn btn-secondary px-3 py-2"
              data-icon-affordance="up-right"
            >
              <Calendar className="inline h-3 w-3 mr-1" />
              Book an Appointment
              <ArrowUpRight className="inline h-3 w-3 ml-1 icon-affordance" />
            </SmartLink>

            {/* Socials Badges Row */}
            <div className="flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="h-6 w-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00e3fe]"
                >
                  <Image
                    src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=64`}
                    alt={s.label}
                    width={32}
                    height={32}
                    sizes="(max-width: 32px) 5vw 366px"
                    loading="lazy"
                    className="h-6 w-6"
                  />
                </a>
              ))}
            </div>

          </div>

          {/* Bottom bar */}
          <div className="mt-3 border-t border-slate-300 pt-6 flex flex-wrap justify-between items-center gap-4">
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} SonShine Roofing — Since 1987 we’ve got you covered. | All Rights Reserved
            </div>

            <nav className="text-xs font-semibold text-slate-500 flex items-center justify-end gap-4">
              <SmartLink href={ROUTES.privacyPolicy}>Privacy Policy</SmartLink>
              <SmartLink href={ROUTES.sitemapIndex}>XML Sitemap</SmartLink>
            </nav>
          </div>
          <div className="py-4">
            <div className="text-xs font-semibold text-slate-500 text-right">
              <SmartLink href="https://michaelborntreger.life">Website created by: Michael Borntreger</SmartLink>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
