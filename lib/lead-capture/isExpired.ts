import { parseSpecialOfferDate } from './specialOfferDates';

export function isExpired(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const parsed = parseSpecialOfferDate(dateString);
  if (!parsed) return false;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfExpiration = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());

  return startOfExpiration.getTime() < startOfToday.getTime();
}

export default isExpired;
