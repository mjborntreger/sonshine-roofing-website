'use client';

import { useState } from 'react';
import { Mail, Phone, Copy, Check } from 'lucide-react';

type Variant = 'email' | 'phone';

type CommonProps = {
  variant: Variant;
  label?: string;           // button label before reveal
  className?: string;       // button class
  linkClassName?: string;   // revealed link class
};

// Email input: pass parts OR base64
type EmailInput =
  | { variant: 'email'; user: string; host: string; encoded?: never }
  | { variant: 'email'; encoded: string; user?: never; host?: never };

// Phone input: pass e164 OR parts OR base64; optional display text and sms body
type PhoneInput =
  | { variant: 'phone'; e164: string; display?: string; parts?: never[]; encoded?: never; smsBody?: string }
  | { variant: 'phone'; parts: string[]; display?: string; e164?: never; encoded?: never; smsBody?: string }
  | { variant: 'phone'; encoded: string; display?: string; e164?: never; parts?: never[]; smsBody?: string };

type Props = (EmailInput | PhoneInput) & CommonProps;

function formatDisplayPhone(e164: string) {
  // very simple US pretty printer: +1XXXXXXXXXX -> (XXX) XXX-XXXX
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

export default function RevealContact(props: Props) {
  const [revealed, setRevealed] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const label = props.label ?? (props.variant === 'email' ? 'Reveal email' : 'Reveal Phone');
  const btnClasses = props.className ?? 'btn btn-outline btn-sm inline-flex items-center gap-2';
  const linkClasses =
    props.linkClassName ?? 'inline-flex items-center gap-2 text-[--brand-blue] underline underline-offset-2';
  const wrapperClasses = 'block my-2';

  function decode() {
    if (props.variant === 'email') {
      const encoded = (props as any).encoded as string | undefined;
      if (encoded) {
        try {
          setValue(typeof window !== 'undefined' && window.atob ? window.atob(encoded) : encoded);
        } catch { setValue(null); }
        return;
      }
      setValue(`${(props as any).user}@${(props as any).host}`);
      return;
    }

    // phone
    const p = props as any;
    const ext = p.ext ?? p.extension ?? undefined;
    if (p.encoded) {
      try {
        const raw = typeof window !== 'undefined' && window.atob ? window.atob(p.encoded) : p.encoded;
        setValue(ext ? raw + '|' + String(ext) : raw);
      } catch { setValue(null); }
      return;
    }
    if (p.e164) { setValue(ext ? p.e164 + '|' + String(ext) : p.e164); return; }
    if (Array.isArray(p.parts)) { setValue(ext ? p.parts.join('') + '|' + String(ext) : p.parts.join('')); return; }
    setValue(null);
  }

  async function copyToClipboard() {
    if (!value) return;
    // Build the same "display" string we render on screen
    let toCopy = '';
    if (props.variant === 'email') {
      const [primary] = String(value).split('|');
      toCopy = primary;
    } else {
      const [primary, ext] = String(value).split('|');
      // Copy the RFC-style tel URI (autodial): tel:+1...;ext=106
      toCopy = `tel:${primary}${ext ? `;ext=${ext}` : ''}`;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(toCopy);
      } else {
        const ta = document.createElement('textarea');
        ta.value = toCopy;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop: user can still use the mailto/tel link
    }
  }

  if (revealed && value) {
    const Icon = props.variant === 'email' ? Mail : Phone;
    const [primary, ext] = String(value).split('|');
    const href =
      props.variant === 'email'
        ? `mailto:${primary}`
        : `tel:${primary}${ext ? `;ext=${ext}` : ''}`;
    const displayPretty =
      props.variant === 'email'
        ? primary
        : ((props as any).display ?? formatDisplayPhone(primary));

    return (
      <div className={wrapperClasses}>
        <div className="flex flex-wrap items-center gap-2" id="revealed-contact">
          <a href={href} className={linkClasses} aria-label={`${props.variant} ${displayPretty}${ext ? ' extension ' + ext : ''}`} rel="nofollow noopener">
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{displayPretty}</span>
          </a>
          {props.variant === 'phone' && ext ? (
            <span className="text-slate-700">+{ext}</span>
          ) : null}
          <button
            type="button"
            onClick={copyToClipboard}
            className="btn btn-outline btn-sm inline-flex items-center gap-2"
            title={`Copy ${props.variant} to clipboard`}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy
          </button>
          <span
            aria-live="polite"
            className={`inline-flex items-center gap-1 text-sm font-semibold text-green-600 transition-opacity duration-300 ${copied ? 'opacity-100' : 'opacity-0'}`}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Copied!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <button
        type="button"
        className={btnClasses}
        onClick={() => { decode(); setRevealed(true); }}
        aria-expanded={revealed}
        aria-controls="revealed-contact"
      >
        {props.variant === 'email' ? <Mail className="h-4 w-4" aria-hidden="true" /> : <Phone className="h-4 w-4" aria-hidden="true" />}
        <span>{label}</span>
      </button>
    </div>
  );
}