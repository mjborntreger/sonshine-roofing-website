import { Parser } from 'htmlparser2';

/** Plain text for archive summaries and search, without rendering CMS markup. */
export function stripHtml(html: string): string {
  const text: string[] = [];
  let ignoredDepth = 0;
  const parser = new Parser(
    {
      onopentag(name) {
        if (ignoredDepth || name === 'script' || name === 'style' || name === 'template') {
          ignoredDepth++;
        }
        // Keep the existing archive word boundaries around markup.
        text.push(' ');
      },
      onclosetag() {
        if (ignoredDepth) ignoredDepth--;
        text.push(' ');
      },
      ontext(value) {
        if (!ignoredDepth) text.push(value);
      },
      oncomment() {
        text.push(' ');
      },
    },
    { decodeEntities: true },
  );
  parser.end(html);
  return text.join('').replace(/\s+/gu, ' ').trim();
}
