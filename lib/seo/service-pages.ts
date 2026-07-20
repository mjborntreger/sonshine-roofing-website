import type { OgImageInput } from './meta';

export type ServicePageConfig = {
  title: string;
  description: string;
  image?: OgImageInput;
  breadcrumbs?: Array<{ name: string; path: string }>;
};

export const SERVICE_PAGE_CONFIG: Record<string, ServicePageConfig> = {
  '/roof-repair': {
    title: 'Roof Repair in Sarasota, Manatee & Charlotte Counties | SonShine Roofing',
    description:
      'FREE ESTIMATES | Fast, lasting roof repair for leaks, flashing, fascia and storm damage | Serving Sarasota & surrounding areas since 1987.',
    image: {
      url: 'https://wp.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png',
      width: 1200,
      height: 630,
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Roof Repair', path: '/roof-repair' },
    ],
  },
  '/roof-replacement-sarasota-fl': {
    title: 'Roof Replacement in Sarasota, Manatee & Charlotte Counties | SonShine Roofing',
    description:
      'FREE ESTIMATES | Since 1987, SonShine Roofing has installed long‑lasting shingle, tile, flat and metal roofs with strong workmanship warranties & industry-leading financing.',
    image: {
      url: 'https://wp.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png',
      width: 1200,
      height: 630,
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Roof Replacement', path: '/roof-replacement-sarasota-fl' },
    ],
  },
  '/financing': {
    title: 'Roof Financing | SonShine Roofing',
    description:
      'Get approved today! | 0% APR for 12 mo. | Credit-based & Equity-based | Easy, convenient financing options for your next roof',
    image: {
      url: 'https://wp.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png',
      width: 1200,
      height: 630,
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Financing', path: '/financing' },
    ],
  },
  '/roof-maintenance': {
    title: 'Roof Maintenance in Sarasota, Manatee & Charlotte Counties | SonShine Roofing',
    description:
      'Prevent leaks, catch issues early, and extend roof life with scheduled inspections and upkeep. Serving Southwest Florida since 1987.',
    image: {
      url: 'https://wp.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png',
      width: 1200,
      height: 630,
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Roof Maintenance', path: '/roof-maintenance' },
    ],
  },
  '/roof-inspection': {
    title: 'Roof Inspection in Sarasota, Manatee & Charlotte Counties | SonShine Roofing',
    description:
      'Licensed residential roof inspections to catch hidden leaks and extend roof life. Serving Sarasota and surrounding areas since 1987.',
    image: {
      url: 'https://wp.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png',
      width: 1200,
      height: 630,
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Roof Inspection', path: '/roof-inspection' },
    ],
  },
  '/about-sonshine-roofing': {
    title: 'About SonShine Roofing | Sarasota Roofing Company',
    description:
      'Family-owned roofing contractor in Sarasota serving Sarasota, Manatee, and Charlotte Counties since 1987. Meet the team, our values, and what sets us apart.',
    image: {
      url: 'https://wp.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png',
      width: 1200,
      height: 630,
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'About SonShine Roofing', path: '/about-sonshine-roofing' },
    ],
  },
  '/homeowner-referral-program': {
    title: 'Homeowner Referral Program | SonShine Roofing',
    description:
      'Learn who can refer SonShine Roofing, what projects qualify, and how to earn $250 per qualified full roof replacement referral.',
    image: {
      url: 'https://wp.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png',
      width: 1200,
      height: 630,
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Homeowner Referral Program', path: '/homeowner-referral-program' },
    ],
  },
  '/contact-us': {
    title: 'Contact SonShine Roofing | Sarasota Roofing Company',
    description:
      'Call or send a message — our team responds quickly during business hours. Serving Sarasota, Manatee & Charlotte Counties since 1987.',
    image: {
      url: 'https://wp.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png',
      width: 1200,
      height: 630,
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Contact', path: '/contact-us' },
    ],
  },
};

export function getServicePageConfig(path: string): ServicePageConfig | null {
  return SERVICE_PAGE_CONFIG[path] ?? null;
}
