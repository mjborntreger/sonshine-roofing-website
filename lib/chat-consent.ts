const CONSENT_COOKIE_NAME = 'sonshine-chat-consent';
const CONSENT_YES = 'yes';
const CONSENT_NO = 'no';

const AUTO_OPEN_COOKIE_NAME = 'sonshine-chat-auto-opened';
const AUTO_OPEN_VALUE = '1';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? match[1] : null;
}

function setSessionCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;

  try {
    document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
  } catch {
    // Ignore cookie write failures; behavior falls back to per-navigation.
  }
}

export type ChatConsentValue = typeof CONSENT_YES | typeof CONSENT_NO;

export function getChatConsent(): ChatConsentValue | null {
  const rawValue = getCookie(CONSENT_COOKIE_NAME);
  if (!rawValue) return null;

  try {
    const value = decodeURIComponent(rawValue);
    return value === CONSENT_YES || value === CONSENT_NO ? (value as ChatConsentValue) : null;
  } catch {
    return null;
  }
}

export function setChatConsent(value: ChatConsentValue) {
  setSessionCookie(CONSENT_COOKIE_NAME, encodeURIComponent(value));
}

export function hasGrantedChatConsent(): boolean {
  return getChatConsent() === CONSENT_YES;
}

export function clearChatConsent() {
  if (typeof document === 'undefined') return;

  try {
    document.cookie = `${CONSENT_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  } catch {
    // Ignore cookie delete failures.
  }
}

export function markChatAutoOpened() {
  setSessionCookie(AUTO_OPEN_COOKIE_NAME, AUTO_OPEN_VALUE);
}

export function hasChatAutoOpened(): boolean {
  try {
    const rawValue = getCookie(AUTO_OPEN_COOKIE_NAME);
    return rawValue === AUTO_OPEN_VALUE;
  } catch {
    return false;
  }
}
