import Section from '@/components/layout/Section';
import { getLegalCopy } from '@/lib/content/directus-legal-copy';
import { getWebsitePageMetadata } from '@/lib/content/directus-site';
import type { Metadata } from 'next';

const SEO_TITLE = 'SMS Terms and Conditions | SonShine Roofing';
const SEO_DESC = 'Terms and conditions for SMS and MMS communications from SonShine Roofing.';
const CANONICAL = '/sms-terms-and-conditions';

export async function generateMetadata(): Promise<Metadata> {
  return getWebsitePageMetadata({
    title: SEO_TITLE,
    description: SEO_DESC,
    path: CANONICAL,
    image: { url: '/og-default.png', width: 1200, height: 630 },
  });
}

export const revalidate = 86400;

export default async function SmsTermsAndConditionsPage() {
  const legalCopy = await getLegalCopy();

  return (
    <Section>
      <div className="container-edge py-10">
        <div className="prose">
          <h1>SMS Terms and Conditions</h1>
          <div dangerouslySetInnerHTML={{ __html: legalCopy.termsOfUseHtml }} />
        </div>
      </div>
    </Section>
  );
}
