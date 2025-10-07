const NON_DIGIT_REGEX = /\D/g;

export function stripToPhoneDigits(value: string): string {
  if (!value) return '';
  const digits = value.replace(NON_DIGIT_REGEX, '');
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

export function normalizePhoneForSubmit(value: string): string {
  const digits = stripToPhoneDigits(value);
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits;
  }
  if (digits.length === 10) {
    return `1${digits}`;
  }
  if (digits.length === 11) {
    return `1${digits.slice(0, 10)}`;
  }
  return '';
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
  const source = sample ?? '9415551234';
  const normalized = normalizePhoneForSubmit(source);
  if (normalized.length !== 11) return '+1 (941) 555-1234';
  const core = normalized.slice(1);
  const area = core.slice(0, 3);
  const mid = core.slice(3, 6);
  const last = core.slice(6, 10);
  return `+1 (${area}) ${mid}-${last}`;
}
