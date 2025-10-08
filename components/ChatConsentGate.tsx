'use client';

import { useEffect, useState } from 'react';
import TawkChatLoader from './TawkChatLoader';
import SmartLink from './SmartLink';
import { Check, MessageSquare, X } from 'lucide-react';
import {
  hasChatAutoOpened,
  hasGrantedChatConsent,
  setChatConsent,
} from '@/lib/chat-consent';

export default function ChatConsentGate() {
  const [hasConsent, setHasConsent] = useState(false);
  const [checkedCookies, setCheckedCookies] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false);

  useEffect(() => {
    const consentGranted = hasGrantedChatConsent();
    setHasConsent(consentGranted);
    if (consentGranted && !hasChatAutoOpened()) {
      setShouldAutoOpen(true);
    }
    setCheckedCookies(true);
  }, []);

  if (!checkedCookies) {
    return null;
  }

  if (hasConsent) {
    return (
      <TawkChatLoader
        autoOpen={shouldAutoOpen}
        onAutoOpenComplete={() => setShouldAutoOpen(false)}
      />
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {showPrompt ? (
        <div className="max-w-xs rounded-3xl border border-slate-300 bg-white p-4 text-left shadow-xl">
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
                setChatConsent('no');
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
                setChatConsent('yes');
                setHasConsent(true);
                setShouldAutoOpen(!hasChatAutoOpened());
              }}
            >
              Enable
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
