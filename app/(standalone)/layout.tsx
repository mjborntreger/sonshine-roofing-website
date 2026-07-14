import type { Metadata, Viewport } from 'next';
import { getWebsitePageMetadata } from '@/lib/content/directus-site';

export async function generateMetadata(): Promise<Metadata> {
  return getWebsitePageMetadata({
    title: 'Performance Truck for Sale | ProCharged GMC Sierra Denali',
    description:
      'Real-world 800-wheel-horsepower ProCharged GMC Sierra Denali with 4WD traction, daily drivability, and a fully built 6.2L. Asking $90,000 cash.',
    path: '/truck-for-sale',
    robots: { index: false, follow: false },
  });
}

export const viewport: Viewport = {
  themeColor: [{ color: '#ecfeff' }],
};

export default function StandaloneLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-cyan-50 text-slate-900 antialiased">{children}</div>;
}
