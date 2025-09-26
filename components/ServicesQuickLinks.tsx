"use client";

import { Hammer, Wrench, Search, ShieldCheck, ChevronRight } from "lucide-react";
import SmartLink from "@/components/SmartLink";
import { usePathname } from "next/navigation";

type LinkItem = {
  href: string;
  label: string;
  aria: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const LINKS: LinkItem[] = [
  { href: "/roof-replacement-sarasota-fl", label: "Roof Replacement", aria: "Roof Replacement", Icon: Hammer },
  { href: "/roof-repair",                  label: "Roof Repair",      aria: "Roof Repair",      Icon: Wrench },
  { href: "/roof-inspection",              label: "Roof Inspection",  aria: "Roof Inspection",  Icon: Search },
  { href: "/roof-maintenance",             label: "Roof Maintenance", aria: "Roof Maintenance", Icon: ShieldCheck },
];

// Normalize pathnames for robust matching across nested routes
function normalizePath(p: string) {
  try {
    const url = new URL(p, "https://example.com");
    let out = url.pathname;
    if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
    return out;
  } catch {
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

export default function ServicesQuickLinks() {
  const pathname = usePathname() || "/";

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 text-xs text-center font-semibold uppercase tracking-wide text-slate-700">
        <Hammer className="inline h-3 w-3 mr-2 font-semibold text-[--brand-orange]" />
        Roofing Services
      </div>

      <ul className="space-y-2">
        {LINKS.map(({ href, label, aria, Icon }) => {
          const active = isActivePath(pathname, href);
          const baseClass =
            "group flex items-center gap-3 rounded-lg border bg-white px-3 py-2 text-sm font-medium transition hover:border-[--brand-orange] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-orange] motion-reduce:transition-none";
          const inactiveClass = "border-slate-200 text-slate-800";
          const activeClass = "border-[--brand-orange] text-slate-900";

          return (
            <li key={href}>
              <SmartLink
                href={href}
                aria-label={aria}
                aria-current={active ? "page" : undefined}
                data-active={active ? "true" : "false"}
                className={`${baseClass} ${active ? activeClass : inactiveClass}`}
              >
                {/* Icon chip (kept gradient for consistency with brand family) */}
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#fb9216] to-[#ffd8a8] text-white shadow-sm">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>

                {/* Label */}
                <span className="flex-1">{label}</span>

                {/* Chevron affordance */}
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-slate-400 transition-transform motion-safe:group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </SmartLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}