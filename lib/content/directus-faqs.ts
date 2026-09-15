import { deployedLocations } from './locations';

export type FaqWebsitePage = { id: string; path: string; navLabel: string };
export type FaqService = FaqWebsitePage;
export type DirectusFaq = {
  id: string;
  title: string;
  contentHtml: string;
  websitePage: FaqWebsitePage | null;
  service: FaqService | null;
  serviceArea: FaqWebsitePage | null;
  sortOrder: number;
};
export type DirectusFaqGroup = { key: string; title: string; path: string | null; items: DirectusFaq[] };

const compare = (left: DirectusFaq, right: DirectusFaq) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id);
export async function listFaqs({ pagePath, serviceSlug, serviceAreaSlug, limit = 8 }: { pagePath?: string; serviceSlug?: string; serviceAreaSlug?: string; limit?: number } = {}): Promise<DirectusFaq[]> {
  const normalizedPath = pagePath?.replace(/\/+$/u, '') || (pagePath ? '/' : undefined);
  const isSpecific = (faq: DirectusFaq) => Boolean((normalizedPath && faq.websitePage?.path === normalizedPath) || (serviceSlug && faq.service?.path === `/${serviceSlug}`) || (serviceAreaSlug && faq.serviceArea?.path === `/locations/${serviceAreaSlug}`));
  return deployedLocations().faqs.filter(faq => isSpecific(faq) || (!faq.websitePage && !faq.service && !faq.serviceArea))
    .sort((a,b) => Number(isSpecific(b)) - Number(isSpecific(a)) || compare(a,b)).slice(0, Math.max(0, limit));
}
export async function listAllFaqs(limit = 500): Promise<DirectusFaq[]> { return deployedLocations().faqs.slice(0, Math.max(0, limit)); }

export function groupFaqsForArchive(faqs: DirectusFaq[]): DirectusFaqGroup[] {
  const groups = new Map<string, DirectusFaqGroup>();
  for (const faq of faqs) {
    if ([faq.websitePage, faq.service, faq.serviceArea].filter(Boolean).length > 1) throw new Error('FAQ scopes must be exclusive.');
    const owner = faq.websitePage ?? faq.service ?? faq.serviceArea;
    const prefix = faq.websitePage ? 'page' : faq.service ? 'service' : faq.serviceArea ? 'area' : 'global';
    const key = owner ? `${prefix}:${owner.id}` : 'global';
    const group = groups.get(key) ?? { key, title: owner?.navLabel ?? 'General', path: owner?.path ?? null, items: [] };
    group.items.push(faq);
    groups.set(key, group);
  }
  return [...groups.values()].map(group => ({ ...group, items: [...group.items].sort(compare) })).sort((a,b) => a.key === 'global' ? -1 : b.key === 'global' ? 1 : a.title.localeCompare(b.title) || a.key.localeCompare(b.key));
}
