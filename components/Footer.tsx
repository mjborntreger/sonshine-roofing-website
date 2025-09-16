import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ArrowUpRight } from "lucide-react";
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
    <footer className="pt-16 bg-slate-200">
      <div className="mx-auto max-w-6xl px-10 pt-8">
        <h2 className="sr-only">Footer</h2>

        {/* Columns */}
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5"
        >
          {/* Company */}
          <div>
            <Link
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
            </Link>
            <ul className="mt-3 space-y-3 text-sm">
              <li>
                <Link
                  className={linkStyles}
                  href="https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=601EB27C16D2369E36FD9B81C20A0755"
                  aria-label="Florida Roofing Contractor's License Number CCC1331483"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  License: #CCC1331483
                  <ArrowUpRight
                    className="inline ml-1 h-3 w-3 align-[-0.125em] text-slate-700"
                    aria-hidden="true"
                  />
                </Link>
              </li>
              {NAV_COMPANY.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className={linkStyles}>
                    {r.label}
                  </Link>
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
                  <Link href={r.href} className={linkStyles}>
                    {r.label}
                  </Link>
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
                  <Link href={r.href} className={linkStyles}>
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className={h3Styles}>
              Hours of Operation
            </h3>
            <dl className="mt-4 grid grid-cols-[max-content_auto] gap-x-1 gap-y-2 text-sm">
              <dt className="text-slate-600">Mon.</dt>
              <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
              <dt className="text-slate-600">Tues.</dt>
              <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
              <dt className="text-slate-600">Wed.</dt>
              <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
              <dt className="text-slate-600">Thurs.</dt>
              <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
              <dt className="text-slate-600">Fri.</dt>
              <dd className="text-right text-slate-600 tabular-nums whitespace-nowrap">7:00 AM – 5:30 PM</dd>
              <dt className="text-slate-600">Sat.</dt>
              <dd className="text-right text-slate-600">Closed</dd>
              <dt className="text-slate-600">Sun.</dt>
              <dd className="text-right text-slate-600">Closed</dd>
            </dl>
          </div>

          {/* Get In Touch */}
          <div>
            <h3 className={h3Styles}>
              Get In Touch
            </h3>
            <address className="mt-4 space-y-3 not-italic text-sm text-slate-600">
              <p>
                2555 Porter Lake Dr
                <br />
                STE 109
                <br />
                Sarasota, FL 34240
              </p>
              <p>
                <a
                  href="tel:+19418664320"
                  className="hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00e3fe]"
                >
                  (941) 866-4320
                </a>
              </p>
              <p>
                <a
                  href="mailto:messages@sonshineroofing.com"
                  className="hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00e3fe]"
                >
                  messages@sonshineroofing.com
                </a>
              </p>
              <p>
                <Link
                  href="/contact-us#book-an-appointment"
                  className="inline-block bg-[--brand-orange] rounded-md border border-[--brand-orange] px-3 py-1.5 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00e3fe]"
                >
                  Book an appointment
                </Link>
              </p>
            </address>
          </div>
        </nav>

        {/* Badges Row */}
        <FooterBadges />
        <div className="flex flex-wrap items-center justify-center gap-1">
            {SOCIALS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className="inline-flex h-10 w-10 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00e3fe]"
              >
                <Image
                  src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=64`}
                  alt={s.label}
                  width={32}
                  height={32}
                  sizes="(max-width: 32px) 5vw 366px"
                  loading="lazy"
                  className="h-8 w-8"
                />
              </a>
            ))}
          </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-slate-300 pt-6 flex flex-wrap justify-between items-center gap-4">
          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} SonShine Roofing — Since 1987 we’ve got you covered. | All Rights Reserved
          </div>

          <nav className="text-xs font-semibold text-slate-500 flex items-center justify-end gap-4">
            <Link href={ROUTES.privacyPolicy}>Privacy Policy</Link>
            <Link href={ROUTES.sitemapIndex}>XML Sitemap</Link>
          </nav>
        </div>
        <div className="py-4">
          <div className="text-xs font-semibold text-slate-500 text-right">
            <Link href="https://michaelborntreger.life">Website created by: Michael Borntreger</Link>
          </div>
        </div>
      </div>
    </footer>
  </>
  );
}
