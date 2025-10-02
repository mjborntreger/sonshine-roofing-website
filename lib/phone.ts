export function stripToDigits(value: string, maxDigits?: number): string {
  const digits = value.replace(/\D+/g, '');
  if (typeof maxDigits === 'number') {
    return digits.slice(0, maxDigits);
  }
  return digits;
}

export function normalizePhoneUS(input: string): string | null {
  const digits = stripToDigits(input);
  if (!digits) return null;

  if (digits.length >= 10) {
    const core = digits.slice(-10);
    return `+1${core}`;
  }

  return null;
}

export function formatPhoneUSForDisplay(input: string): string {
  const digits = stripToDigits(input);
  if (digits.length < 10) return input;

  const core = digits.slice(-10);
  const area = core.slice(0, 3);
  const mid = core.slice(3, 6);
  const last = core.slice(6);
  const hasCountryCode = digits.length > 10 || /^\+/.test(input);
  const prefix = hasCountryCode ? '+1 ' : '';

  return `${prefix}(${area}) ${mid}-${last}`;
}
