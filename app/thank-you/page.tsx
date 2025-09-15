import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Thank You | SonShine Roofing',
  robots: { index: false, follow: true },
};

export default function ThankYouPage() {
  return (
    <main className="container-edge mx-auto min-h-[60vh] flex items-center justify-center py-16">
      <div className="text-center max-w-xl">
        <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Thank you!</h1>
        <p className="mt-2 text-slate-700">We will be in touch shortly.</p>
        <div className="mt-6">
          <Link href="/" className="btn btn-brand-blue btn-press">
            Return to site home
          </Link>
        </div>
      </div>
    </main>
  );
}

