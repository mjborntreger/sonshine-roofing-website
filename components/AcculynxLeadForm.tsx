'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

// Declare the globals Turnstile attaches to window
declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
    turnstile?: {
      execute: (container: string | HTMLElement, params: Record<string, unknown>) => void;
      reset?: (container?: string | HTMLElement) => void;
      getResponse?: (container?: string | HTMLElement) => string | undefined;
    };
  }
}

export default function AcculynxLeadForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const isSubmittingRef = useRef(false);

  // Expose the callback Turnstile will call
  useEffect(() => {
    window.onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
      const form = formRef.current;
      if (!form) return;
      let hidden = form.querySelector<HTMLInputElement>('#cf-turnstile-response');
      if (!hidden) {
        hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'RecaptchaToken';
        hidden.id = 'cf-turnstile-response';
        form.appendChild(hidden);
      }
      hidden.value = token;

      // Continue submission automatically after token is issued
      try {
        form.requestSubmit();
      } catch {
        // Fallback if requestSubmit unsupported
        (form as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    };
  }, []);

  const doSubmit = () => {
    const form = formRef.current;
    if (!form) return;

    const submitBtn = form.querySelector<HTMLInputElement>('.webLeadForm__submit');
    if (submitBtn) submitBtn.disabled = true;

    const leadData = new FormData(form);
    leadData.append('RecaptchaToken', turnstileToken);

    isSubmittingRef.current = true;
    fetch('https://leads.acculynx.com/api/leads/submit-new-lead?formID=af406c5e-9d45-42a0-aa3c-eef2ee624d6e', {
      method: 'POST',
      mode: 'no-cors',
      body: leadData,
    })
      .then(() => {
        setSubmitted(true);
        (form as HTMLFormElement).style.visibility = 'hidden';
        setTimeout(() => {
          window.location.href = '/thank-you';
        }, 1500);
      })
      .catch((error) => {
        console.error('Submission error:', error);
        if (submitBtn) submitBtn.disabled = false;
      })
      .finally(() => {
        isSubmittingRef.current = false;
      });
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingRef.current) return;
    const form = formRef.current;
    if (!form) return;

    const submitBtn = form.querySelector<HTMLInputElement>('.webLeadForm__submit');
    if (submitBtn) submitBtn.disabled = true;

    // If token missing, trigger the invisible Turnstile challenge
    if (!turnstileToken || turnstileToken.length < 10) {
      if (typeof window !== 'undefined' && window.turnstile && typeof window.turnstile.execute === 'function') {
        const container = widgetRef.current as HTMLDivElement;
        try {
          window.turnstile.execute(container, { action: 'submit' });
        } catch (e) {
          console.error('Turnstile execute error:', e);
          if (submitBtn) submitBtn.disabled = false;
        }
      }
      return;
    }
    // Token available: submit immediately
    doSubmit();
  };

  return (
    <div className="webLeadForm__outerDiv">
      <form id="webLeadFormElem" ref={formRef} className="webLeadForm__form" onSubmit={onSubmit}>
        {/* Form Fields */}
        <div className="webLeadForm__fieldDiv">
          <div className="webLeadForm__label"><label htmlFor="FirstName">First Name *</label></div>
          <div className="webLeadForm__inputDiv"><input className="webLeadForm__input" id="FirstName" type="text" maxLength={255} name="FirstName" required autoComplete="given-name" /></div>
        </div>

        <div className="webLeadForm__fieldDiv">
          <div className="webLeadForm__label"><label htmlFor="LastName">Last Name *</label></div>
          <div className="webLeadForm__inputDiv"><input className="webLeadForm__input" id="LastName" type="text" maxLength={255} name="LastName" required autoComplete="family-name" /></div>
        </div>

        <div className="webLeadForm__fieldDiv">
          <div className="webLeadForm__label"><label htmlFor="Email">Email *</label></div>
          <div className="webLeadForm__inputDiv"><input className="webLeadForm__input" id="Email" type="email" maxLength={255} name="Email" required autoComplete="email" /></div>
        </div>

        <div className="webLeadForm__fieldDiv">
          <div className="webLeadForm__label"><label htmlFor="Phone">Phone *</label></div>
          <div className="webLeadForm__inputDiv"><input className="webLeadForm__input" id="Phone" type="tel" maxLength={255} name="Phone" required autoComplete="tel" /></div>
        </div>

        <div className="webLeadForm__fieldDiv">
          <div className="webLeadForm__label"><label htmlFor="Street">Street *</label></div>
          <div className="webLeadForm__inputDiv"><input className="webLeadForm__input" id="Street" type="text" maxLength={255} name="Street" required autoComplete="street-address" /></div>
        </div>

        <div className="webLeadForm__fieldDiv">
          <div className="webLeadForm__label"><label htmlFor="City">City *</label></div>
          <div className="webLeadForm__inputDiv"><input className="webLeadForm__input" id="City" type="text" maxLength={255} name="City" required autoComplete="address-level2" /></div>
        </div>

        <div className="webLeadForm__stateZipDiv">
          <div className="webLeadForm__fieldDiv">
            <div className="webLeadForm__label"><label htmlFor="State">State / Prov *</label></div>
            <div className="webLeadForm__inputDiv"><input className="webLeadForm__input" id="State" type="text" maxLength={255} name="State" required autoComplete="address-level1" /></div>
          </div>
          <div className="webLeadForm__fieldDiv">
            <div className="webLeadForm__label"><label htmlFor="Zip">Zip *</label></div>
            <div className="webLeadForm__inputDiv"><input className="webLeadForm__input" id="Zip" type="text" maxLength={255} name="Zip" required autoComplete="postal-code" /></div>
          </div>
        </div>

        <div className="webLeadForm__fieldDiv">
          <div className="webLeadForm__label"><label htmlFor="Message">Message</label></div>
          <div className="webLeadForm__inputDiv"><textarea className="webLeadForm__input" id="Message" maxLength={255} rows={3} name="Message" autoComplete="off" /></div>
        </div>

        {/* ✅ Turnstile Widget */}
        <div
          className="cf-turnstile"
          data-sitekey="0x4AAAAAABlvFrEjveFRt-q1"
          data-callback="onTurnstileSuccess"
          data-theme="light"
          data-size="invisible"
          ref={widgetRef}
        />

        <div className="webLeadForm__submitDiv">
          <input id="LeadFormSubmit" className="webLeadForm__submit" type="submit" value="Submit" name="submit" />
          <span className="webLeadForm__label webLeadForm__requiredLabel"> * Required </span>
        </div>
      </form>

      <div id="webLeadFormMessageElem" className="webLeadForm__messageSentDiv" style={{ display: submitted ? 'flex' : 'none' }}>
        <div className="webLeadForm__messageSent">Your message was sent!</div>
        <div className="webLeadForm__successMessage">Redirecting...</div>
      </div>

      {/* ✅ Load Turnstile JS */}
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />

      {/* Styles scoped to this component */}
      <style jsx>{`
        .webLeadForm__outerDiv {
          width: 100%;
          background-color: #CEF3FF;
          border: 1px solid #0045d7;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0,0,0,.06);
          color: #000000;
          position: relative;
          padding-top: 20px;
          padding-bottom: 20px;
          font-family: 'Roboto', Arial, Helvetica, sans-serif;
        }
        .webLeadForm__form { margin: 0; width: 100%; }
        .webLeadForm__fieldDiv { margin: 0 20px 15px 20px; }
        .webLeadForm__messageSentDiv {
          display: none;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          text-align: center;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          background: transparent;
        }
        .webLeadForm__messageSent { font-weight: bold; font-size: 18px; }
        .webLeadForm__successMessage { font-size: 13px; margin-top: 20px; }
        .webLeadForm__label { padding-bottom: 4px; font-size: 13px; font-weight: 600; text-transform: uppercase; }
        .webLeadForm__inputDiv { display: flex; justify-content: center; align-items: center; }
        .webLeadForm__input {
          width: 100%;
          border-radius: 6px;
          border: none;
          font-size: 18px;
          padding-left: 5px;
          padding-right: 5px;
        }
        input.webLeadForm__input { height: 40px; }
        textarea.webLeadForm__input { font-family: inherit; padding-top: 5px; padding-bottom: 5px; resize: none; }
        .webLeadForm__stateZipDiv { display: flex; justify-content: space-between; align-items: center; flex-wrap: nowrap; margin: 0 20px 15px 20px; }
        .webLeadForm__stateZipDiv .webLeadForm__fieldDiv:first-child { margin: 0 10px 0 0; width: 50%; }
        .webLeadForm__stateZipDiv .webLeadForm__fieldDiv:last-child { margin: 0 0 0 10px; width: 50%; }
        .webLeadForm__submitDiv { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: nowrap; }
        .webLeadForm__submit { background-color: #FB9216; color: #FFFFFF; margin-left: 20px; padding: 8px 20px; font-size: 13px; font-weight: 600; border-radius: 6px; border: none; cursor: pointer; text-transform: uppercase; }
        .webLeadForm__requiredLabel { font-size: 11px; padding: 0; margin-right: 20px; }
      `}</style>
    </div>
  );
}
