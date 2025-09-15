import Section from '@/components/layout/Section';
import Link from 'next/link';
import { getGlossaryTerm, listGlossaryIndex, stripHtml } from '@/lib/wp';
import { suggest } from '@/lib/fuzzy';
import type { Metadata } from 'next';

// Escapes a string for safe use inside a RegExp
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Auto-link occurrences of glossary terms in an HTML string.
 * - Skips the current term
 * - Avoids replacing inside <a>, <code>, or <pre>
 * - Links the first occurrence of each term (longest titles matched first)
 * - Word-boundary aware (letters/digits/underscore/hyphen)
 */
function autoLinkGlossary(
  html: string,
  index: { slug: string; title: string }[],
  currentSlug: string
): string {
  if (!html || !Array.isArray(index)) return html;

  // Build candidate list (exclude current term)
  const candidates = index
    .filter((t) => t && t.slug !== currentSlug && t.title)
    // Sort longest first so multi-word terms win before single words
    .sort((a, b) => b.title.length - a.title.length);

  if (!candidates.length) return html;

  // Build quick lookup by lowercase title for replacement callback
  const byTitle = new Map<string, string>(); // titleLower -> slug
  for (const t of candidates) byTitle.set(t.title.toLowerCase(), t.slug);

  // Build a single alternation regex of escaped titles
  // Use custom word boundaries to avoid partial matches (allow hyphens)
  const pattern = candidates
    .map((t) => escapeRegExp(t.title))
    .join("|");
  if (!pattern) return html;
  const re = new RegExp(
    `(?<![\\w-])(${pattern})(?![\\w-])`,
    "gi"
  );

  // Tokenize by tags so we only replace in text nodes, and track when inside <a>, <code>, <pre>
  const tokens = html.split(/(<[^>]+>)/g);
  let inAnchor = false;
  let inCodeLike = false;
  const linkedOnce = new Set<string>(); // slug -> linked?
  let linkBudget = 40; // avoid overlinking

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;

    if (tok.startsWith("<")) {
      const isOpenA = /^<a\b/i.test(tok);
      const isCloseA = /^<\/a\b/i.test(tok);
      const isOpenCode = /^<(code|pre)\b/i.test(tok);
      const isCloseCode = /^<\/(code|pre)\b/i.test(tok);
      if (isOpenA) inAnchor = true;
      else if (isCloseA) inAnchor = false;
      if (isOpenCode) inCodeLike = true;
      else if (isCloseCode) inCodeLike = false;
      continue; // tags unchanged
    }

    // Text node
    if (!inAnchor && !inCodeLike && linkBudget > 0) {
      tokens[i] = tok.replace(re, (match) => {
        if (linkBudget <= 0) return match;
        const key = match.toLowerCase();
        const slug = byTitle.get(key);
        if (!slug || linkedOnce.has(slug)) return match;
        linkedOnce.add(slug);
        linkBudget--;
        return `<a href="/roofing-glossary/${slug}" class="underline decoration-dotted hover:decoration-solid">${match}</a>`;
      });
    }
  }

  return tokens.join("");
}

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  // Defaults if a term is missing (EDIT if you want different fallbacks)
  const fallbackTitle = 'Roofing Glossary | SonShine Roofing';
  const fallbackDesc = 'Plain-English definitions of common roofing terms used across Sarasota, Manatee, and Charlotte Counties.';

  const { slug } = await params;
  try {
    const term = await getGlossaryTerm(slug);
    if (!term) {
      return {
        title: fallbackTitle,
        description: fallbackDesc,
        alternates: { canonical: '/roofing-glossary' },
        robots: { index: false, follow: true },
        openGraph: {
          type: 'article',
          title: fallbackTitle,
          description: fallbackDesc,
          url: '/roofing-glossary',
          images: [{ url: '/og-default.png', width: 1200, height: 630 }],
        },
        twitter: {
          card: 'summary_large_image',
          title: fallbackTitle,
          description: fallbackDesc,
          images: ['/og-default.png'],
        },
      };
    }

    const title = `${term.title} | Roofing Glossary`;
    const description = stripHtml(term.contentHtml || '').slice(0, 160);

    return {
      title,
      description,
      alternates: { canonical: `/roofing-glossary/${term.slug}` },
      robots: { index: false, follow: true },
      openGraph: {
        type: 'article',
        title,
        description,
        url: `/roofing-glossary/${term.slug}`,
        images: [{ url: '/og-default.png', width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/og-default.png'],
      },
    };
  } catch {
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      alternates: { canonical: '/roofing-glossary' },
      robots: { index: false, follow: true },
      openGraph: {
        type: 'article',
        title: fallbackTitle,
        description: fallbackDesc,
        url: '/roofing-glossary',
        images: [{ url: '/og-default.png', width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: fallbackTitle,
        description: fallbackDesc,
        images: ['/og-default.png'],
      },
    };
  }
}

// (Optional) Prebuild many static pages:
export async function generateStaticParams() {
  const index = await listGlossaryIndex(1000).catch(() => []);
  return index.map((t) => ({ slug: t.slug }));
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [index, term] = await Promise.all([
    listGlossaryIndex(1000).catch(() => []),
    getGlossaryTerm(slug),
  ]);

  // If not found, show a friendly suggestion list ("Did you mean …")
  if (!term) {
    const q = slug || '';
    const scored = suggest(q, index, 5).map((t) => ({ t }));

    return (
      <Section>
        <div className="container-edge py-12">
          <nav className="mb-6 text-sm text-slate-600">
            <Link href="/roofing-glossary" className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">← Back to Glossary</Link>
          </nav>

          <h1 className="text-2xl font-semibold">We couldn’t find that term</h1>
          <p className="mt-2 text-slate-700">
            No glossary entry for <span className="font-semibold">“{decodeURIComponent(q)}”</span>.
          </p>

          {scored.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-slate-600">Did you mean:</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {scored.map(({ t }) => (
                  <li key={t.slug}>
                    <Link
                      href={`/roofing-glossary/${t.slug}`}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm hover:bg-slate-50"
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>
    );
  }

  // Compute prev/next from the index
  const pos = index.findIndex((t) => t.slug === slug);
  const hasPos = pos >= 0;
  const prev = hasPos && pos > 0 ? index[pos - 1] : hasPos ? index[index.length - 1] : null;
  const next = hasPos && pos < index.length - 1 ? index[pos + 1] : hasPos ? index[0] : null;

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sonshineroofing.com';
  const termUrl = `${base}/roofing-glossary/${term.slug}`;
  const definedTermLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.title,
    description: stripHtml(term.contentHtml || '').slice(0, 300),
    url: termUrl,
    inDefinedTermSet: `${base}/roofing-glossary`,
  } as const;
  const breadcrumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${base}/` },
      { '@type': 'ListItem', position: 2, name: 'Roofing Glossary', item: `${base}/roofing-glossary` },
      { '@type': 'ListItem', position: 3, name: term.title, item: termUrl },
    ],
  } as const;

  return (
    <Section>
      <div className="container-edge py-8">
        <nav className="mb-4 text-sm text-slate-600">
          <Link href="/roofing-glossary" className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">← Back to Glossary</Link>
        </nav>

        <article className="prose max-w-none">
          <h1>{term.title}</h1>
          {/* JSON-LD: DefinedTerm + Breadcrumbs */}
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermLd) }}
          />
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
          />
          {/* definition body from WordPress */}
          <div
            dangerouslySetInnerHTML={{
              __html: autoLinkGlossary(term.contentHtml, index, term.slug),
            }}
          />
        </article>

        {/* Prev / Next navigation */}
        {hasPos && (
          <nav className="mt-10 flex items-center justify-between gap-4" aria-label="Term navigation">
            {prev ? (
              <Link
                href={`/roofing-glossary/${prev.slug}`}
                rel="prev"
                className="group inline-flex max-w-[48%] items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                aria-label={`Previous term: ${prev.title}`}
              >
                <span aria-hidden>←</span>
                <span className="truncate">{prev.title}</span>
              </Link>
            ) : <span />}

            {next ? (
              <Link
                href={`/roofing-glossary/${next.slug}`}
                rel="next"
                className="group inline-flex max-w-[48%] items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                aria-label={`Next term: ${next.title}`}
              >
                <span className="truncate">{next.title}</span>
                <span aria-hidden>→</span>
              </Link>
            ) : <span />}
          </nav>
        )}
      </div>
    </Section>
  );
}
