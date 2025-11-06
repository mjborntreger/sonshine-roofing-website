import assert from "node:assert/strict";

import { serializeImageEntry } from "@/app/sitemap_index/image/serialization";
import type { WpImage } from "@/lib/content/wp";

const baseUrl = "https://sonshineroofing.com";

const sampleImages: WpImage[] = [
  { url: "https://cdn.example.com/hero.jpg", altText: "  Primary ALT  " },
  { url: " https://cdn.example.com/hero.jpg ", altText: "Duplicate entry should drop" },
  { url: "https://cdn.example.com/gallery-1.jpg", altText: "" },
];

const xml = serializeImageEntry(baseUrl, {
  loc: "/project/sample-slug",
  lastmod: "2024-01-01T00:00:00.000Z",
  images: sampleImages,
});

assert.ok(xml, "serializeImageEntry should return XML for entries with images");
assert.equal((xml!.match(/<image:image>/g) || []).length, 2, "duplicate URLs should be deduplicated");
assert.ok(
  xml!.includes("<image:title>Primary ALT</image:title>"),
  "alt text should be trimmed and emitted as <image:title>"
);
assert.ok(
  !xml!.includes("Duplicate entry should drop"),
  "duplicate images should not surface additional titles"
);

console.log("image-sitemap-serialization.test.ts: serializeImageEntry dedupes and sanitizes ✅");
