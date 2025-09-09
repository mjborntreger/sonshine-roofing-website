

/**
 * Lightweight fuzzy helpers for glossary and search-like UIs.
 *
 * Shared between:
 *  - GlossaryQuickSearch (client)
 *  - Roofing glossary slug page (server) for "Did you mean" logic
 */

export type GlossaryItem = { title: string; slug: string };

/**
 * Normalize a string for matching: lowercase, strip diacritics, collapse non-alphanumerics.
 */
export function norm(input: string): string {
  const s = (input ?? '').toLowerCase();
  // Remove diacritics (accents) via NFKD + combining mark strip
  let out = s;
  try {
    out = s.normalize('NFKD');
  } catch {
    // older JS engines may not support normalize; ignore
  }
  out = out.replace(/[\u0300-\u036f]/g, ''); // combining marks
  out = out.replace(/[^a-z0-9]+/g, ' ').trim();
  return out;
}

/**
 * Levenshtein similarity scaled to [0..1].
 * 1 = identical, 0 = completely different.
 * Uses a compact DP buffer to keep it light for small strings.
 */
export function similarity(a: string, b: string): number {
  a = norm(a);
  b = norm(b);
  if (!a || !b) return 0;
  const m = a.length;
  const n = b.length;

  // DP table (m+1) x (n+1) flattened into a typed array
  const cols = n + 1;
  const dp = new Uint16Array((m + 1) * (n + 1));
  const idx = (i: number, j: number) => i * cols + j;

  for (let i = 0; i <= m; i++) dp[idx(i, 0)] = i;
  for (let j = 0; j <= n; j++) dp[idx(0, j)] = j;

  for (let i = 1; i <= m; i++) {
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cb = b.charCodeAt(j - 1);
      const cost = ca === cb ? 0 : 1;
      const del = dp[idx(i - 1, j)] + 1;
      const ins = dp[idx(i, j - 1)] + 1;
      const sub = dp[idx(i - 1, j - 1)] + cost;
      let v = del < ins ? del : ins;
      if (sub < v) v = sub;
      dp[idx(i, j)] = v;
    }
  }
  const dist = dp[idx(m, n)];
  const maxLen = Math.max(m, n) || 1;
  return 1 - dist / maxLen;
}

/**
 * Return top-N suggestions when exact/substring filtering yields no results.
 * We boost direct substring inclusion and break ties with similarity.
 */
export function suggest(q: string, items: GlossaryItem[], limit = 5): GlossaryItem[] {
  const s = norm(q);
  if (!s || !Array.isArray(items) || items.length === 0) return [];

  return items
    .map((t) => {
      const titleN = norm(t.title);
      const slugN = norm(t.slug);
      const inc = titleN.includes(s) || slugN.includes(s) ? 1 : 0; // strong signal
      const sim = similarity(s, titleN);
      const score = inc * 2 + sim; // weight inclusion higher than fuzzy alone
      return { t, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.t);
}

/**
 * Simple normalized substring filter, capped to a limit.
 */
export function filterContains(q: string, items: GlossaryItem[], limit = 50): GlossaryItem[] {
  const s = norm(q);
  if (!s) return items.slice(0, limit);
  const out: GlossaryItem[] = [];
  for (const t of items) {
    if (norm(t.title).includes(s)) {
      out.push(t);
      if (out.length >= limit) break;
    }
  }
  return out;
}