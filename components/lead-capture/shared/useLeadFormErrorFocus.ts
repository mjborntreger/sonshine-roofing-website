'use client';

import { useEffect, useReducer, useRef } from 'react';

/** Request focus after setting submission errors, once React has rendered them. */
export function useLeadFormErrorFocus() {
  const formRef = useRef<HTMLFormElement>(null);
  const [focusRequest, focusErrors] = useReducer((request: number) => request + 1, 0);

  useEffect(() => {
    if (!focusRequest) return;
    const form = formRef.current;
    if (!form) return;

    const invalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    const controlSelector = 'input:not([type="hidden"]), select, textarea, button';
    const control = invalid?.matches(controlSelector)
      ? invalid
      : invalid?.querySelector<HTMLElement>(controlSelector);
    const target = control ?? form.querySelector<HTMLElement>('[role="alert"]');
    target?.focus({ preventScroll: true });
    // Scroll the entire question into view, including when its radio is visually hidden.
    (control ? invalid : target)?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, [focusRequest]);

  return { formRef, focusErrors };
}
