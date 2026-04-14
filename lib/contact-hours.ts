export type HoursInterval = { open: string; close: string };
export type WeeklyHours = Record<number, HoursInterval[]>;

export const CONTACT_TIME_ZONE = "America/New_York";

export const OFFICE_WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export const ALL_DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const OFFICE_HOURS: WeeklyHours = {
  0: [],
  1: [{ open: "07:00", close: "16:00" }],
  2: [{ open: "07:00", close: "16:00" }],
  3: [{ open: "07:00", close: "16:00" }],
  4: [{ open: "07:00", close: "16:00" }],
  5: [{ open: "07:00", close: "16:00" }],
  6: [],
};

export const PHONE_HOURS: WeeklyHours = {
  0: [{ open: "00:00", close: "23:59" }],
  1: [{ open: "00:00", close: "23:59" }],
  2: [{ open: "00:00", close: "23:59" }],
  3: [{ open: "00:00", close: "23:59" }],
  4: [{ open: "00:00", close: "23:59" }],
  5: [{ open: "00:00", close: "23:59" }],
  6: [{ open: "00:00", close: "23:59" }],
};

export const OFFICE_HOURS_COMPACT = {
  weekday: "Mon–Fri 7:00a – 4:00p",
  weekend: "Sat–Sun Closed",
} as const;

export const OFFICE_HOURS_LONG = {
  weekday: "Monday through Friday, 7:00 AM – 4:00 PM",
  weekend: "Saturday–Sunday, Closed",
  sentence: "Monday through Friday, 7:00 AM to 4:00 PM",
} as const;

export const PHONE_HOURS_LABEL = "24/7" as const;
export const PHONE_HOURS_LONG = `Phone, ${PHONE_HOURS_LABEL}` as const;
export const PHONE_HOURS_PREFIXED = `Phone: ${PHONE_HOURS_LABEL}` as const;
export const OFFICE_HOURS_PREFIXED = `Office: ${OFFICE_HOURS_LONG.sentence}` as const;

export const OFFICE_OPENING_HOURS_SPEC = {
  "@type": "OpeningHoursSpecification",
  dayOfWeek: OFFICE_WEEKDAYS,
  opens: "07:00",
  closes: "16:00",
} as const;

export const PHONE_OPENING_HOURS_SPEC = {
  "@type": "OpeningHoursSpecification",
  dayOfWeek: ALL_DAYS_OF_WEEK,
  opens: "00:00",
  closes: "23:59",
} as const;
