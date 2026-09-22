import 'server-only';
import { deployedEditorial } from './editorial';
import { parseGlossarySlug } from './directus-glossary-policy';
import type { GlossarySummary, GlossaryTerm, GlossarySitemapEntry } from './editorial-types';
export type {
  GlossarySummary,
  GlossaryTerm,
  GlossaryImage,
  GlossarySitemapEntry,
} from './editorial-types';

export async function listGlossaryIndex(limit?: number): Promise<GlossarySummary[]> {
  return deployedEditorial()
    .glossary.slice(0, limit)
    .map((term) => ({ slug: term.slug, title: term.title, excerpt: term.contentPlain }));
}
export async function getGlossaryTerm(slug: string): Promise<GlossaryTerm | null> {
  const parsed = parseGlossarySlug(slug);
  return parsed
    ? (deployedEditorial().glossary.find((term) => term.slug === parsed) ?? null)
    : null;
}
export async function listGlossarySitemapEntries(): Promise<GlossarySitemapEntry[]> {
  return deployedEditorial()
    .glossary.filter((term) => !term.noindex)
    .map((term) => ({ uri: '/roofing-glossary/' + term.slug, modified: term.modified }));
}
