import * as React from "react";
import NextLink from "next/link";
import type { Route } from "next";
import type { UrlObject } from "url";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;
type NextLinkProps = Parameters<typeof NextLink>[0];

type NextRoutingProps = Partial<
  Pick<NextLinkProps, "prefetch" | "replace" | "scroll" | "shallow" | "locale">
>;

type SmartHref = string | Route | URL | UrlObject;

export type SmartLinkProps = Omit<AnchorProps, "href" | "children"> &
  NextRoutingProps & {
    href: SmartHref;
    children?: React.ReactNode;
    external?: boolean;
    nofollow?: boolean;
    internalHosts?: string[];
    openInNewTab?: boolean;
    showExternalIcon?: boolean;
    externalIconClassName?: string;
    unstyled?: boolean;
    proseGuard?: boolean;
  };

function getEnvSiteHost(): string | null {
  const host = (process.env.NEXT_PUBLIC_SITE_HOST || "").trim();
  if (host) return host.toLowerCase();
  const url = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  try {
    if (url) return new URL(url).hostname.toLowerCase();
  } catch {}
  return null;
}

function isUrlObjectCandidate(value: unknown): value is UrlObject {
  if (!value || typeof value !== "object") return false;
  if (value instanceof URL) return false;
  return "pathname" in value || "protocol" in value || "host" in value || "query" in value;
}

function formatUrlObject(input: UrlObject): string {
  if (input.href) return input.href;

  const protocol = input.protocol ? input.protocol.replace(/:?$/, ":") : "";
  const auth = input.auth ? `${input.auth}@` : "";
  const hostname = input.hostname || "";
  const port = input.port ? `:${input.port}` : "";
  const host = input.host || (hostname ? `${hostname}${port}` : "");
  const origin = host ? `${protocol || "https:"}//${auth}${host}` : "";
  const pathname = input.pathname || "";

  let search = input.search || "";
  if (!search && input.query && typeof input.query === "object") {
    const params = new URLSearchParams();
    for (const [key, raw] of Object.entries(input.query)) {
      if (raw === undefined || raw === null) continue;
      if (Array.isArray(raw)) {
        raw.forEach((value) => params.append(key, String(value)));
      } else {
        params.append(key, String(raw));
      }
    }
    const qs = params.toString();
    if (qs) search = `?${qs}`;
  }

  const hash = input.hash || "";
  return `${origin}${pathname}${search}${hash}` || "";
}

function hrefToString(href: SmartHref): string {
  if (typeof href === "string") return href;
  if (href instanceof URL) return href.toString();
  return formatUrlObject(href);
}

