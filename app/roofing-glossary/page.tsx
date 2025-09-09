import Section from '@/components/layout/Section';
import Link from 'next/link';
import { listGlossaryIndex } from '@/lib/wp';
import GlossaryQuickSearch from './GlossaryQuickSearch';
import ResourcesAside from '@/components/ResourcesAside';

export const revalidate = 86400; // daily ISR

export default async function GlossaryArchivePage() {
  const terms = await listGlossaryIndex(500);

  // Group by first letter (A-Z, then # for non-letters)
  const groups = new Map<string, { title: string; slug: string }[]>();
  for (const t of terms) {
    const letter = /^[A-Za-z]/.test(t.title) ? t.title[0].toUpperCase() : '#';
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(t);
  }
  const letters = Array.from(groups.keys()).sort((a, b) =>
    a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b),
  );

  return (
    <Section>
      <div className="container-edge py-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] overflow-visible items-start">
        <span id="page-top" className="sr-only" />

          {/* LEFT: main content */}
          <div>
            <h1 className="text-3xl font-semibold">Roofing Glossary</h1>
            <p className="mt-2 text-slate-600">
              Clear, plain-English definitions for common (and not-so-common) roofing terms.
            </p>

            <GlossaryQuickSearch terms={terms} />

            {/* A–Z nav */}
            <nav className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="Glossary letters">
              {letters.map((l) => (
                <a
                  key={l}
                  href={`#glossary-${l === '#' ? 'num' : l}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white hover:bg-slate-50"
                >
                  {l}
                </a>
              ))}
            </nav>

            <div className="mt-8 space-y-10">
              {letters.map((l) => {
                const list = groups.get(l)!;
                const anchor = l === '#' ? 'num' : l;
                return (
                  <section key={l} id={`glossary-${anchor}`}>
                    <h2 className="text-xl font-semibold">{l === '#' ? '0–9' : l}</h2>
                    <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {list.map((t) => (
                        <li key={t.slug}>
                          <Link
                            href={`/roofing-glossary/${t.slug}`}
                            className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 hover:bg-slate-50"
                          >
                            {t.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
            <div className="mt-6">
              <a href="#page-top" className="text-sm text-slate-600 prose">Back to top ↑</a>
            </div>
          </div>

          {/* RIGHT: floating aside on desktop */}
          <ResourcesAside />

        </div>
      </div>
    </Section>
  );
}