

import { z } from "zod";
import { normalizePhoneUS, stripToDigits } from "./phone";

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
const MAX_TRACKING = 200;
const MAX_SPECIAL_MESSAGE = 1000;

// ---- helpers --------------------------------------------------------------
const trim = (s: unknown) => (typeof s === "string" ? s.trim() : s);

const digitsOnly = (value: string) => stripToDigits(value);

const optionalTrackingField = z
  .preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }, z.string().min(1).max(MAX_TRACKING))
  .optional();

const optionalTrimmedString = (max: number) =>
  z
    .preprocess((value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed ? trimmed : undefined;
    }, z.string().min(1).max(max))
    .optional();

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

const feedbackSchema = z
  .object({
    name: z.preprocess(trim, z.string().min(1, "Name is required").max(MAX_NAME)),
    email: z
      .preprocess(trim, z.string().min(1, "Email is required").max(MAX_EMAIL).email("Invalid email")),
    phone: z
      .preprocess(trim, z.string().min(1, "Phone is required").max(MAX_PHONE))
      .refine((value) => normalizePhoneUS(value) !== null, {
        message: "Phone must include 10 digits",
      })
      .transform((value) => normalizePhoneUS(value)!),
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

type FeedbackInput = z.infer<typeof feedbackSchema> & {
  rating: 1 | 2 | 3; // after preprocess
};

type FieldErrors = Record<string, string[]>;

type ParseOk<T> = { ok: true; data: T };
type ParseErr = { ok: false; status: number; message: string; fieldErrors?: FieldErrors };
type ParseResult<T> = ParseOk<T> | ParseErr;

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

// ---------------------------------------------------------------------------
// Financing calculator lead form

const MAX_FINANCING_NAME = 200;
const MAX_FINANCING_EMAIL = 254;
const MAX_FINANCING_ADDRESS = 200;
const MAX_FINANCING_CITY = 120;
const MAX_FINANCING_STATE = 30;
const MAX_FINANCING_ZIP = 20;

const FINANCING_EMAIL_DOMAINS = [
  ".com",
  ".net",
  ".org",
  ".edu",
  ".gov",
  ".co",
  ".us",
  ".io",
  ".info",
  ".biz",
];

const financingEmailSchema = z
  .preprocess(trim, z.string().min(1, "Email is required").max(MAX_FINANCING_EMAIL).email("Invalid email"))
  .refine((email) => FINANCING_EMAIL_DOMAINS.some((suffix) => email.toLowerCase().endsWith(suffix)), {
    message: "Email domain not allowed",
  });

const financingPhoneSchema = z
  .preprocess(trim, z.string().min(1, "Phone is required").max(MAX_PHONE))
  .refine((value) => normalizePhoneUS(value) !== null, {
    message: "Phone must include 10 digits",
  })
  .transform((value) => normalizePhoneUS(value)!);

const financingMatchSchema = z.object({
  program: z.union([z.literal('serviceFinance'), z.literal('ygrene')]),
  score: z.number().min(0).max(100),
  reasons: z.array(z.string().min(1).max(200)).max(3),
});

const financingScoresSchema = z.object({
  ygreneScore: z.number().min(0).max(100),
  serviceFinanceScore: z.number().min(0).max(100),
  isUncertain: z.boolean(),
});

const leadBaseSchema = z.object({
  cfToken: z.string().min(10, "Turnstile token missing").max(2000),
  hp_field: z.string().optional(),
  page: pageSchema,
  utm_source: optionalTrackingField,
  utm_medium: optionalTrackingField,
  utm_campaign: optionalTrackingField,
});

const leadFinancingSchema = leadBaseSchema
  .extend({
    type: z.literal('financing-calculator'),
    firstName: z.preprocess(trim, z.string().min(1, "First name is required").max(MAX_FINANCING_NAME)),
    lastName: z.preprocess(trim, z.string().min(1, "Last name is required").max(MAX_FINANCING_NAME)),
    email: financingEmailSchema,
    phone: financingPhoneSchema,
    address1: z
      .preprocess(trim, z.string().min(1, "Address is required").max(MAX_FINANCING_ADDRESS)),
    address2: z.preprocess(trim, z.string().max(MAX_FINANCING_ADDRESS)).optional(),
    city: z.preprocess(trim, z.string().min(1, "City is required").max(MAX_FINANCING_CITY)),
    state: z
      .preprocess(trim, z.string().min(2, "State is required").max(MAX_FINANCING_STATE))
      .refine((value) => /^[A-Za-z]{2}$/.test(String(value)), { message: "State must be two letters" }),
    zip: z
      .preprocess(trim, z.string().min(1, "ZIP is required").max(MAX_FINANCING_ZIP))
      .refine((value) => digitsOnly(value).length === 5, { message: "ZIP must be 5 digits" }),
    amount: z
      .number({ invalid_type_error: "Amount must be a number" })
      .min(1000, "Amount must be at least 1000"),
    quizSummary: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          question: z.string().min(1).max(500),
          answer: z.union([z.literal('yes'), z.literal('no')]).optional(),
          answerValue: z.string().min(1).max(200).optional(),
          answerLabel: z.string().min(1).max(200).optional(),
        })
      )
      .optional(),
    match: financingMatchSchema.optional(),
    scores: financingScoresSchema.optional(),
  })
  .passthrough();