function hostOf(href: string): string | null {
  try {
    const normalized = href.startsWith("//") ? `https:${href}` : href;
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isHttpLike(href: string): boolean {
  return /^https?:\/\//i.test(href) || href.startsWith("//");
}

function isSpecialScheme(href: string): boolean {
  return ["mailto:", "tel:", "sms:", "data:", "blob:", "javascript:"].some((scheme) =>
    href.toLowerCase().startsWith(scheme)
  );
}

function ensureArray<T>(values: T[] | undefined | null): T[] {
  return Array.isArray(values) ? values : [];
}

const SmartLink = React.forwardRef<HTMLAnchorElement, SmartLinkProps>(function SmartLink(
  {
    href,
    children,
    className,
    external,
    nofollow,
    internalHosts,
    prefetch,
    replace,
    scroll,
    shallow,
    locale,
    openInNewTab,
    showExternalIcon = false,
    externalIconClassName,
    unstyled = false,
    proseGuard = false,
    ...rest
  },
  ref
) {
  const { rel, target, title, ...anchorProps } = rest;
  const hrefStr = React.useMemo(() => hrefToString(href), [href]);

  const special = hrefStr ? isSpecialScheme(hrefStr) : false;
  const hasDownload = "download" in anchorProps && anchorProps.download !== undefined;

  const envHost = getEnvSiteHost();
  const hostList = React.useMemo(() => {
    const hosts = ensureArray(internalHosts);
    const combined = envHost ? Array.from(new Set([envHost, ...hosts])) : hosts;
    return combined.map((h) => h.toLowerCase().split(":")[0]);
  }, [envHost, internalHosts]);

  const inferredExternal = React.useMemo(() => {
    if (typeof external === "boolean") return external;
    if (!hrefStr) return false;
    if (special || hasDownload) return false;

    if (isUrlObjectCandidate(href)) {
      const candidateHost = (href.host || href.hostname || "").toLowerCase();
      const normalizedHost = candidateHost.split(":")[0];
      if (!candidateHost) return false;
      if (!hostList.length) return true;
      return !hostList.includes(normalizedHost);
    }

    if (hrefStr.startsWith("#") || hrefStr.startsWith("/") || hrefStr.startsWith("./") || hrefStr.startsWith("../")) {
      return false;
    }

    if (isHttpLike(hrefStr)) {
      const host = hostOf(hrefStr);
      if (!host) return true;
      if (!hostList.length) return true;
      return !hostList.includes(host);
    }

    return false;
  }, [external, href, hrefStr, special, hasDownload, hostList]);

  const useNextLink = !special && !hasDownload && !inferredExternal;
  const nextHref = React.useMemo<NextLinkProps["href"]>(() => {
    if (href instanceof URL) return href.toString();
    return href as NextLinkProps["href"];
  }, [href]);

  const explicitAria = anchorProps["aria-label"] as string | undefined;
  const ariaLabel = React.useMemo(() => {
    if (explicitAria) return explicitAria;
    if (typeof children === "string" && children.trim().length) return undefined;
    if (title) return title;
    if (hrefStr) {
      try {
        const u = new URL(hrefStr, "http://local");
        if (u.hostname) return u.hostname;
        if (u.pathname && u.pathname !== "/") return u.pathname;
      } catch {}
    }
    return "link";
  }, [explicitAria, children, title, hrefStr]);

  const resolvedTarget = useNextLink
    ? target
    : target ?? (inferredExternal ? ((openInNewTab ?? true) ? "_blank" : undefined) : undefined);

  const relParts = React.useMemo(() => {
    const parts = new Set<string>();
    if (rel) String(rel).split(" ").forEach((part) => part && parts.add(part));
    if (!useNextLink && (resolvedTarget === "_blank" || inferredExternal)) {
      parts.add("noopener");
      parts.add("noreferrer");
      if (nofollow) parts.add("nofollow");
    } else if (nofollow) {
      parts.add("nofollow");
    }
    return Array.from(parts).join(" ") || undefined;
  }, [rel, useNextLink, resolvedTarget, inferredExternal, nofollow]);

  const dataAttrs = {
    ...(proseGuard ? { "data-ui-link": "" } : {}),
    ...(unstyled ? { "data-unstyled": "" } : {}),
  } as Record<string, string | undefined>;

  const mergedClassName = useNextLink
    ? className
    : cn(!unstyled && "inline-flex items-center group", className);

  if (useNextLink) {
    return (
      <NextLink
        href={nextHref}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        shallow={shallow}
        locale={locale}
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={className}
        title={title}
        rel={relParts}
        target={target}
        {...(proseGuard ? { "data-ui-link": "" } : {})}
        {...(unstyled ? { "data-unstyled": "" } : {})}
        {...(ariaLabel && !explicitAria ? { "aria-label": ariaLabel } : {})}
        {...(anchorProps as Record<string, unknown>)}
      >
        {children}
      </NextLink>
    );
  }

  return (
    <a
      {...anchorProps}
      href={hrefStr || undefined}
      className={mergedClassName ?? undefined}
      title={title}
      rel={relParts}
      target={resolvedTarget}
      ref={ref}
      {...dataAttrs}
      {...(!explicitAria && ariaLabel ? { "aria-label": ariaLabel } : {})}
    >
      {children}
      {showExternalIcon && !special && !hasDownload ? (
        <>
          <ArrowUpRight
            aria-hidden
            className={cn(
              "ml-1 inline-block size-3 shrink-0 icon-affordance",
              externalIconClassName
            )}
          />
          <span className="sr-only">(opens in a new tab)</span>
        </>
      ) : null}
    </a>
  );
});

SmartLink.displayName = "SmartLink";

export default SmartLink;
