import assert from "node:assert/strict";

import { videoObjectSchema } from "@/lib/seo/schema";

const INPUT_DATE = "2024-01-02";

const schema = videoObjectSchema({
  name: "Test Video",
  description: "Sample description",
  canonicalUrl: "https://example.com/videos/test",
  contentUrl: "https://example.com/videos/test.mp4",
  embedUrl: "https://www.youtube.com/embed/dummy",
  thumbnailUrls: ["https://example.com/thumb.jpg"],
  uploadDate: INPUT_DATE,
  origin: "https://example.com",
});

assert.equal(schema["@type"], "VideoObject");
assert.equal(schema.uploadDate, new Date(INPUT_DATE).toISOString());

console.log("video-schema-uploaddate.test.ts: uploadDate preserved in schema ✅");
