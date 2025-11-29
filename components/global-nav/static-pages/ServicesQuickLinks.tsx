import { Hammer, Wrench, Search, ShieldCheck, HardHat } from "lucide-react";

import QuickLinksPanel, {
  type QuickLinkItem,
  type QuickLinksPalette,
} from "@/components/global-nav/static-pages/QuickLinksPanel";
import {
  buildServiceHref,
  getServiceRouteDefinition,
  type ServiceRouteKey,
} from "@/lib/routes";

const PALETTE: QuickLinksPalette = {
  activeBorderClass: "border-[--brand-orange]",
  hoverBorderClass: "hover:border-[--brand-orange]",
  hoverBackgroundClass: "hover:bg-orange-50",
  focusRingClass: "focus-visible:ring-[--brand-orange]",
  titleIconClassName: "text-[--brand-orange]",
  iconGradientFromClass: "from-[#fb9216]",
  iconGradientToClass: "to-[#ffd8a8]",
};

export type ServicesQuickLinksProps = {
  activePath?: string;
  locationSlug?: string | null;
  preferLocationScopedLinks?: boolean;
};

type ServiceQuickLinkDefinition = {
  serviceKey: ServiceRouteKey;
  description: string;
  aria: string;
  Icon: QuickLinkItem["Icon"];
};

const LINK_DEFINITIONS: ServiceQuickLinkDefinition[] = [
  {
    serviceKey: "roofReplacement",
    description: "Guided replacements tailored to Gulf Coast weather and HOA rules.",
    aria: "Roof Replacement",
    Icon: Hammer,
  },
  {
    serviceKey: "roofRepair",
    description: "Fast fixes for leaks, missing shingles, and storm-battered spots.",
    aria: "Roof Repair",
    Icon: Wrench,
  },
  {
    serviceKey: "roofInspection",
    description: "Detailed assessments that surface issues before they become costly.",
    aria: "Roof Inspection",
    Icon: Search,
  },
  {
    serviceKey: "roofMaintenance",
    description: "Seasonal upkeep plans that extend your roof's lifespan with care.",
    aria: "Roof Maintenance",
    Icon: ShieldCheck,
  },
];

export default function ServicesQuickLinks({
  activePath = "/",
  locationSlug,
  preferLocationScopedLinks = false,
}: ServicesQuickLinksProps) {
  // Flip preferLocationScopedLinks to true once /locations/[slug]/service routes are live.
  const links: QuickLinkItem[] = LINK_DEFINITIONS.map(({ serviceKey, description, aria, Icon }) => {
    const route = getServiceRouteDefinition(serviceKey);
    return {
      href: buildServiceHref(serviceKey, {
        locationSlug,
        preferLocation: preferLocationScopedLinks,
      }),
      label: route?.label ?? aria,
      description,
      aria,
      Icon,
    };
  });

  return (
    <QuickLinksPanel
      className="mb-4"
      title="Roofing Services"
      titleIcon={HardHat}
      links={links}
      palette={PALETTE}
      activePath={activePath}
    />
  );
}
