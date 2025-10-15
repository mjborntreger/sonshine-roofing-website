import type { ComponentType, SVGProps } from "react";

import { Accordion } from "@/components/ui/Accordion";

import SmartLink from "../../utils/SmartLink";
import {
  ShieldCheck,
  Shield,
  MapPin,
  HandCoins,
  Award,
  CalendarDays,
  BadgeCheck,
  Star,
  Banknote,
  ArrowRight,
} from "lucide-react";

const SECTION_CONTAINER = "px-2";
const SECTION_HEADING = "text-3xl md:text-5xl text-slate-700";
const SECTION_SUBTITLE = "mt-2 mb-8 text-sm text-slate-500"
const FEATURE_PILL_CLASS = "badge badge--accent";
const FEATURE_LIST_CLASS = "mt-3 flex flex-wrap justify-center gap-2 text-sm";
const MOBILE_COLUMN_CLASS = "md:hidden my-8 space-y-4";
const GRID_LAYOUT_CLASS = "mt-8 grid grid-cols-2 gap-5 items-start auto-rows-fr";
const CARD_SHELL_BASE = "overflow-hidden rounded-3xl bg-white/95 backdrop-blur-sm flex h-full flex-col";
const ACCORDION_SHELL_BASE = `group ${CARD_SHELL_BASE}`;
const CARD_SUMMARY_BASE = "flex cursor-pointer select-none items-center justify-between gap-3 rounded-t-3xl px-6 py-5 text-left text-lg font-semibold text-slate-900 transition-colors";
const CARD_HEADER_BASE = "flex items-center gap-3 rounded-t-4xl px-6 pt-6 pb-4 text-lg font-semibold text-slate-900";
const CARD_BODY_BASE = "flex-1 rounded-b-4xl px-6 pb-6 pt-4 text-sm leading-relaxed";
const ICON_BASE = "grid h-10 w-10 place-items-center rounded-full transition-transform duration-200";
const CHEVRON_BASE =
  "h-5 w-5 text-slate-500 transition-transform duration-300 group-open:rotate-180 group-open/accordion:rotate-180";
const TITLE_BASE = "relative inline-block text-slate-900 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:transition-all after:duration-300";

type ThemeKey = "blue" | "orange";

const CARD_THEMES: Record<ThemeKey, {
  frame: string;
  shell: string;
  summary: string;
  body: string;
  icon: string;
  titleAccent: string;
}> = {
  blue: {
    frame:
      "group rounded-3xl p-[1px] bg-gradient-to-r from-[--brand-blue] via-[--brand-blue]/80 to-[--brand-cyan] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl h-full",
    shell: "ring-1 ring-blue-100/60",
    summary: "bg-blue-10/80 group-open:bg-blue-10/80 border-b border-blue-100/60",
    body: "bg-blue-10/10 text-slate-800",
    icon: "bg-blue-100 text-[--brand-blue] ring-1 ring-blue-200/70 shadow-sm group-hover:scale-105",
    titleAccent:
      "after:bg-gradient-to-r after:from-[--brand-blue] after:via-[--brand-cyan] after:to-[--brand-blue] group-hover:after:w-14 group-open:after:w-14",
  },
  orange: {
    frame:
      "group rounded-3xl p-[1px] bg-gradient-to-r from-[--brand-orange] via-amber-400 to-amber-300 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl",
    shell: "ring-1 ring-orange-200/70",
    summary: "bg-orange-10/80 group-open:bg-orange-50 border-b border-orange-100/60",
    body: "bg-orange-10/10 text-slate-800",
    icon: "bg-orange-100 text-[--brand-orange] ring-1 ring-orange-200/70 shadow-sm group-hover:scale-105",
    titleAccent:
      "after:bg-gradient-to-r after:from-[--brand-orange] after:via-amber-400 after:to-[--brand-orange] group-hover:after:w-14 group-open:after:w-14",
  },
};

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type Pillar = {
  id: string;
  title: string;
  description: string;
  icon: IconType;
  theme: ThemeKey;
  defaultOpen?: boolean;
  cta?: {
    href: string;
    label: string;
    title: string;
  };
};

const pillars: Pillar[] = [
  {
    id: "local-expertise",
    title: "Local Expertise",
    description:
      "We are not some out-of-town outfit. We know the codes, the weather, the quirks of Florida homes—and how to roof them right.",
    icon: MapPin,
    theme: "blue",
  },
  {
    id: "quality-craftsmanship",
    title: "Quality Craftsmanship",
    description:
      "Our crews don’t cut corners. Every shingle, every nail, every detail is done with pride, precision, and care. 100% of our work is done by our crews—not subcontractors—and we back it with industry-leading warranties.",
    icon: ShieldCheck,
    theme: "blue",
  },
  {
    id: "durable-materials",
    title: "Durable Materials",
    description:
      "Salty air, blistering heat, and devastating storms? We use materials tough enough to take it all. As a certified GAF Master Elite roofer, we have the materials and know-how to give you the most durable and energy-efficient roof you will ever buy.",
    icon: Shield,
    theme: "blue",
  },
  {
    id: "flexible-financing",
    title: "Flexible Financing",
    description:
      "Low-interest home-secured and credit-based plans—see your options in minutes. No obligation.",
    icon: HandCoins,
    theme: "orange",
    defaultOpen: true,
    cta: {
      href: "/financing#get-started",
      label: "Get started",
      title: "Get started with financing",
    },
  },
];

