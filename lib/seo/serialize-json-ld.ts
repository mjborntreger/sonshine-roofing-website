export function serializeJsonLd(data: unknown): string {
  const serialized = JSON.stringify(data) ?? 'null';

  return serialized
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
