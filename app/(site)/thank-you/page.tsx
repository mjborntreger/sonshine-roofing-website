import type { Metadata } from 'next';
import { Suspense } from 'react';
import ThankYouClient from '@/components/lead-capture/thank-you/ThankYouClient';
import { getWebsitePageMetadata } from '@/lib/content/directus-site';

export async function generateMetadata(): Promise<Metadata> {
  return getWebsitePageMetadata({
    title: 'Thank You | SonShine Roofing',
    description: 'Thank you for contacting SonShine Roofing.',
    path: '/thank-you',
    robots: { index: false, follow: false },
  });
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouClient />
    </Suspense>
  );
}
