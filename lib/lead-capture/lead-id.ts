export function generateSriLeadId(): string {
  const cryptoApi = typeof crypto !== 'undefined' ? crypto : null;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `sri_${cryptoApi.randomUUID()}`;
  }

  const random = Math.random().toString(36).slice(2, 12);
  const timestamp = Date.now().toString(36);
  return `sri_${timestamp}_${random}`;
}