export default async function WhyHomeownersChooseUs() {
  return (
    <div className={SECTION_CONTAINER}>
      <div className="text-center">
        <h2 className={SECTION_HEADING}>Why Homeowners Choose Us</h2>
        <p className={SECTION_SUBTITLE}>(because we&rsquo;re awesome)</p>
        
        <div className={FEATURE_LIST_CLASS}>
          <span className={`${FEATURE_PILL_CLASS} inline-flex items-center gap-2`}>
            <Award className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
            GAF Master Elite Certified
          </span>
          <span className={`${FEATURE_PILL_CLASS} inline-flex items-center gap-2`}>
            <CalendarDays className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
            38+ Years
          </span>
          <span className={`${FEATURE_PILL_CLASS} inline-flex items-center gap-2`}>
            <BadgeCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
            A+ Rated with the BBB
          </span>
          <span className={`${FEATURE_PILL_CLASS} inline-flex items-center gap-2`}>
            <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
            4.8 on Google
          </span>
          <span className={`${FEATURE_PILL_CLASS} inline-flex items-center gap-2`}>
            <ShieldCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
            Licensed and Insured
          </span>
          <span className={`${FEATURE_PILL_CLASS} inline-flex items-center gap-2`}>
            <BadgeCheck className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
            Warranty
          </span>
          <span className={`${FEATURE_PILL_CLASS} inline-flex items-center gap-2`}>
            <Banknote className="h-4 w-4 text-[--brand-blue]" aria-hidden="true" />
            Financing
          </span>
        </div>
      </div>

      {/* Mobile / Tablet: Accordion toggles */}
      <div className={MOBILE_COLUMN_CLASS}>
        {pillars.map((pillar) => {
          const theme = CARD_THEMES[pillar.theme];
          const Icon = pillar.icon;

          return (
            <div key={`${pillar.id}-mobile`} className={theme.frame}>
              <Accordion
                className={`${ACCORDION_SHELL_BASE} ${theme.shell} border-0`}
                summary={<h3 className={`${TITLE_BASE} ${theme.titleAccent}`}>{pillar.title}</h3>}
                icon={<Icon className="h-5 w-5" aria-hidden="true" />}
                iconWrapperClassName={`${ICON_BASE} ${theme.icon}`}
                chevronClassName={CHEVRON_BASE}
                summaryClassName={`${CARD_SUMMARY_BASE} ${theme.summary}`}
                contentClassName={`${CARD_BODY_BASE} ${theme.body}`}
                proseBody={false}
                defaultOpen={pillar.defaultOpen}
              >
                <p>{pillar.description}</p>
                {pillar.cta ? (
                  <div className="mt-6 flex justify-end">
                    <SmartLink
                      href={pillar.cta.href}
                      className="btn btn-brand-orange btn-md btn-press mt-2"
                      title={pillar.cta.title}
                      data-icon-affordance="right"
                    >
                      {pillar.cta.label}
                      <ArrowRight className="icon-affordance ml-2 inline h-4 w-4" />
                    </SmartLink>
                  </div>
                ) : null}
              </Accordion>
            </div>
          );
        })}
      </div>

      {/* Desktop: original grid cards */}
      <div className={`${GRID_LAYOUT_CLASS} hidden md:grid`}>
        {pillars.map((pillar) => {
          const theme = CARD_THEMES[pillar.theme];
          const Icon = pillar.icon;

          return (
            <div key={`${pillar.id}-desktop`} className={theme.frame}>
              <div className={`${CARD_SHELL_BASE} ${theme.shell}`}>
                <div className={`${CARD_HEADER_BASE} ${theme.summary}`}>
                  <span className="flex items-center gap-3">
                    <span className={`${ICON_BASE} ${theme.icon}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className={`${TITLE_BASE} ${theme.titleAccent}`}>{pillar.title}</h3>
                  </span>
                </div>
                <div className={`${CARD_BODY_BASE} ${theme.body}`}>
                  <p>{pillar.description}</p>
                  {pillar.cta ? (
                    <div className="mt-6 flex justify-end">
                      <SmartLink
                        href={pillar.cta.href}
                        className="btn btn-brand-orange btn-md btn-press mt-2"
                        title={pillar.cta.title}
                        data-icon-affordance="right"
                      >
                        {pillar.cta.label}
                        <ArrowRight className="icon-affordance ml-2 inline h-4 w-4" />
                      </SmartLink>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
