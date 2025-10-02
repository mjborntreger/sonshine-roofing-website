'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

import type { GlossaryItem } from '@/lib/fuzzy';
import { filterContains, suggest } from '@/lib/fuzzy';

export default function GlossaryQuickSearch({ terms }: { terms: GlossaryItem[] }) {
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q); // smoother typing

  const filtered = useMemo(() => {
    if (!dq) return terms.slice(0, 30);
    return filterContains(dq, terms, 50);
  }, [dq, terms]);

  // Fuzzy fallback when no direct matches
  const suggestions = useMemo(() => {
    if (!dq || filtered.length > 0) return [] as GlossaryItem[];
    return suggest(dq, terms, 5);
  }, [dq, terms, filtered.length]);

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-slate-300 bg-white/80 p-4 shadow-sm backdrop-blur md:p-6">
        <div className="flex inline-flex w-full items-start">
          <label htmlFor="glossary-search" className="sr-only">
            Search glossary terms
          </label>
          <Search className="h-6 w-6 mr-4 translate-y-2 text-[--brand-blue]" />
          <input
            id="glossary-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search terms..."
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-[15px] shadow-sm focus:ring-2 focus:ring-[--brand-cyan] focus:outline-none"
            aria-label="Search glossary terms"
          />
        </div>
      </div>

      {/* Only show results UI when user is actively searching */}
      {q ? (
        <div className="mt-3" aria-live="polite">
          {filtered.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filtered.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/roofing-glossary/${t.slug}`}
                    className="block rounded-md border border-slate-400 bg-white px-3 py-2 hover:bg-slate-50"
                  >
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-slate-400 bg-white p-4">
              <p className="text-sm text-slate-700">
                No exact matches for <span className="font-semibold">“{q}”</span>.
              </p>

              {suggestions.length > 0 ? (
                <>
                  <p className="mt-2 text-sm text-slate-600">Did you mean:</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <li key={s.slug}>
                        <Link
                          href={`/roofing-glossary/${s.slug}`}
                          className="inline-flex items-center rounded-full border border-slate-400 bg-white px-3 py-1 text-sm hover:bg-slate-50"
                        >
                          {s.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Try a different spelling.</p>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
