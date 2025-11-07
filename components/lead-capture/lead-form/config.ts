import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ClipboardList,
  Droplets,
  Hammer,
  HandCoins,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  SunDim,
  TrendingUp,
  UserRoundSearch,
  Wrench,
} from 'lucide-react';
import type { SuccessMeta, PreferredContactValue } from '@/lib/lead-capture/contact-lead';
import { parseLeadSuccessCookie } from '@/lib/lead-capture/contact-lead';

export type JourneyKey = 'repair' | 'retail' | 'maintenance' | 'something-else';

export type ProjectOption = {
  value: JourneyKey | 'financing-link' | 'project-gallery';
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  action: 'advance' | 'link';
  href?: string;
  imageSrc: string;
  imageAlt: string;
};

export type HelpOption = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  imageSrc?: string;
  imageAlt?: string;
};

export type TimelineOption = {
  value: string;
  label: string;
};

export type JourneyConfig = {
  helpOptions: HelpOption[];
  timelineOptions: TimelineOption[];
  showHelpMulti: boolean;
  showTimeline: boolean;
  showNotes: boolean;
  requireNotes: boolean;
  notesLabel: string;
  notesPlaceholder: string;
};

export type ResourceLink = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

export type LeadFormUtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
};

export const PROJECT_OPTIONS: ProjectOption[] = [
  {
    value: 'repair',
    label: 'My roof is leaking',
    description: 'Water coming in or ceiling damage right now',
    icon: Droplets,
    accent: 'border-rose-200 bg-rose-50 text-rose-600',
    action: 'advance',
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/Emergency-Roof-Repair.webp',
    imageAlt: 'Crew handling an emergency roof repair with tarps on the roof',
  },
  {
    value: 'retail',
    label: 'Plan a roof replacement',
    description: 'Ready to compare options for a new roofing system',
    icon: Hammer,
    accent: 'border-amber-200 bg-amber-50 text-amber-600',
    action: 'advance',
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/Plan-a-Roof-Replacement.webp',
    imageAlt: 'Homeowners reviewing plans for a roof replacement',
  },
  {
    value: 'maintenance',
    label: 'Light repairs, inspections, maintenance',
    description: 'Annual checkups, prepare for hurricane season, real estate',
    icon: Wrench,
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    action: 'advance',
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/Light-Repairs-Inspection-and-Maintenance.webp',
    imageAlt: 'Technician performing light roof repairs and an inspection',
  },
  {
    value: 'financing-link',
    label: 'Browse financing options',
    description: 'Payment deferrals, low APR, fast approval',
    icon: HandCoins,
    accent: 'border-sky-200 bg-sky-50 text-sky-600',
    action: 'link',
    href: '/financing#get-started',
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/Browse-Financing-Options.webp',
    imageAlt: 'Homeowner reviewing roof financing options on a tablet',
  },
  {
    value: 'project-gallery',
    label: 'See our past work',
    description: 'Browse our project gallery, learn more about material and color options',
    icon: Star,
    accent: 'border-purple-200 bg-purple-50 text-purple-600',
    action: 'link',
    href: '/project',
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/See-Our-Past-Work.webp',
    imageAlt: 'Finished roofing project showcasing past work',
  },
  {
    value: 'something-else',
    label: 'Something else',
    description: 'Warranty, insurance, skylights, or just have a few questions',
    icon: MessageCircle,
    accent: 'border-violet-200 bg-violet-50 text-violet-600',
    action: 'advance',
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/Something-Else.webp',
    imageAlt: 'Homeowner talking with a roofing advisor',
  },
];

export const STANDARD_TIMELINE_OPTIONS: TimelineOption[] = [
  { value: 'within-72-hours', label: 'Within 72 hours' },
  { value: 'this-week', label: 'This week' },
  { value: 'this-month', label: 'This month' },
  { value: 'next-2-3-months', label: 'In the next 2–3 months' },
  { value: 'this-year', label: 'This year' },
  { value: 'not-sure-yet', label: 'Not sure yet' },
];

