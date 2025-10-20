import assert from "node:assert/strict";

import { faqSchema } from "@/lib/seo/schema";

const schema = faqSchema([
  {
    question: "How long does a roof last?",
    answerHtml: "<p>A well-maintained roof can last <strong>25-30 years</strong>.</p>",
  },
]);

const mainEntity = schema.mainEntity as Array<Record<string, unknown>>;
assert(Array.isArray(mainEntity), "mainEntity should be an array");
assert.equal(mainEntity.length, 1, "Should include one question");

const acceptedAnswer = mainEntity[0].acceptedAnswer as Record<string, unknown>;
assert(acceptedAnswer, "acceptedAnswer should exist");

const text = acceptedAnswer.text as string;
assert.equal(text, "A well-maintained roof can last 25-30 years.", "Answer text should be plain text");
assert(!text.includes("<"), "Answer text must not contain HTML tags");

console.log("faq-schema-plaintext.test.ts: Answers emit plain text ✅");
