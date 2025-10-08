// app/[slug]/page.tsx
import Image from "next/image";
import Section from "@/components/layout/Section";
import SmartLink from "@/components/SmartLink";
import { getPostBySlug, listPostSlugs, listRecentPostNav } from "@/lib/wp";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import ShareWhatYouThink from "@/components/ShareWhatYouThink";
import TocFromHeadings from "@/components/TocFromHeadings";
import SidebarCta from "@/components/SidebarCta";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { buildArticleMetadata } from "@/lib/seo/meta";
import { JsonLd } from "@/lib/seo/json-ld";
import { blogPostingSchema } from "@/lib/seo/schema";
import { resolveSiteOrigin } from "@/lib/seo/site";

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
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
function decodeEntities(input: string) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, "&");
}
function ensureHeadingIds(html: string) {
  const seen = new Set<string>();
  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_m, lvl, attrs = "", inner) => {
    const level = Number(lvl);
    let attrStr = String(attrs);
    const match = attrStr.match(/\sid=["']([^"']+)["']/i);
    let id = match?.[1] ?? "";
    if (!id) {
      const plain = decodeEntities(stripHtml(String(inner)));
      const base = slugify(plain || `section-${level}`);
      const fallback = `section-${level}`;
      let candidate = base || fallback;
      let i = 2;
      while (candidate && seen.has(candidate)) {
        candidate = `${base || fallback}-${i++}`;
      }
      id = candidate || fallback;
      attrStr = `${attrStr} id="${id}"`;
    }
    if (id) seen.add(id);
    return `<h${level}${attrStr}>${inner}</h${level}>`;
  });
}


async function getBaseUrlFromHeaders() {
  return resolveSiteOrigin(await headers());
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
    data-icon-affordance="right"
  >
    Get started
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-4 w-4 icon-affordance inline ml-2"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  </a>
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
  if (slug.startsWith("_")) notFound();

  // Use unified post fetcher (deduped with page) that now includes RankMath SEO
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const seo = post.seo ?? {};
  const og = seo.openGraph ?? {};
  const ogImage = og.image ?? null;

  const rawExcerpt = stripHtml(sanitizeHtml(post.excerpt || ""));
  const title = (seo.title || og.title || post.title || "Article · SonShine Roofing").trim();
  const description = (seo.description || og.description || rawExcerpt).slice(0, 160);

  // Best-image selection: RankMath OG > featured image > site default
  const ogUrl =
    (ogImage && typeof ogImage.secureUrl === "string" && ogImage.secureUrl) ||
    (ogImage && typeof ogImage.url === "string" && ogImage.url) ||
    post.featuredImage?.url ||
    "/og-default.png";
  const ogWidth = ogImage && typeof ogImage.width === "number" ? ogImage.width : 1200;
  const ogHeight = ogImage && typeof ogImage.height === "number" ? ogImage.height : 630;

  return buildArticleMetadata({
    title,
    description,
    path: `/${slug}`,
    image: { url: ogUrl, width: ogWidth, height: ogHeight },
    publishedTime: post.date ?? undefined,
    modifiedTime: post.modified ?? undefined,
    authors: post.authorName ? [post.authorName] : undefined,
  });
}

// -------- Page --------
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug.startsWith("_")) notFound();
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const origin = await getBaseUrlFromHeaders();
  const shareUrl = `${origin}/${slug}`;
  const dateStr = new Date(post.date).toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const readingMinutes = calcReadingMinutes(post.contentHtml);

  // JSON-LD (BlogPosting) using the same post object
  const descSeo = (post.seo?.description || post.seo?.openGraph?.description || stripHtml(sanitizeHtml(post.excerpt || ""))).slice(0, 160);
  const ogImageJsonLd = post.seo?.openGraph?.image ?? null;
  const ogImgCandidate =
    (ogImageJsonLd && typeof ogImageJsonLd.secureUrl === "string" && ogImageJsonLd.secureUrl) ||
    (ogImageJsonLd && typeof ogImageJsonLd.url === "string" && ogImageJsonLd.url) ||
    post.featuredImage?.url ||
    "/og-default.png";
  const ogImgAbs = ogImgCandidate.startsWith("http") ? ogImgCandidate : `${origin}${ogImgCandidate}`;

  const postSchema = blogPostingSchema({
    headline: post.seo?.title || post.title,
    description: descSeo,
    url: shareUrl,
    image: ogImgAbs,
    datePublished: post.date,
    dateModified: post.modified,
    author: post.authorName ? { "@type": "Person", name: post.authorName } : { "@type": "Organization", name: "SonShine Roofing" },
    publisher: {
      "@type": "Organization",
      name: "SonShine Roofing",
      logo: { "@type": "ImageObject", url: `${origin}/icon.png` },
    },
    origin,
  });

  // Build TOC + decorate + inject CTA (all on the server)
  const safeHtml = sanitizeHtml(post.contentHtml || "");
  const withIds = ensureHeadingIds(safeHtml);
  const withAnchors = decorateExternalAnchors(withIds, new URL(origin).hostname);
  const htmlWithCta = injectCtaAfterNthParagraph(withAnchors, 3);

  // prev/next using lightweight nav list (slug + title + date)
  const all = await listRecentPostNav(200).catch(() => []);
  const idx = all.findIndex((p) => p.slug === slug);
  const prev = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null; // older
  const next = idx > 0 ? all[idx - 1] : null; // newer

  return (
    <Section>
      <JsonLd data={postSchema} />
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
                  className="inline-flex min-w-0 max-w-full items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                >
                  <span className="block max-w-full truncate">{c}</span>
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
            sizes="(max-width: 1600px) 100vw, 1600px"
            width={1600}
            height={900}
            className="h-auto w-full object-cover"
            priority={false}
          />
        </div>
      ) : null}

      {/* Layout: content + TOC */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <TocFromHeadings
          root="#article-root"
          levels={[2, 3]}
          offset={100}
          mobile
        />
        {/* Article (single SSR block to avoid hydration mismatches) */}
        <article
          id="article-root"
          className="prose px-2"
          dangerouslySetInnerHTML={{ __html: htmlWithCta }}
        />

        {/* Sidebar (desktop, sticky) */}
        <aside>
          <div className="sticky top-16 grid grid-cols-1">
            <TocFromHeadings
              root="#article-root"
              levels={[2, 3]}
              offset={100}
            />
            <SidebarCta />
          </div>
        </aside>
      </div>

      {/* Prev / Next */}
      {(prev || next) && (
        <nav className="mt-12 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          {prev ? (
            <SmartLink href={`/${prev.slug}`} className="block rounded-xl p-3 hover:bg-slate-50">
              <div className="text-xs uppercase tracking-wide text-slate-500">Previous</div>
              <div className="mt-1 font-medium text-slate-900">{prev.title}</div>
            </SmartLink>
          ) : (
            <span />
          )}
          {next ? (
            <SmartLink href={`/${next.slug}`} className="block rounded-xl p-3 text-right hover:bg-slate-50">
              <div className="text-xs uppercase tracking-wide text-slate-500">Next</div>
              <div className="mt-1 font-medium text-slate-900">{next.title}</div>
            </SmartLink>
          ) : (
            <span />
          )}
        </nav>
      )}
    </Section>
  );
}