const leadFeedbackEmailSchema = z
  .preprocess(trim, z.string().min(1, "Email is required").max(MAX_EMAIL).email("Invalid email"));

const leadFeedbackPhoneSchema = z
  .preprocess(trim, z.string().min(1, "Phone is required").max(MAX_PHONE))
  .refine((value) => normalizePhoneUS(value) !== null, {
    message: "Phone must include 10 digits",
  })
  .transform((value) => normalizePhoneUS(value)!);

const leadFeedbackSchema = leadBaseSchema
  .extend({
    type: z.literal('feedback'),
    firstName: z.preprocess(trim, z.string().min(1, "First name is required").max(MAX_NAME)),
    lastName: z.preprocess(trim, z.string().min(1, "Last name is required").max(MAX_NAME)),
    email: leadFeedbackEmailSchema,
    phone: leadFeedbackPhoneSchema,
    rating: ratingSchema,
    message: z.preprocess(trim, z.string().min(1, "Message is required").max(MAX_MESSAGE)),
    ua: z.preprocess(trim, z.string().max(MAX_UA)).optional(),
    tz: z.preprocess(trim, z.string().max(MAX_TZ)).optional(),
  })
  .passthrough();

const leadSpecialOfferSchema = leadBaseSchema
  .extend({
    type: z.literal('special-offer'),
    firstName: z.preprocess(trim, z.string().min(1, 'First name is required').max(MAX_NAME)),
    lastName: z.preprocess(trim, z.string().min(1, 'Last name is required').max(MAX_NAME)),
    email: leadFeedbackEmailSchema,
    phone: financingPhoneSchema,
    offerCode: z.preprocess(trim, z.string().min(1, 'Offer code is required').max(120)),
    offerSlug: z.preprocess(trim, z.string().min(1, 'Offer slug is required').max(160)),
    offerTitle: optionalTrimmedString(200),
    offerExpiration: optionalTrimmedString(40),
    message: optionalTrimmedString(MAX_SPECIAL_MESSAGE),
  })
  .passthrough();

const leadSchema = z.discriminatedUnion('type', [leadFinancingSchema, leadFeedbackSchema, leadSpecialOfferSchema]);

export type LeadInput = z.infer<typeof leadSchema>;
export type FinancingLeadInput = z.infer<typeof leadFinancingSchema>;
export type FeedbackLeadInput = z.infer<typeof leadFeedbackSchema>;
export type SpecialOfferLeadInput = z.infer<typeof leadSpecialOfferSchema>;

export function parseLead(input: unknown): ParseResult<LeadInput> {
  const result = leadSchema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data };
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

export function parseFinancingLead(input: unknown): ParseResult<FinancingLeadInput> {
  const parsed = parseLead(input);
  if (!parsed.ok) return parsed;
  if (parsed.data.type !== 'financing-calculator') {
    return {
      ok: false,
      status: 400,
      message: 'Expected financing-calculator lead',
      fieldErrors: { type: ['Expected financing-calculator lead'] },
    };
  }
  return { ok: true, data: parsed.data };
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
