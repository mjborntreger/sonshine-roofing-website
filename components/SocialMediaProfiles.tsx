import SmartLink from "@/components/SmartLink";
import { ChevronRight, Share2 } from "lucide-react";
import Image from "next/image";
// Styled like ResourcesQuickLinks (button-ified list items)
// — maintains each platform color for the label
// — uses favicon chips for the icons

type SocialLink = {
  href: string;
  label: string;
  color: string; // brand hex for label
  domain: string; // for Google s2 favicons
};

const LINKS: SocialLink[] = [
  { href: "https://www.facebook.com/sonshineroofing", label: "Facebook", color: "#1877F2", domain: "facebook.com" },
  { href: "https://www.instagram.com/sonshineroofing", label: "Instagram", color: "#E4405F", domain: "instagram.com" },
  { href: "https://www.youtube.com/c/sonshineroofing", label: "YouTube", color: "#FF0000", domain: "youtube.com" },
  { href: "https://nextdoor.com/pages/sonshine-roofing-sarasota-fl", label: "Nextdoor", color: "#00B246", domain: "nextdoor.com" },
  { href: "https://www.google.com/maps/place/SonShine+Roofing/@27.3105774,-82.4518265,16z/data=!3m1!4b1!4m6!3m5!1s0x88c34710987d2023:0x5318594fb175e958!8m2!3d27.3105727!4d-82.446961!16s%2Fg%2F1wh4gn84?entry=ttu&g_ep=EgoyMDI1MDkxMC4wIKXMDSoASAFQAw%3D%3D", label: "Google", color: "#4285F4", domain: "google.com" },
  { href: "https://www.yelp.com/biz/sonshine-roofing-sarasota", label: "Yelp", color: "#D32323", domain: "yelp.com" },
  { href: "https://www.pinterest.com/sonshineroofing", label: "Pinterest", color: "#E60023", domain: "pinterest.com" },
  { href: "https://x.com/ssroofinginc", label: "X", color: "#000000", domain: "x.com" },
];

export default function SocialMediaProfiles() {
  const baseClass =
    "group flex items-center gap-3 rounded-lg border bg-white px-3 py-2 text-sm font-medium transition hover:bg-slate-50 hover:border-[--brand-blue] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-cyan] motion-reduce:transition-none";
  const chipClass =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200";

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm text-center font-semibold uppercase tracking-wide text-slate-700">
          <Share2 className="inline h-4 w-4 mr-2 text-green-600" />
          Social Media Profiles
        </div>

        <ul className="space-y-2" aria-label="Social media links">
          {LINKS.map((l) => (
            <li key={l.href}>
              <SmartLink
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                title={l.label}
                data-icon-affordance="right"
                className={baseClass}
              >
                <span className={chipClass} aria-hidden="true">
                  <Image
                    src={`https://www.google.com/s2/favicons?domain=${l.domain}&sz=64`}
                    alt={`${l.label} favicon`}
                    width={24}
                    height={24}
                    sizes="(max-width: 24px)"
                    loading="lazy"
                    decoding="async"
                  />
                </span>

                {/* Label preserves platform color */}
                <span className="flex-1" style={{ color: l.color }}>{l.label}</span>

                <ChevronRight className="icon-affordance h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              </SmartLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
