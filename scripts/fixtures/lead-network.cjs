'use strict';
// Installed only by the isolated production verifier, never by the application.
if (process.env.LEAD_RUNTIME_FIXTURE !== '1') throw new Error('Isolated lead verifier only');
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.origin === process.env.N8N_WEBHOOK_URL) return nativeFetch(input, init);
  if (url.href === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
    if (process.env.TURNSTILE_LIVE_TEST === '1') return nativeFetch(input, init);
    const secret = new URLSearchParams(init.body).get('secret');
    return Response.json(secret.startsWith('1x') ? { success: true } : {
      success: false, 'error-codes': [secret.startsWith('3x') ? 'timeout-or-duplicate' : 'invalid-input-response'],
    });
  }
  throw new Error('Unexpected network destination in isolated lead runtime');
};
