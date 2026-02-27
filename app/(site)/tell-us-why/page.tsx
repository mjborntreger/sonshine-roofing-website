import { Suspense } from 'react';
import TellUsWhyForm from '@/components/lead-capture/feedback/TellUsWhyForm';

export const dynamic = 'force-static';

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
