import { Suspense } from 'react';
import TellUsWhyForm from '@/components/lead-capture/feedback/TellUsWhyForm';
import type { Metadata } from 'next';
import { getWebsitePageMetadata } from '@/lib/content/directus-site';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  return getWebsitePageMetadata({
    title: 'Tell Us Why | SonShine Roofing',
    description:
      'Share feedback with SonShine Roofing so our team can understand what went wrong and follow up.',
    path: '/tell-us-why',
    robots: { index: false, follow: false },
  });
}

export default function TellUsWhyPage() {
  return (
    <Suspense
      fallback={
        <main className="container-edge mx-auto max-w-2xl py-10">
          <h1 className="text-3xl font-semibold">Tell us what went wrong</h1>
          <p className="mt-2 text-slate-700">Loading…</p>
        </main>
      }
    >
      <TellUsWhyForm />
    </Suspense>
  );
}
