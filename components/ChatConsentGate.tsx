'use client';

import { useEffect, useState } from 'react';
import TawkChatLoader from './TawkChatLoader';
import SmartLink from './SmartLink';
import { Check, MessageSquare, X } from 'lucide-react';

const COOKIE_NAME = 'sonshine-chat-consent';
const CONSENT_YES = 'yes';
const CONSENT_NO = 'no';
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getConsentCookie(): 'yes' | 'no' | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match) return null;

  try {
    const value = decodeURIComponent(match[1]);
    return value === CONSENT_YES || value === CONSENT_NO ? (value as 'yes' | 'no') : null;
  } catch {
    return null;
  }
}

function setConsentCookie(value: 'yes' | 'no') {
  if (typeof document === 'undefined') return;

  try {
    const expires = new Date(Date.now() + COOKIE_MAX_AGE_MS).toUTCString();
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
  } catch {
    // Ignore cookie write failures; prompt flow will fall back to per-session.
  }
}

export default function ChatConsentGate() {
  const [hasConsent, setHasConsent] = useState(false);
  const [checkedCookies, setCheckedCookies] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const storedValue = getConsentCookie();
    setHasConsent(storedValue === CONSENT_YES);
    setCheckedCookies(true);
  }, []);

  if (!checkedCookies) {
    return null;
  }

  if (hasConsent) {
    return <TawkChatLoader />;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {showPrompt ? (
        <div className="max-w-sm rounded-3xl border border-slate-300 bg-white p-4 text-left shadow-xl">
          <p className="text-sm text-slate-800">
            By enabling chat you agree to connect with a Sonshine Roofing team member. We may collect your name,
            contact details, and any messages you share so we can respond to your inquiry.{' '}
            <SmartLink className="text-[--brand-blue] hover:underline hover:text-blue-700" href="privacy-policy">Review our Privacy Policy for details.</SmartLink>
          </p>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              className="btn btn-outline btn-md"
              onClick={() => {
                setConsentCookie(CONSENT_NO);
                setShowPrompt(false);
              }}
            >
              Cancel
              <X className="h-4 w-4 inline ml-2" />
            </button>
            <button
              type="button"
              className="btn btn-brand-blue btn-md"
              onClick={() => {
                setConsentCookie(CONSENT_YES);
                setHasConsent(true);
              }}
            >
              Enable live chat
              <Check className="h-4 w-4 inline ml-2" />
            </button>
          </div>
        </div>
      ) : null}
      {!showPrompt ? (
        <button
          type="button"
          className="rounded-full bg-[--brand-blue] px-4 py-3 text-md font-semibold text-white shadow-lg transition hover:bg-blue-700"
          onClick={() => setShowPrompt(true)}
        >
          <MessageSquare className="h-5 w-5 inline mr-2" />
          Chat with us
        </button>
      ) : null}
    </div>
  );
}
