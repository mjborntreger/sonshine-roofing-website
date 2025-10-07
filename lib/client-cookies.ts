export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? match.split('=').slice(1).join('=') : null;
}

export function writeCookie(name: string, value: string, maxAgeSeconds: number, options: { path?: string } = {}) {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  const path = options.path || '/';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=${path}; SameSite=Lax${secure}`;
}

export function deleteCookie(name: string, options: { path?: string } = {}) {
  if (typeof document === 'undefined') return;
  const path = options.path || '/';
  document.cookie = `${name}=; Max-Age=0; Path=${path}; SameSite=Lax`;
}
