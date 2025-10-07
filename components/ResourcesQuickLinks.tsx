"use client";

import { Image as ImageIcon, PlayCircle, Newspaper, BookOpen, HelpCircle, ChevronRight, Wrench } from "lucide-react";
import SmartLink from "@/components/SmartLink";
import { usePathname } from "next/navigation";

type LinkItem = {
  href: string;
  label: string;
  description: string;
  aria: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const LINKS: LinkItem[] = [
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

// Normalize pathnames for robust matching across service pages, blogs, and nested routes
function normalizePath(p: string) {
  try {
    // ensure leading slash, remove query/hash and trailing slash (except root)
    const url = new URL(p, "https://example.com");
    let out = url.pathname;
    if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
    return out;
  } catch {
    // plain path (no scheme)
    let out = p.split("?")[0].split("#")[0] || "/";
    if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
    if (!out.startsWith("/")) out = "/" + out;
    return out;
  }
}

function isActivePath(current: string, href: string) {
  const cur = normalizePath(current);
  const base = normalizePath(href);
  if (base === "/") return cur === "/";
  return cur === base || cur.startsWith(base + "/");
}

export default function ResourcesQuickLinks() {
  const pathname = usePathname() || "/";

  return (
    <div className="my-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 text-sm text-center font-semibold uppercase tracking-wide text-slate-700">
        <Wrench className="h-4 w-4 inline mr-2 font-semibold text-[--brand-blue]" />
        Resources
      </div>

      <ul className="space-y-2">
        {LINKS.map(({ href, label, description, aria, Icon }) => {
          const active = isActivePath(pathname, href);
          const baseClass =
            "group flex items-center gap-3 rounded-2xl border bg-white px-3 py-2 text-sm font-medium transition hover:border-[--brand-blue] hover:bg-blue-50 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-orange] motion-reduce:transition-none";
          const inactiveClass = "border-slate-200 text-slate-800";
          const activeClass = "border-[--brand-blue] text-slate-900";

          return (
            <li key={href}>
              <SmartLink
                href={href}
                aria-label={aria}
                aria-current={active ? "page" : undefined}
                data-active={active ? "true" : "false"}
                data-icon-affordance="right"
                className={`${baseClass} ${active ? activeClass : inactiveClass}`}
              >
                {/* Icon chip with brand gradient */}
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#0045d7] to-[#00e3fe] text-white shadow-sm">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>

                {/* Label and description */}
                <div className="flex-1 min-w-0 text-left">
                  <span className="font-display font-bold text-md block truncate">{label}</span>
                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{description}</p>
                </div>

                {/* Chevron affordance */}
                <ChevronRight className="icon-affordance h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              </SmartLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
