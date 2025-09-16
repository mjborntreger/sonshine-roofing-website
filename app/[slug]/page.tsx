// app/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import Section from "@/components/layout/Section";
import SmartLink from "@/components/SmartLink";
import { headers } from "next/headers";
import { getPostBySlug, listPostSlugs, listRecentPostNav } from "@/lib/wp";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import ShareWhatYouThink from "@/components/ShareWhatYouThink"

export const revalidate = 900;

// -------- Helpers (local) --------
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function sanitizeHtml(html: string) {
  if (!html) return "";
  // Remove script tags (and their contents)
  let out = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  // Strip inline event handlers like onclick, onload, etc.
  out = out.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "");
  // Neutralize javascript: in href/src attributes
  out = out.replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
  // Allow iframes only from approved hosts (YouTube-nocookie and Acculynx)
  out = out.replace(/<iframe[^>]*src=["']([^"']+)["'][^>]*><\/iframe>/gi, (m, src) => {
    try {
      const u = new URL(src, "https://example.com");
      const host = u.hostname.toLowerCase();
      if (host.endsWith("youtube-nocookie.com") || host.endsWith("acculynx.com")) return m;
      return "";
    } catch { return ""; }
  });
  return out;
}
function calcReadingMinutes(html: string, wpm = 225) {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / wpm));
}
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&amp;|&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
function decodeEntities(input: string) {
  return input
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
  .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}
type TocItem = { id: string; text: string; level: 2 | 3 };
function addIdsAndBuildToc(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const out = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_m, lvl, attrs = "", inner) => {
    const level = Number(lvl) as 2 | 3;
    const hasId = /\sid=["'][^"']+["']/.test(attrs);
    const plain = decodeEntities(stripHtml(String(inner)));
    const text = plain
    const id = hasId ? String(attrs.match(/\sid=["']([^"']+)["']/i)?.[1]) : slugify(text || "section");
    if (!toc.find((t) => t.id === id)) toc.push({ id, text, level });
    const attrStr = hasId ? String(attrs) : `${String(attrs)} id="${id}"`;
    return `<h${level}${attrStr}>${inner}</h${level}>`;
  });
  return { html: out, toc };
}

async function getBaseUrlFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

function isExternalHref(href: string, baseHost: string) {
  try {
    if (href.startsWith("/") || href.startsWith("#") || href.startsWith("./") || href.startsWith("../")) return false;
    const fixed = href.startsWith("//") ? "https:" + href : href;
    const u = new URL(fixed);
    return u.hostname.toLowerCase() !== baseHost.toLowerCase();
  } catch {
    return false;
  }
}
function decorateExternalAnchors(html: string, baseHost: string) {
  // Adds target+rel to external anchors, keeps internals untouched
  return html.replace(/<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, (m, pre, href, post) => {
    if (!isExternalHref(href, baseHost)) return m;
    const hasTarget = /\btarget=/.test(pre) || /\btarget=/.test(post);
    const hasRel = /\brel=/.test(pre) || /\brel=/.test(post);
    const target = hasTarget ? "" : ' target="_blank"';
    let rel = "";
    if (!hasRel) rel = ' rel="noopener noreferrer"';
    return `<a${pre}href="${href}"${post}${target}${rel}>`;
  });
}

// Inject CTA after the Nth paragraph (server-side, hydration-safe)
function injectCtaAfterNthParagraph(html: string, n = 3) {
  const btn = buttonVariants({ variant: "brandOrange" }); // add { size: "sm" } if you want

  const cta = `
<div class="my-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
  <span class="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]"></span>
  <h3 class="m-0 text-xl font-semibold text-slate-900">Book a Free Estimate</h3>
  <p class="mt-2 text-slate-600 italic">Since 1987 we’ve got you covered — schedule a fast, no-pressure visit.</p>
  <a
    href="/contact-us/#book-an-appointment"
    data-button="true"
    class="${btn} mt-4 inline-flex items-center no-underline"
  >Get started</a>
</div>
`.trim();

  let count = 0;
  return html.replace(/<\/p>/gi, (m) => (++count === n ? `${m}\n${cta}` : m));
}

// -------- Static params --------
export async function generateStaticParams() {
  const slugs = await listPostSlugs(200).catch(() => []);
  return slugs.map((slug: string) => ({ slug }));
}