const EMERGENCY_REPLACEMENT_HELP: HelpOption[] = [
  {
    value: 'active-leak',
    label: 'Water damage',
    description: 'There is water inside or the interior is compromised',
    icon: Droplets,
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/i-have-an-active-leak.webp',
    imageAlt: 'Active roof leak with buckets catching water inside a home',
  },
  {
    value: 'aging-out',
    label: 'Aging roof',
    description: 'It’s close to the end of its lifespan and we want a plan',
    icon: SunDim,
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/roof-is-aging-out.webp',
    imageAlt: 'Homeowner inspecting an older roof showing wear',
  },
  {
    value: 'just-researching',
    label: 'Researching options',
    description: 'Gathering ideas, timelines, and investment ranges',
    icon: TrendingUp,
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/researching-options.webp',
    imageAlt: 'Couple reviewing roofing options on a laptop',
  },
  {
    value: 'visible-damage',
    label: 'Exterior roof damage',
    description: 'Missing shingles, lifted tiles, or debris on the roof',
    icon: AlertTriangle,
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/I-can-see-roof-damage.webp',
    imageAlt: 'Close-up of shingles showing visible roof damage',
  },
  {
    value: 'inspection-needed',
    label: 'Need an inspection report',
    description: 'For insurance, warranty, or peace of mind before hurricane season',
    icon: ShieldCheck,
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/need-an-inspection-report.webp',
    imageAlt: 'Roof inspector documenting findings on a clipboard',
  },
  {
    value: 'financing-options',
    label: 'Interested in financing',
    description: 'No credit check, personalized quiz, detailed monthly payment calculator',
    icon: HandCoins,
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/Interested-in-Financing-Options.webp',
    imageAlt: 'Homeowner discussing roofing financing options with advisor',
  },
];

const MAINTENANCE_HELP: HelpOption[] = [
  {
    value: 'inspection-needed',
    label: 'Need an inspection report',
    description: 'For insurance, warranty, or peace of mind before hurricane season',
    icon: ClipboardList,
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/need-an-inspection-report.webp',
    imageAlt: 'Roof inspector documenting findings on a clipboard',
  },
  {
    value: 'visible-damage',
    label: 'Exterior roof damage',
    description: 'Missing shingles, lifted tiles, or debris on the roof',
    icon: AlertTriangle,
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/I-can-see-roof-damage.webp',
    imageAlt: 'Close-up of shingles showing visible roof damage',
  },
  {
    value: 'active-leak',
    label: 'Water damage',
    description: 'There is water inside or the interior is compromised',
    icon: Droplets,
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/i-have-an-active-leak.webp',
    imageAlt: 'Active roof leak with buckets catching water inside a home',
  },
  {
    value: 'roof-care-club',
    label: 'I want to join the Roof Care Club',
    description: 'Yearly maintenance plan, documentation for insurance',
    icon: Sparkles,
    imageSrc: 'https://next.sonshineroofing.com/wp-content/uploads/Light-Repairs-Inspection-and-Maintenance.webp',
    imageAlt: 'Technician performing routine roof maintenance',
  },
];

export const JOURNEY_CONFIG: Record<JourneyKey, JourneyConfig> = {
  repair: {
    helpOptions: EMERGENCY_REPLACEMENT_HELP,
    timelineOptions: STANDARD_TIMELINE_OPTIONS,
    showHelpMulti: true,
    showTimeline: true,
    showNotes: true,
    requireNotes: false,
    notesLabel: 'Anything else you’d like us to know?',
    notesPlaceholder: 'Example: We already have tarps down, or insurance adjuster scheduled Friday.',
  },
  retail: {
    helpOptions: EMERGENCY_REPLACEMENT_HELP,
    timelineOptions: STANDARD_TIMELINE_OPTIONS,
    showHelpMulti: true,
    showTimeline: true,
    showNotes: true,
    requireNotes: false,
    notesLabel: 'Anything else you’d like us to know?',
    notesPlaceholder: 'Share anything that will help us prep for your project.',
  },
  maintenance: {
    helpOptions: MAINTENANCE_HELP,
    timelineOptions: STANDARD_TIMELINE_OPTIONS,
    showHelpMulti: true,
    showTimeline: true,
    showNotes: true,
    requireNotes: false,
    notesLabel: 'Anything else you’d like us to know?',
    notesPlaceholder: 'Tell us about your maintenance goals or existing issues.',
  },
  'something-else': {
    helpOptions: [],
    timelineOptions: [],
    showHelpMulti: false,
    showTimeline: false,
    showNotes: true,
    requireNotes: true,
    notesLabel: 'Explain your situation',
    notesPlaceholder: 'Use as much detail as you’d like.',
  },
};

