"use client";
import Link from "next/link";
import type { Route } from "next";
import * as React from "react";

type UiLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "children"
> & {
  href: Route | string | URL;   // typed routes supported
  children: React.ReactNode;
  className?: string;
  external?: boolean;           // optional manual override
  prefetch?: boolean;           // for internal links
  scroll?: boolean;             // for internal links
  nofollow?: boolean;           // if you want to add later
};

function getEnvHost(): string | null {
  if (typeof window !== "undefined") return window.location.host;
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  try { return raw ? new URL(raw).host : null; } catch { return null; }
}

function isExternal(href: Route | string | URL, siteHost: string | null): boolean {
  // 1) Fast-path: relative paths and hash links are always internal
  if (typeof href === "string") {
    const s = href.trim();
    if (!s) return false;
    if (s.startsWith("#")) return false;
    if (s.startsWith("/")) return false;            // treat any leading-slash path as internal
    if (s.startsWith("//")) {                       // protocol-relative URL
      try { return new URL("http:" + s).host !== siteHost; }
      catch { return true; }
    }
    // Absolute http(s)?
    if (/^https?:\/\//i.test(s)) {
      try { return siteHost ? new URL(s).host !== siteHost : true; }
      catch { return true; }
    }
    // Anything else (mailto:, tel:, javascript:, or bare words) -> not external for target purposes
    return false;
  }

  // 2) URL instance or other types coerced to URL
  try {
    const u = href instanceof URL ? href : new URL(String(href));
    const proto = u.protocol.replace(":", "");
    if (proto === "mailto" || proto === "tel") return false;
    if (proto !== "http" && proto !== "https") return false;
    return siteHost ? u.host !== siteHost : true;
  } catch {
    // Coercion failed, treat as internal
    return false;
  }
}

export default function UiLink({
  href,
  children,
  className,
  external,
  prefetch = true,
  scroll,
  target,
  rel,
  nofollow,
  title,
  ...rest
}: UiLinkProps) {
  const host = getEnvHost();
  const isExt = typeof external === "boolean" ? external : isExternal(href, host);

  // Auto aria-label when children aren’t plain text
  const ariaLabel =
    (rest["aria-label"] as string | undefined) ??
    (typeof children === "string" && children.trim().length
      ? undefined
      : title ||
        (() => {
          try {
            const u = new URL(String(href), "http://_base");
            return u.host || u.pathname || "link";
          } catch {
            return "link";
          }
        })());

  const mergedRel = React.useMemo(() => {
    const parts = new Set<string>();
    if (rel) rel.split(" ").forEach((p) => p && parts.add(p));
    if (isExt) {
      parts.add("noopener");
      parts.add("noreferrer");
      if (nofollow) parts.add("nofollow");
    }
    return Array.from(parts).join(" ") || undefined;
  }, [rel, isExt, nofollow]);

  // External = plain <a>; Internal = Next <Link>
  if (isExt) {
    return (
      <a
        {...rest}
        href={String(href)}
        target={target ?? "_blank"}
        rel={mergedRel}
        className={className}
        aria-label={ariaLabel}
        data-ui-link=""       // <-- prose guard
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      {...(rest as any)}
      href={href as any}
      prefetch={prefetch}
      scroll={scroll}
      className={className}
      aria-label={ariaLabel}
      data-ui-link=""         // <-- prose guard
      title={title}
    >
      {children}
    </Link>
  );
}