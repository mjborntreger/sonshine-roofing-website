import type { Metadata } from "next";
import { metadata as baseMetadata, viewport } from "../layout";

const languageAlternates = {
  en: "/",
  es: "/es",
  "x-default": "/",
} as const;

export const metadata: Metadata = {
  ...baseMetadata,
  alternates: {
    ...(baseMetadata.alternates ?? {}),
    canonical: "/es",
    languages: languageAlternates,
  },
  openGraph: {
    ...(baseMetadata.openGraph ?? {}),
    locale: "es",
  },
};

export { viewport };

export default function EsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
