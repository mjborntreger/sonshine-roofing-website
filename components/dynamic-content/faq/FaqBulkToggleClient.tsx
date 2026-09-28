'use client';

import { useEffect } from 'react';

/** The archive's answer list is server rendered and stays mounted while filtering. */
export function mountFaqBulkToggle() {
  const button = document.getElementById('faq-toggle-all');
  const root = document.getElementById('faq-topics');
  if (!(button instanceof HTMLButtonElement) || !root) return () => {};
  const visibleAnswers = () =>
    Array.from(root.querySelectorAll<HTMLDetailsElement>('details.faq-item')).filter(
      (answer) => !answer.hidden && !answer.closest('.faq-topic[hidden]'),
    );
  const update = () => {
    const answers = visibleAnswers();
    const allOpen = answers.length > 0 && answers.every((answer) => answer.open);
    button.disabled = answers.length === 0;
    button.dataset.state = allOpen ? 'expanded' : 'collapsed';
    button.setAttribute('aria-expanded', String(allOpen));
    const label = button.querySelector('[data-faq-toggle-label]');
    if (label) label.textContent = allOpen ? 'Collapse all' : 'Expand all';
    button.querySelector('[data-faq-toggle-icon="down"]')?.classList.toggle('hidden', allOpen);
    button.querySelector('[data-faq-toggle-icon="up"]')?.classList.toggle('hidden', !allOpen);
  };
  const toggle = () => {
    const answers = visibleAnswers();
    const open = !answers.every((answer) => answer.open);
    answers.forEach((answer) => {
      answer.open = open;
    });
    update();
  };
  button.addEventListener('click', toggle);
  root.addEventListener('toggle', update, true);
  window.addEventListener('faq:update', update);
  update();
  return () => {
    button.removeEventListener('click', toggle);
    root.removeEventListener('toggle', update, true);
    window.removeEventListener('faq:update', update);
  };
}

export default function FaqBulkToggleClient() {
  useEffect(mountFaqBulkToggle, []);
  return null;
}
