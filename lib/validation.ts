

import { z } from "zod";

/**
 * Feedback form validation (Zod)
 * - Accepts rating 1|2|3 (string or number) and normalizes to number
 * - Trims/sanitizes name, email, phone, message
 * - Includes Turnstile cfToken
 * - Allows optional meta fields (page, ua, tz)
 * - Provides helpers to parse safely and inspect honeypot fields
 */

// ---- limits ---------------------------------------------------------------
const MAX_NAME = 200;
const MAX_EMAIL = 254; // RFC practical limit
const MAX_PHONE = 32;  // plenty for international formatting
const MAX_MESSAGE = 5000;
const MAX_UA = 1024;
const MAX_TZ = 100;
const MAX_PAGE = 2083; // typical max URL length; we also allow path-only strings

// ---- helpers --------------------------------------------------------------
const trim = (s: unknown) => (typeof s === "string" ? s.trim() : s);

function normalizePhone(input: string): string {
  // Keep digits and common formatting characters, collapse spaces
  const cleaned = input.replace(/[^0-9+()\-\s]/g, "").replace(/\s+/g, " ").trim();
  return cleaned;
}

function looksLikePhone(input: string): boolean {
  // Very permissive: at least 7 digits after stripping non-digits
  const digits = input.replace(/\D/g, "");
  return digits.length === 0 || digits.length >= 7;
}

// rating can arrive as "1" | "2" | "3" or number
const ratingSchema = z.preprocess((val) => {
  if (typeof val === "string" && val !== "") return Number.parseInt(val, 10);
  return val;
}, z.union([z.literal(1), z.literal(2), z.literal(3)]));

// Optional path/URL; we accept either a path ("/tell-us-why") or a full URL
const pageSchema = z
  .string()
  .max(MAX_PAGE)
  .refine((s) => s === "" || s.startsWith("/") || /^(https?:)?\/\//i.test(s), {
    message: "Expected a path or URL",
  })
  .optional();

export const feedbackSchema = z
  .object({
    name: z.preprocess(trim, z.string().min(1, "Name is required").max(MAX_NAME)),
    email: z
      .preprocess(trim, z.string().min(1, "Email is required").max(MAX_EMAIL).email("Invalid email")),
    phone: z
      .preprocess(trim, z.string().max(MAX_PHONE).transform((s) => (s ? normalizePhone(s) : "")))
      .optional()
      .refine((s) => s === undefined || looksLikePhone(s), {
        message: "Invalid phone",
      }),
    rating: ratingSchema,
    message: z.preprocess(trim, z.string().min(1, "Message is required").max(MAX_MESSAGE)),

    // Cloudflare Turnstile client token
    cfToken: z.string().min(10, "Turnstile token missing").max(2000),

    // Optional meta
    page: pageSchema,
    ua: z.preprocess(trim, z.string().max(MAX_UA)).optional(),
    tz: z.preprocess(trim, z.string().max(MAX_TZ)).optional(),

    // Honeypot (any name we choose in the form). Keep generic so API can check it.
    hp_field: z.string().optional(),
  })
  // Allow unknown keys so we can add fields later without breaking old clients
  .passthrough();

export type FeedbackInput = z.infer<typeof feedbackSchema> & {
  rating: 1 | 2 | 3; // after preprocess
};

export type FieldErrors = Record<string, string[]>;

export type ParseOk<T> = { ok: true; data: T };
export type ParseErr = { ok: false; status: number; message: string; fieldErrors?: FieldErrors };
export type ParseResult<T> = ParseOk<T> | ParseErr;

/**
 * Parse helper that returns a uniform result (no exceptions).
 */
export function parseFeedback(input: unknown): ParseResult<FeedbackInput> {
  const result = feedbackSchema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data as FeedbackInput };
  }
  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";
    (fieldErrors[key] ||= []).push(issue.message);
  }
  return {
    ok: false,
    status: 400,
    message: "Validation failed",
    fieldErrors,
  };
}

/**
 * Honeypot trip checker. Pass the raw body (object) and a list of field names
 * that you consider honeypots. If any of them is present and non-empty, it returns true.
 */
export function isHoneypotTripped(
  body: Record<string, unknown>,
  hpFieldNames: string[] = ["company", "website", "fax", "hp_field"]
): boolean {
  return hpFieldNames.some((k) => {
    const v = body?.[k];
    return typeof v === "string" && v.trim().length > 0;
  });
}