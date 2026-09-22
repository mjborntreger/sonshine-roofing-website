import { createHash } from 'node:crypto';

// Preserve the historical namespace: existing file identities depend on it.
const NAMESPACE = 'location-migration-v1';

export function stableId(key) {
  const h = createHash('sha256').update(`${NAMESPACE}:${key}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
