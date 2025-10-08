import { Image as ImageIcon, PlayCircle, Newspaper, BookOpen, HelpCircle, Wrench } from "lucide-react";

import QuickLinksPanel, { type QuickLinkItem, type QuickLinksPalette } from "@/components/QuickLinksPanel";

const LINKS: QuickLinkItem[] = [
  {
    href: "/project",
    label: "Project Gallery",
    description: "Browse real installations and customer transformations across Sarasota.",
    aria: "Project Gallery",
    Icon: ImageIcon,
  },
  {
    href: "/video-library",
    label: "Video Library",
    description: "Watch quick explainers and behind-the-scenes footage from our team.",
    aria: "Video Library",
    Icon: PlayCircle,
  },
  {
    href: "/blog",
    label: "Blog",
    description: "Stay current with expert roofing tips, trends, and neighborhood news.",
    aria: "Blog",
    Icon: Newspaper,
  },
  {
    href: "/roofing-glossary",
    label: "Roofing Glossary",
    description: "Get plain-language definitions for the roofing terms that matter most.",
    aria: "Roofing Glossary",
    Icon: BookOpen,
  },
  {
    href: "/faq",
    label: "FAQ",
    description: "Find answers to the questions Sarasota homeowners ask most often.",
    aria: "FAQ",
    Icon: HelpCircle,
  },
];

const PALETTE: QuickLinksPalette = {
  activeBorderClass: "border-[--brand-blue]",
  hoverBorderClass: "hover:border-[--brand-blue]",
  hoverBackgroundClass: "hover:bg-blue-50",
  focusRingClass: "focus-visible:ring-[--brand-blue]",
  titleIconClassName: "text-[--brand-blue]",
  iconGradientFromClass: "from-[#0045d7]",
  iconGradientToClass: "to-[#00e3fe]",
};

export type ResourcesQuickLinksProps = {
  activePath?: string;
};

export default function ResourcesQuickLinks({ activePath = "/" }: ResourcesQuickLinksProps) {
  return (
    <QuickLinksPanel
      className="my-4"
      title="Resources"
      titleIcon={Wrench}
      links={LINKS}
      palette={PALETTE}
      activePath={activePath}
    />
  );
}
