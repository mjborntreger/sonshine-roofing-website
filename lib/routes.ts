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
  { href: "/share", label: "Share" },
  { href: "/reviews", label: "Reviews" },
  { href: "/tell-us-why", label: "Tell Us Why" },
] as const;
