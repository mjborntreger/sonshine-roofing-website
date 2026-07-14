import Section from '@/components/layout/Section';
import { getLegalCopy } from '@/lib/content/directus-legal-copy';
import { getWebsitePageMetadata } from '@/lib/content/directus-site';
import type { Metadata } from 'next';

const SEO_TITLE = 'Privacy Policy | SonShine Roofing';
const SEO_DESC =
  'How SonShine Roofing collects, uses, and protects your information when you visit sonshineroofing.com.';
const CANONICAL = '/privacy-policy';

export async function generateMetadata(): Promise<Metadata> {
  return getWebsitePageMetadata({
    title: SEO_TITLE,
    description: SEO_DESC,
    path: CANONICAL,
    image: { url: '/og-default.png', width: 1200, height: 630 },
  });
}

export const revalidate = 86400;

export default async function PrivacyPolicyPage() {
  const legalCopy = await getLegalCopy();

  return (
    <Section>
      <div className="container-edge py-10">
        <div className="prose">
          <h1>Privacy Policy</h1>
          <div dangerouslySetInnerHTML={{ __html: legalCopy.privacyPolicyHtml }} />
        </div>
      </div>
    </Section>
  );
}
