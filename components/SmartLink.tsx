import * as React from "react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";
import { ExternalLink as ExternalIcon } from 'lucide-react';

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export type SmartLinkProps = Omit<AnchorProps, "href" | "children"> & {
  href: string | URL;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  nofollow?: boolean;
  internalHosts?: string[];
  prefetch?: boolean;
  scroll?: boolean;
  showExternalIcon?: boolean;
  externalIconClassName?: string;
  unstyled?: boolean;
};

function getEnvSiteHost(): string | null {
  const host = (process.env.NEXT_PUBLIC_SITE_HOST || "").trim();
  if (host) return host.toLowerCase();
  const url = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  try { if (url) return new URL(url).hostname.toLowerCase(); } catch {}
  return null;
}
const toStr = (href: string | URL) => (typeof href === "string" ? href : href.toString());
const isAbs = (s: string) => /^([a-z][a-z0-9+.-]*:)?\/\//i.test(s) || /^https?:\/\//i.test(s);
const hostOf = (s: string) => { try { const f = s.startsWith("//") ? "https:"+s : s; return new URL(f).hostname.toLowerCase(); } catch { return null; } };

// ---- deterministic id (no hydration mismatch)
function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(36);
}



const SmartLink = React.forwardRef<HTMLAnchorElement, SmartLinkProps>(function SmartLink(
  {
    href,
    children,
    className,
    external,
    nofollow,
    internalHosts = [],
    prefetch,
    scroll,
    target,
    rel,
    showExternalIcon = false,
    externalIconClassName,
    unstyled = false,
    ...anchorProps
  },
  ref
) {
  const hrefStr = toStr(href);

  const special =
    hrefStr.startsWith("mailto:") ||
    hrefStr.startsWith("tel:") ||
    hrefStr.startsWith("data:") ||
    hrefStr.startsWith("blob:");
  const hasDownload = "download" in anchorProps && anchorProps.download !== undefined;

  const envHost = getEnvSiteHost();
  const hosts = React.useMemo(
    () => (envHost ? Array.from(new Set([envHost, ...internalHosts])) : internalHosts),
    [envHost, internalHosts]
  );

  const isInternal =
    !external &&
    !special &&
    !hasDownload &&
    (hrefStr.startsWith("/") ||
      hrefStr.startsWith("#") ||
      hrefStr.startsWith("./") ||
      hrefStr.startsWith("../") ||
      (isAbs(hrefStr) && !!hostOf(hrefStr) && hosts.includes(hostOf(hrefStr)!)));

  if (isInternal) {
    return (
      <NextLink
        href={hrefStr}
        prefetch={prefetch}
        scroll={scroll}
        className={className}
        ref={ref as any}
        data-unstyled={unstyled ? "" : undefined}
        {...(anchorProps as any)}
      >
        {children}
      </NextLink>
    );
  }

  const openInNewTab = target ? target === "_blank" : true;
  const relParts = new Set<string>([
    ...(rel ? String(rel).split(" ") : []),
    "noopener",
    "noreferrer",
    ...(nofollow ? ["nofollow"] : []),
  ]);

  return (
    <a
      href={hrefStr}
      className={cn("inline-flex items-center group", className)}
      target={openInNewTab ? "_blank" : target}
      rel={Array.from(relParts).join(" ")}
      ref={ref}
      data-unstyled={unstyled ? "" : undefined}
      {...anchorProps}
    >
      {children}
      {showExternalIcon && !special && !hasDownload ? (
        <>
          <ExternalIcon aria-hidden className={cn('ml-1 inline-block size-3 shrink-0', externalIconClassName)} />
          <span className="sr-only"> (opens in a new tab)</span>
        </>
      ) : null}
    </a>
  );
});

export default SmartLink;