const JOURNEY_RESOURCES: Partial<Record<JourneyKey, ResourceLink[]>> = {
  repair: [
    {
      label: 'Learn about roof repair',
      description: 'Costs, common issues, repair vs. replace',
      href: '/roof-repair',
      icon: Wrench,
    },
  ],
  retail: [
    {
      label: 'Learn about roof replacement',
      description: 'Warranties, materials, what to expect',
      href: '/roof-replacement-sarasota-fl',
      icon: Hammer,
    },
    {
      label: 'Get a 60-second estimate',
      description: 'Satellite measurements, select materials',
      href: 'https://www.myquickroofquote.com/contractors/sonshine-roofing',
      icon: ClipboardList,
      external: true,
    },
  ],
  maintenance: [
    {
      label: 'Learn about roof inspection',
      description: 'Tip Top Roof Check-up',
      href: '/roof-inspection',
      icon: ClipboardList,
    },
    {
      label: 'Learn about roof maintenance',
      description: 'Roof Care Club',
      href: '/roof-maintenance',
      icon: Sparkles,
    },
  ],
  'something-else': [],
};

const UNIVERSAL_RESOURCES: ResourceLink[] = [
  {
    label: 'Explore financing options',
    description: 'Payment deferrals, low APR, fast approval',
    href: '/financing',
    icon: HandCoins,
  },
  {
    label: 'See our past work',
    description: 'Browse our project gallery, learn more about your aesthetic options',
    href: '/project',
    icon: Star,
  },
  {
    label: 'Learn about us',
    description: 'Who we are, our mission and values',
    href: '/about-sonshine-roofing',
    icon: UserRoundSearch,
  },
];

export const CONTACT_PREF_OPTIONS: ReadonlyArray<{ value: PreferredContactValue; label: string; icon: LucideIcon }> = [
  { value: 'phone-call', label: 'Phone call', icon: Phone },
  { value: 'email', label: 'Email', icon: Send },
] as const;

export const BEST_TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (8–11am)' },
  { value: 'midday', label: 'Midday (11–2pm)' },
  { value: 'afternoon', label: 'Afternoon (2–5pm)' },
  { value: 'no-preference', label: 'No preference' },
] as const;

export function isJourneyKey(value: string | null | undefined): value is JourneyKey {
  if (!value) return false;
  return Object.prototype.hasOwnProperty.call(JOURNEY_CONFIG, value);
}

export function getJourneyConfig(projectType: string | null | undefined): JourneyConfig | null {
  if (!isJourneyKey(projectType)) return null;
  return JOURNEY_CONFIG[projectType];
}

export function getSuccessLinks(projectType: string): ResourceLink[] {
  if (!isJourneyKey(projectType)) return UNIVERSAL_RESOURCES;
  const specific = JOURNEY_RESOURCES[projectType] ?? [];
  return [...specific, ...UNIVERSAL_RESOURCES];
}

export function formatFallbackLabel(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getHelpTopicLabelsForDisplay(projectType: string, helpTopics: string[]): string[] {
  if (!helpTopics.length) return [];
  const journey = getJourneyConfig(projectType);
  if (!journey) return helpTopics.map((topic) => formatFallbackLabel(topic));
  const lookup = new Map(journey.helpOptions.map((option) => [option.value, option.label]));
  return helpTopics.map((topic) => lookup.get(topic) ?? formatFallbackLabel(topic));
}

export function getTimelineLabelForDisplay(projectType: string, timeline: string): string | null {
  if (!timeline) return null;
  const journey = getJourneyConfig(projectType);
  const option = journey?.timelineOptions.find((item) => item.value === timeline);
  if (option) return option.label;
  return formatFallbackLabel(timeline) || null;
}

export type LeadSuccessRestore = {
  formPreset: {
    projectType: string;
    helpTopics: string[];
    timeline: string;
  };
  meta: SuccessMeta;
};

export function restoreLeadSuccessState(rawCookie?: string | null): LeadSuccessRestore | null {
  const parsed = parseLeadSuccessCookie(rawCookie ?? null);
  if (!parsed) return null;

  const projectType = parsed.projectType || '';
  if (!projectType) return null;

  const helpTopics = Array.isArray(parsed.helpTopics)
    ? parsed.helpTopics.filter((topic): topic is string => typeof topic === 'string')
    : [];
  const timeline = typeof parsed.timeline === 'string' ? parsed.timeline : '';

  const helpTopicLabels =
    Array.isArray(parsed.helpTopicLabels) && parsed.helpTopicLabels.every((label) => typeof label === 'string')
      ? (parsed.helpTopicLabels as string[])
      : getHelpTopicLabelsForDisplay(projectType, helpTopics);

  const timelineLabel =
    typeof parsed.timelineLabel === 'string' && parsed.timelineLabel
      ? parsed.timelineLabel
      : getTimelineLabelForDisplay(projectType, timeline);

  return {
    formPreset: {
      projectType,
      helpTopics,
      timeline,
    },
    meta: {
      projectType,
      helpTopicLabels,
      timelineLabel: timelineLabel || null,
    },
  };
}
