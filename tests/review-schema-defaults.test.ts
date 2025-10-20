import assert from "node:assert/strict";

import { buildReviewSchema } from "@/lib/seo/schema";

const schema = buildReviewSchema({
  reviews: [
    { rating: 5, text: "Excellent service", author_name: "Alex" },
    { rating: 4, text: "Fast response time", author_name: "Taylor" },
  ],
});

assert(schema, "buildReviewSchema should return a schema when reviews are provided");

const aggregate = schema.aggregateRating as Record<string, unknown>;
assert(aggregate, "Aggregate rating should be defined");

assert.equal(aggregate.bestRating, 5, "Default best rating should be 5");
assert.equal(aggregate.worstRating, 1, "Default worst rating should be 1");

console.log("review-schema-defaults.test.ts: Aggregate rating defaults verified ✅");
