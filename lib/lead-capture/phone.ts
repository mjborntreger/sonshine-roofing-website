const NON_DIGIT_REGEX = /\D/g;

export function stripToDigits(value: string, maxDigits?: number): string {
  if (!value) return '';
  const digits = value.replace(NON_DIGIT_REGEX, '');
  if (typeof maxDigits === 'number') {
    return digits.slice(0, maxDigits);
  }
  return digits;
}

export function stripToPhoneDigits(value: string): string {
  const digits = stripToDigits(value);
  if (!digits) return '';
  if (digits.startsWith('1')) {
    return digits.slice(0, 11);
  }
  return digits.slice(0, 10);
}

export const sanitizePhoneInput = stripToPhoneDigits;

export function isUsPhoneComplete(value: string): boolean {
  const digits = stripToPhoneDigits(value);
  if (digits.length === 11 && digits.startsWith('1')) return true;
  return digits.length === 10;
}

export function normalizePhoneUS(input: string): string | null {
  const digits = stripToDigits(input);
  if (digits.length >= 10) {
    const core = digits.slice(-10);
    return `+1${core}`;
  }
  return null;
}

export function normalizePhoneForSubmit(value: string): string {
  const digits = stripToDigits(value);
  if (!digits) return '';
  if (digits.startsWith('1')) {
    return digits.slice(0, 11);
  }
  if (digits.length >= 10) {
    return `1${digits.slice(-10)}`;
  }
  return '';
}

export function formatPhoneUSForDisplay(value: string): string {
  const normalized = normalizePhoneUS(value);
  if (!normalized) return value;
  const core = normalized.slice(2); // drop "+1"
  const area = core.slice(0, 3);
  const mid = core.slice(3, 6);
  const last = core.slice(6, 10);
  return `+1 (${area}) ${mid}${last ? `-${last}` : ''}`;
}

export function formatPhoneForDisplay(value: string): string {
  const digits = stripToPhoneDigits(value);
  if (!digits) return '';
  const hasCountryCode = digits.startsWith('1');
  const local = hasCountryCode ? digits.slice(1) : digits;
  const prefix = hasCountryCode || local.length === 10 ? '+1 ' : '';

  if (local.length <= 3) {
    return `${prefix}(${local}`;
  }

  if (local.length <= 6) {
    const area = local.slice(0, 3);
    const mid = local.slice(3);
    return `${prefix}(${area}) ${mid}`;
  }

  const area = local.slice(0, 3);
  const mid = local.slice(3, 6);
  const last = local.slice(6, 10);
  return `${prefix}(${area}) ${mid}${last ? `-${last}` : ''}`;
}

export function formatPhoneExample(sample?: string): string {
  const source = sample ?? '9418675309';
  const normalized = normalizePhoneForSubmit(source);
  if (normalized.length !== 11) return '(941) 867-5309';
  const core = normalized.slice(1);
  const area = core.slice(0, 3);
  const mid = core.slice(3, 6);
  const last = core.slice(6, 10);
  return `(${area}) ${mid}-${last}`;
}
