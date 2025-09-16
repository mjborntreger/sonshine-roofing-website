export const routes = [
  { href: "/", label: "Home" },
  { href: "/about-sonshine-roofing", label: "About" },

  // Core services
  { href: "/roof-replacement-sarasota-fl", label: "Roof Replacement" },
  { href: "/roof-repair", label: "Roof Repair" },
  { href: "/roof-inspection", label: "Roof Inspection" },
  { href: "/roof-maintenance", label: "Roof Maintenance" },

  // Resources
  { href: "/project", label: "Project Gallery" },
  { href: "/video-library", label: "Video Library" },
  { href: "/blog", label: "Blog" },
  { href: "/roofing-glossary", label: "Roofing Glossary" },
  { href: "/faq", label: "FAQ" },
  { href: "/financing", label: "Financing" },

  // Contact & legal
  { href: "/contact-us", label: "Contact Us" },
  { href: "/privacy-policy", label: "Privacy Policy" },

  // Miscellaneous (developer/internal)
  // (design-system removed)

  // Additional pages that exist but are not typically navigational
  { href: "/reviews", label: "Reviews" },
  { href: "/tell-us-why", label: "Tell Us Why" },
] as const;

// Typed route constants for shared navigation
import type { Route } from 'next';

export const ROUTES = {
  home: '/' as Route,
  about: '/about-sonshine-roofing' as Route,
  roofReplacement: '/roof-replacement-sarasota-fl' as Route,
  roofRepair: '/roof-repair' as Route,
  roofInspection: '/roof-inspection' as Route,
  roofMaintenance: '/roof-maintenance' as Route,
  project: '/project' as Route,
  videoLibrary: '/video-library' as Route,
  blog: '/blog' as Route,
  roofingGlossary: '/roofing-glossary' as Route,
  faq: '/faq' as Route,
  financing: '/financing' as Route,
  contact: '/contact-us' as Route,
  privacyPolicy: '/privacy-policy' as Route,
  sitemapIndex: '/sitemap_index' as Route,
  // additional pages that exist but are not typically in primary nav
  reviews: '/reviews' as Route,
  tellUsWhy: '/tell-us-why' as Route,
} as const;

export type NavItem = { label: string; href?: Route; children?: NavItem[] };

export const NAV_MAIN: ReadonlyArray<NavItem> = [
  { label: 'About', href: ROUTES.about },
  {
    label: 'Roofing Services',
    children: [
      { label: 'Roof Replacement', href: ROUTES.roofReplacement },
      { label: 'Roof Repair', href: ROUTES.roofRepair },
      { label: 'Roof Inspection', href: ROUTES.roofInspection },
      { label: 'Roof Maintenance', href: ROUTES.roofMaintenance },
    ],
  },
  {
    label: 'Resources',
    children: [
      { label: 'Project Gallery', href: ROUTES.project },
      { label: 'Financing', href: ROUTES.financing },
      { label: 'Video Library', href: ROUTES.videoLibrary },
      { label: 'Blog', href: ROUTES.blog },
      { label: 'Roofing Glossary', href: ROUTES.roofingGlossary },
      { label: 'FAQ', href: ROUTES.faq },
    ],
  },
];

export const NAV_COMPANY: ReadonlyArray<{ label: string; href: Route }> = [
  { label: 'Home', href: ROUTES.home },
  { label: 'About', href: ROUTES.about },
  { label: 'Contact', href: ROUTES.contact },
];

export const NAV_SERVICES: ReadonlyArray<{ label: string; href: Route }> = [
  { label: 'Roof Replacement', href: ROUTES.roofReplacement },
  { label: 'Roof Repair', href: ROUTES.roofRepair },
  { label: 'Roof Inspection', href: ROUTES.roofInspection },
  { label: 'Roof Maintenance', href: ROUTES.roofMaintenance },
];

export const NAV_RESOURCES: ReadonlyArray<{ label: string; href: Route }> = [
  { label: 'Project Gallery', href: ROUTES.project },
  { label: 'Financing', href: ROUTES.financing },
  { label: 'Video Library', href: ROUTES.videoLibrary },
  { label: 'Roofing Glossary', href: ROUTES.roofingGlossary },
  { label: 'Blog', href: ROUTES.blog },
  { label: 'FAQ', href: ROUTES.faq },
];
