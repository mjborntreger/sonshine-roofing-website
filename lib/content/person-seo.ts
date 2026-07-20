import type { WpImage } from '@/lib/content/wp';

export type PersonSeo = {
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image: WpImage | null;
};

export type PersonSeoSource = {
  title: string;
  positionTitle: string | null;
  contentPlain: string;
  featuredImage: WpImage | null;
};

function truncateSeoText(value: string, limit = 160): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  const candidate = text.slice(0, limit);
  const lastSpace = candidate.lastIndexOf(' ');
  const cutAt = lastSpace > 100 ? lastSpace : limit - 1;
  return `${candidate.slice(0, cutAt).replace(/[,:;\s]+$/, '')}…`;
}

export function calculatePersonSeo(person: PersonSeoSource): PersonSeo {
  const role = person.positionTitle ? `, ${person.positionTitle}` : '';
  const metaTitle = `${person.title}${role} | SonShine Roofing`;
  const biographyIsPlaceholder = /^description coming soon[.!]?$/i.test(person.contentPlain.trim());
  const fallbackDescription = person.positionTitle
    ? `Meet ${person.title}, ${person.positionTitle} at SonShine Roofing, serving Sarasota, Manatee, and Charlotte Counties.`
    : `Meet ${person.title} of SonShine Roofing, serving Sarasota, Manatee, and Charlotte Counties.`;
  const metaDescription = truncateSeoText(
    biographyIsPlaceholder ? fallbackDescription : person.contentPlain,
  );

  return {
    meta_title: metaTitle,
    meta_description: metaDescription,
    og_title: metaTitle,
    og_description: metaDescription,
    og_image: person.featuredImage,
  };
}
