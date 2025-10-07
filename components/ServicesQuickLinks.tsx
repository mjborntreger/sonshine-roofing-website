"use client";

import { Hammer, Wrench, Search, ShieldCheck, HardHat } from "lucide-react";

import QuickLinksPanel, { type QuickLinkItem, type QuickLinksPalette } from "@/components/QuickLinksPanel";

const LINKS: QuickLinkItem[] = [
  {
    href: "/roof-replacement-sarasota-fl",
    label: "Roof Replacement",
    description: "Guided replacements tailored to Gulf Coast weather and HOA rules.",
    aria: "Roof Replacement",
    Icon: Hammer,
  },
  {
    href: "/roof-repair",
    label: "Roof Repair",
    description: "Fast fixes for leaks, missing shingles, and storm-battered spots.",
    aria: "Roof Repair",
    Icon: Wrench,
  },
  {
    href: "/roof-inspection",
    label: "Roof Inspection",
    description: "Detailed assessments that surface issues before they become costly.",
    aria: "Roof Inspection",
    Icon: Search,
  },
  {
    href: "/roof-maintenance",
    label: "Roof Maintenance",
    description: "Seasonal upkeep plans that extend your roof's lifespan with care.",
    aria: "Roof Maintenance",
    Icon: ShieldCheck,
  },
];

const PALETTE: QuickLinksPalette = {
  activeBorderClass: "border-[--brand-orange]",
  hoverBorderClass: "hover:border-[--brand-orange]",
  hoverBackgroundClass: "hover:bg-orange-50",
  focusRingClass: "focus-visible:ring-[--brand-orange]",
  titleIconClassName: "text-[--brand-orange]",
  iconGradientFromClass: "from-[#fb9216]",
  iconGradientToClass: "to-[#ffd8a8]",
};

export default function ServicesQuickLinks() {
  return (
    <QuickLinksPanel
      className="mt-4"
      title="Roofing Services"
      titleIcon={HardHat}
      links={LINKS}
      palette={PALETTE}
    />
  );
}