// -------- Metadata (SEO) --------
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  // Use unified post fetcher (deduped with page) that now includes RankMath SEO
  const post = await getPostBySlug(slug);
  if (!post) {
    return {
      title: "Post Not Found | SonShine Roofing",
      description: "This article could not be found.",
      alternates: { canonical: `/${slug}` },
    };
  }

  const seo = post.seo ?? {};
  const og = seo.openGraph ?? {};

  const rawExcerpt = stripHtml(sanitizeHtml(post.excerpt || ""));
  const title = (seo.title || og.title || post.title || "Article · SonShine Roofing").trim();
  const description = (seo.description || og.description || rawExcerpt).slice(0, 160);

  // Best-image selection: RankMath OG > featured image > site default
  const rmImg = (og.image || {}) as any;
  const ogUrl: string = rmImg.secureUrl || rmImg.url || post.featuredImage?.url || "/og-default.png";
  const ogWidth: number = rmImg.width || 1200;
  const ogHeight: number = rmImg.height || 630;

  return {
    title,
    description,
    // Relative canonical so metadataBase resolves to production
    alternates: { canonical: `/${slug}` },
    openGraph: {
      type: "article" as const,
      title,
      description,
      images: [{ url: ogUrl, width: ogWidth, height: ogHeight }],
      publishedTime: post.date ?? undefined,
      modifiedTime: post.modified ?? undefined,
      authors: post.authorName ? [post.authorName] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

// -------- Page --------
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return (
      <Section>
        <h1>Post Not Found</h1>
        <p>
          Try our{" "}
          <Link className="text-[#0045d7] underline" href="/blog">
            Blog
          </Link>
          .
        </p>
      </Section>
    );
  }

  const base = await getBaseUrlFromHeaders();
  const shareUrl = `${base}/${slug}`;
  const dateStr = new Date(post.date).toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const readingMinutes = calcReadingMinutes(post.contentHtml);

  // JSON-LD (BlogPosting) using the same post object
  const descSeo = (post.seo?.description || post.seo?.openGraph?.description || stripHtml(sanitizeHtml(post.excerpt || ""))).slice(0, 160);
  const rmImg2 = (post.seo?.openGraph?.image || {}) as any;
  const ogImgAbs = rmImg2.secureUrl || rmImg2.url || post.featuredImage?.url || `${base}/og-default.png`;
  const authorObj = post.authorName ? { "@type": "Person", name: post.authorName } : { "@type": "Organization", name: "SonShine Roofing" };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seo?.title || post.title,
    description: descSeo,
    datePublished: post.date,
    dateModified: post.modified,
    mainEntityOfPage: { "@type": "WebPage", "@id": shareUrl },
    image: ogImgAbs,
    url: shareUrl,
    author: authorObj,
    publisher: {
      "@type": "Organization",
      name: "SonShine Roofing",
      logo: { "@type": "ImageObject", url: `${base}/icon.png` }
    }
  };

  // Build TOC + decorate + inject CTA (all on the server)
  const safeHtml = sanitizeHtml(post.contentHtml || "");
  const { html: withIds, toc } = addIdsAndBuildToc(safeHtml);
  const withAnchors = decorateExternalAnchors(withIds, new URL(base).hostname);
  const htmlWithCta = injectCtaAfterNthParagraph(withAnchors, 3);

  // prev/next using lightweight nav list (slug + title + date)
  const all = await listRecentPostNav(200).catch(() => []);
  const idx = all.findIndex((p) => p.slug === slug);
  const prev = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null; // older
  const next = idx > 0 ? all[idx - 1] : null; // newer

  return (
    <Section>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Back link */}
      <div className="mb-3">
        <SmartLink href="/blog" className="text-sm text-slate-600 no-underline hover:underline">
          ← Back to Blog
        </SmartLink>
      </div>

      {/* Title + gradient stripe */}
      <div className="prose">
        <h1 className="mb-2">{post.title}</h1>
      </div>
      <div className="h-1 w-full rounded-full bg-gradient-to-r from-[#0045d7] to-[#00e3fe]" />

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
        <span>{dateStr}</span>
        <span>•</span>
        <span>{readingMinutes} min read</span>
        {post.categories?.length ? (
          <>
            <span>•</span>
            <div className="flex flex-wrap gap-2">
              {post.categories.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                >
                  {c}
                </span>
              ))}
            </div>
            <ShareWhatYouThink />
          </>
        ) : null}
      </div>

      {/* Featured image */}
      {post.featuredImage?.url ? (
        <div className="mt-5 overflow-hidden rounded-2xl bg-neutral-100">
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.altText || post.title}
            width={1600}
            height={900}
            className="h-auto w-full object-cover"
            priority={false}
          />
        </div>
      ) : null}

      {/* Layout: content + TOC */}
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Article (single SSR block to avoid hydration mismatches) */}
        <article
          className="prose"
          dangerouslySetInnerHTML={{ __html: htmlWithCta }}
        />

        {/* Sidebar (desktop, sticky) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-6">
            {/* TOC */}
            {toc.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 text-sm font-semibold text-slate-900">On this page</div>
                <ul className="space-y-2 text-sm">
                  {toc.map((item) => (
                    <li key={item.id} className={item.level === 3 ? "ml-3" : ""}>
                      <a href={`#${item.id}`} className="text-slate-700 hover:text-[#0045d7]">
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Prev / Next */}
      {(prev || next) && (
        <nav className="mt-12 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          {prev ? (
            <Link href={`/${prev.slug}`} className="block rounded-xl p-3 hover:bg-slate-50">
              <div className="text-xs uppercase tracking-wide text-slate-500">Previous</div>
              <div className="mt-1 font-medium text-slate-900">{prev.title}</div>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/${next.slug}`} className="block rounded-xl p-3 text-right hover:bg-slate-50">
              <div className="text-xs uppercase tracking-wide text-slate-500">Next</div>
              <div className="mt-1 font-medium text-slate-900">{next.title}</div>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </Section>
  );
}
