import type { OgImageInput } from "./meta";

export type ServicePageConfig = {
  title: string;
  description: string;
  keywords?: string[];
  image?: OgImageInput;
  breadcrumbs?: Array<{ name: string; path: string }>;
};

export const SERVICE_PAGE_CONFIG: Record<string, ServicePageConfig> = {
  "/roof-repair": {
    title: "Roof Repair in Sarasota, Manatee & Charlotte Counties | SonShine Roofing",
    description:
      "FREE ESTIMATES | (941) 866-4320 | Fast, lasting roof repair for leaks, flashing, fascia and storm damage | Serving Sarasota & surrounding areas since 1987.",
    keywords: [
      "roof repair",
      "roof repair near me",
      "roof repair service",
      "reliable roof repair",
      "leak repair",
      "roof leak",
      "rotting fascia",
      "curling shingles",
      "roof insect damage",
      "roof water damage",
      "damaged flashings",
      "repair vs. replace",
      "algae",
      "mold",
      "flashing repair",
      "fascia repair",
      "shingle repair",
      "metal roof repair",
      "tile roof repair",
      "Sarasota roof repair",
      "North Port roof repair",
      "Venice roof repair",
      "Bradenton roof repair",
      "Port Charlotte roof repair",
      "Nokomis roof repair",
      "Gulf Gate roof repair",
    ],
    image: { url: "https://next.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png", width: 1200, height: 630 },
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Roof Repair", path: "/roof-repair" },
    ],
  },
  "/roof-replacement-sarasota-fl": {
    title: "Roof Replacement in Sarasota, Manatee & Charlotte Counties | SonShine Roofing",
    description:
      "FREE ESTIMATES | (941) 866-4320 | Since 1987, SonShine Roofing has installed long‑lasting shingle, tile, flat and metal roofs with strong workmanship warranties & industry-leading financing.",
    keywords: [
      "roof replacement",
      "new roof",
      "re-roof",
      "reroof",
      "what warranties come with a new roof",
      "what to expect",
      "shingle roof replacement",
      "tile roof replacement",
      "metal roof replacement",
      "repair vs. replace",
      "Sarasota roofing",
      "North Port Roofing",
      "Venice Roofing",
      "Manatee County roofing",
      "Charlotte County roofing",
    ],
    image: { url: "https://next.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png", width: 1200, height: 630 },
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Roof Replacement", path: "/roof-replacement-sarasota-fl" },
    ],
  },
  "/financing": {
    title: "Roof Financing | SonShine Roofing",
    description:
      "Get approved today! | (941) 866-4320 | 0% APR for 12 mo. | Credit-based & Equity-based | Easy, convenient financing options for your next roof",
    keywords: [
      "roof financing",
      "roof loans",
      "PACE financing",
      "YGrene",
      "affordable roof financing",
      "low interest rate",
      "fast approval",
      "Service Finance",
      "roof payment plans",
      "Sarasota roofing",
      "North Port Roofing",
      "Venice Roofing",
      "Manatee County roofing",
      "Charlotte County roofing",
      "flexible roof financing",
      "flexible financing",
      "financing",
      "PACE financing for roof",
      "loan for a new roof",
      "financing for a new roof",
      "finance a new roof",
      "finance a roof replacement",
      "Roofer with financing",
    ],
    image: { url: "https://next.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png", width: 1200, height: 630 },
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Financing", path: "/financing" },
    ],
  },
  "/roof-maintenance": {
    title: "Roof Maintenance in Sarasota, Manatee & Charlotte Counties | SonShine Roofing",
    description:
      "Prevent leaks, catch issues early, and extend roof life with scheduled inspections and upkeep. Serving Southwest Florida since 1987.",
    keywords: [
      "roof maintenance",
      "roof upkeep",
      "roof inspection",
      "preventative roof maintenance",
      "roof care club",
      "Sarasota roofing",
      "North Port Roofing",
      "Venice Roofing",
      "Manatee County roofing",
      "Charlotte County roofing",
    ],
    image: { url: "https://next.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png", width: 1200, height: 630 },
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Roof Maintenance", path: "/roof-maintenance" },
    ],
  },
  "/roof-inspection": {
    title: "Roof Inspection in Sarasota, Manatee & Charlotte Counties | SonShine Roofing",
    description:
      "Licensed residential roof inspections to catch hidden leaks and extend roof life. Serving Sarasota and surrounding areas since 1987.",
    keywords: [
      "residential roof inspection",
      "residential roof inspection Sarasota",
      "real estate roof inspection",
      "affordable roof inspection",
      "roof inspection",
      "roof inspection Sarasota",
      "wind mitigation",
      "roof evaluation",
      "leak detection",
      "roof checkup",
      "why do I need a roof inspection",
      "tip top roof checkup",
    ],
    image: { url: "https://next.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png", width: 1200, height: 630 },
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Roof Inspection", path: "/roof-inspection" },
    ],
  },
  "/about-sonshine-roofing": {
    title: "About SonShine Roofing | Sarasota Roofing Company",
    description:
      "Family-owned roofing contractor in Sarasota serving Sarasota, Manatee, and Charlotte Counties since 1987. Meet the team, our values, and what sets us apart.",
    keywords: [
      "about sonshine roofing",
      "sarasota roofing company",
      "roofing company",
      "roofing contractor",
      "our team",
      "roof repair",
      "roof replacement",
      "roof maintenance",
      "Sarasota",
      "Venice",
      "North Port",
      "manatee county",
      "charlotte county",
    ],
    image: { url: "https://next.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png", width: 1200, height: 630 },
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "About SonShine Roofing", path: "/about-sonshine-roofing" },
    ],
  },
  "/contact-us": {
    title: "Contact SonShine Roofing | Sarasota Roofing Company",
    description:
      "Call (941) 866-4320 or send a message — our team responds quickly during business hours. Serving Sarasota, Manatee & Charlotte Counties since 1987.",
    keywords: [
      "contact",
      "phone",
      "address",
      "email",
      "map",
      "Sarasota roofing",
      "Manatee County roofing",
      "Charlotte County roofing",
      "roof repair",
      "roof replacement",
    ],
    image: { url: "https://next.sonshineroofing.com/wp-content/uploads/Open-Graph-Default.png", width: 1200, height: 630 },
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact-us" },
    ],
  },
};

export function getServicePageConfig(path: string): ServicePageConfig | null {
  return SERVICE_PAGE_CONFIG[path] ?? null;
}

