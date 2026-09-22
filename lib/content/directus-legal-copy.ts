import 'server-only';
import { deployedEditorial } from './editorial';
import type { LegalCopy } from './editorial-types';
export type { LegalCopy } from './editorial-types';
export async function getLegalCopy(): Promise<LegalCopy> {
  return deployedEditorial().legalCopy;
}
