'use client';

import { useState } from "react";
import { Mail, Phone, Copy, Check } from "lucide-react";

type BaseCommonProps = {
  label?: string;
  className?: string;
  linkClassName?: string;
};

type EmailProps =
  | (BaseCommonProps & { variant: "email"; user: string; host: string; encoded?: never })
  | (BaseCommonProps & { variant: "email"; encoded: string; user?: never; host?: never });

type PhoneBaseProps = BaseCommonProps & {
  variant: "phone";
  display?: string;
  smsBody?: string;
  ext?: string | number;
  extension?: string | number;
};

type PhoneProps =
  | (PhoneBaseProps & { e164: string; parts?: never; encoded?: never })
  | (PhoneBaseProps & { parts: string[]; e164?: never; encoded?: never })
  | (PhoneBaseProps & { encoded: string; e164?: never; parts?: never });

type Props = EmailProps | PhoneProps;

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
  const isPhoneVariant = props.variant === 'phone';
  const buttonClassName = isPhoneVariant ? `${btnClasses} phone-affordance` : btnClasses;
  const baseIconClass = 'h-4 w-4';
  const iconClassName = isPhoneVariant ? `${baseIconClass} phone-affordance-icon` : baseIconClass;
  const revealedLinkClass = isPhoneVariant ? `${linkClasses} phone-affordance` : linkClasses;

  const resolveExtension = (input: string | number | undefined): string | undefined => {
    if (input === undefined || input === null) return undefined;
    return String(input);
  };

  function decode() {
    if (props.variant === 'email') {
      if ('encoded' in props && props.encoded) {
        try {
          const decoded = typeof window !== 'undefined' && window.atob ? window.atob(props.encoded) : props.encoded;
          setValue(decoded);
        } catch {
          setValue(null);
        }
        return;
      }
      if ('user' in props && 'host' in props) {
        setValue(`${props.user}@${props.host}`);
        return;
      }
      setValue(null);
      return;
    }

    // phone
    const extensionValue = resolveExtension(props.extension ?? props.ext);
    if ('encoded' in props && props.encoded) {
      try {
        const raw = typeof window !== 'undefined' && window.atob ? window.atob(props.encoded) : props.encoded;
        setValue(extensionValue ? `${raw}|${extensionValue}` : raw);
      } catch {
        setValue(null);
      }
      return;
    }
    if ('e164' in props && props.e164) {
      setValue(extensionValue ? `${props.e164}|${extensionValue}` : props.e164);
      return;
    }
    if ('parts' in props && Array.isArray(props.parts)) {
      const joined = props.parts.join('');
      setValue(extensionValue ? `${joined}|${extensionValue}` : joined);
      return;
    }
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
        : (props.display ?? formatDisplayPhone(primary));

    return (
      <div className={wrapperClasses}>
        <div className="flex flex-wrap items-center gap-2" id="revealed-contact">
          <a href={href} className={revealedLinkClass} aria-label={`${props.variant} ${displayPretty}${ext ? ' extension ' + ext : ''}`} rel="nofollow noopener">
            <Icon className={iconClassName} aria-hidden="true" />
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
        className={buttonClassName}
        onClick={() => { decode(); setRevealed(true); }}
        aria-expanded={revealed}
        aria-controls="revealed-contact"
      >
        {props.variant === 'email'
          ? <Mail className={baseIconClass} aria-hidden="true" />
          : <Phone className={iconClassName} aria-hidden="true" />}
        <span>{label}</span>
      </button>
    </div>
  );
}
