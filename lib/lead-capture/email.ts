export const MAX_EMAIL_LENGTH = 254;

export function isEmailComplete(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > MAX_EMAIL_LENGTH) return false;

  let atIndex = -1;
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (character.trim() === '') return false;
    if (character !== '@') continue;
    if (atIndex !== -1) return false;
    atIndex = index;
  }

  if (atIndex <= 0 || atIndex >= normalized.length - 1) return false;

  const domain = normalized.slice(atIndex + 1);
  const lastDotIndex = domain.lastIndexOf('.');
  return lastDotIndex > 0 && lastDotIndex < domain.length - 1;
}
