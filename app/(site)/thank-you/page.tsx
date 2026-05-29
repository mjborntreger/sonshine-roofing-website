import type { Metadata } from 'next';
import { Suspense } from 'react';
import ThankYouClient from '@/components/lead-capture/thank-you/ThankYouClient';

export const metadata: Metadata = {
  title: 'Thank You | SonShine Roofing',
  description: 'Thank you for contacting SonShine Roofing.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/thank-you',
  },
};

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouClient />
    </Suspense>
  );
}
