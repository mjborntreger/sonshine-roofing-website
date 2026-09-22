import { directusBuildConfig, readDirectusCollection } from './directus-projects.mjs';
import { isLegacyMediaPath } from './legacy-media-redirects.mjs';
const NEXT_REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`[directus-redirects] Published redirects.${field} is required.`);
  }
  return value.trim();
}

function readBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return fallback;
}

function readNumber(value, fallback) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePath(value) {
  const normalized = value.length > 1 ? value.replace(/\/+$/, '') : value;
  return normalized || '/';
}

function validateSource(value) {
  const source = requiredText(value, 'source_path');
  if (!source.startsWith('/') || source.startsWith('//')) {
    throw new Error(
      `[directus-redirects] Invalid source_path "${source}". Expected one leading slash.`,
    );
  }
  if (/[?#]/.test(source)) {
    throw new Error(
      `[directus-redirects] Invalid source_path "${source}". Queries and hashes are not allowed.`,
    );
  }

  if (source.includes('*')) {
    if (!source.endsWith('/*') || source.indexOf('*') !== source.length - 1) {
      throw new Error(
        `[directus-redirects] Invalid wildcard source_path "${source}". Use /prefix/*.`,
      );
    }
    const base = normalizePath(source.slice(0, -2));
    if (base === '/') {
      throw new Error('[directus-redirects] Root wildcard redirects are not allowed.');
    }
    return { sourcePath: `${base}/*`, sourceBase: base, wildcard: true };
  }

  return { sourcePath: normalizePath(source), sourceBase: null, wildcard: false };
}

function validateDestination(value, wildcard) {
  const destination = requiredText(value, 'destination_url');
  const wildcardCount = [...destination].filter((character) => character === '*').length;
  if (wildcardCount > 1 || (wildcardCount === 1 && !wildcard)) {
    throw new Error(
      `[directus-redirects] Invalid destination_url "${destination}" wildcard usage.`,
    );
  }

  if (destination.startsWith('/') && !destination.startsWith('//')) {
    return destination;
  }

  let external;
  try {
    external = new URL(destination);
  } catch {
    throw new Error(`[directus-redirects] Invalid destination_url "${destination}".`);
  }
  if (!['http:', 'https:'].includes(external.protocol)) {
    throw new Error(`[directus-redirects] Invalid destination_url protocol for "${destination}".`);
  }
  return external.toString();
}

function toNextRule(record, index, assetOrigin) {
  const source = validateSource(record.source_path);
  const destinationUrl = validateDestination(record.destination_url, source.wildcard);
  const statusCode = readNumber(record.status_code, 308);
  if (!NEXT_REDIRECT_STATUS_CODES.has(statusCode)) {
    throw new Error(
      `[directus-redirects] Unsupported Next.js status_code "${record.status_code}".`,
    );
  }
  const preserveQuery = readBoolean(record.preserve_query, true);
  const legacyMedia = isLegacyMediaPath(source.sourcePath);
  const nativeRelativeMedia = legacyMedia && destinationUrl.startsWith('/');
  if (nativeRelativeMedia && source.wildcard) {
    throw new Error(
      '[directus-redirects] Legacy media wildcard destinations must be absolute to preserve rule precedence.',
    );
  }
  if (legacyMedia && /[():[\]{}+\\]/.test(source.sourcePath)) {
    throw new Error(
      '[directus-redirects] Legacy media sources must be literal paths or /prefix/* wildcards.',
    );
  }
  const asset = !preserveQuery ? new URL(destinationUrl, assetOrigin) : null;
  if (
    !preserveQuery &&
    (!legacyMedia ||
      source.wildcard ||
      !source.sourcePath.startsWith('/wp-content/uploads/') ||
      !destinationUrl.startsWith(`${assetOrigin}/assets/`) ||
      asset.origin !== assetOrigin ||
      !/^\/assets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        asset.pathname,
      ) ||
      asset.search ||
      asset.hash)
  ) {
    throw new Error(
      '[directus-redirects] preserve_query=false requires an exact legacy upload path and a Directus asset destination.',
    );
  }

  const destinationPath = destinationUrl.startsWith('/')
    ? destinationUrl.split(/[?#]/, 1)[0]
    : null;
  if (!source.wildcard && destinationPath === source.sourcePath) {
    throw new Error(
      `[directus-redirects] Direct self-redirect "${source.sourcePath}" is not allowed.`,
    );
  }

  const parameter = 'directusPath';
  const nextSource = source.wildcard ? `${source.sourceBase}/:${parameter}(.+)` : source.sourcePath;
  const nextDestination =
    source.wildcard && destinationUrl.includes('*')
      ? destinationUrl.replaceAll('*', `:${parameter}`)
      : destinationUrl;

  return {
    sourcePath: source.sourcePath,
    source: nextSource,
    destination: nextDestination,
    statusCode,
    wildcard: source.wildcard,
    specificity: source.sourceBase?.length ?? source.sourcePath.length,
    sortOrder: readNumber(record.sort_order, Number.POSITIVE_INFINITY),
    index,
    legacyMedia,
    nativeRelativeMedia,
    preserveQuery,
    destinationUrl,
  };
}

function sortRules(left, right) {
  if (left.wildcard !== right.wildcard) return left.wildcard ? 1 : -1;
  if (left.specificity !== right.specificity) return right.specificity - left.specificity;
  if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
  return left.index - right.index;
}

export async function fetchDirectusRedirects(env = process.env, fetcher = fetch) {
  const config = directusBuildConfig(env);
  const rows = await readDirectusCollection(config, fetcher, 'redirects', [
    'client.slug',
    'source_path',
    'destination_url',
    'preserve_query',
    'status_code',
    'sort_order',
    'status',
  ]);
  if (rows.some((row) => row.client?.slug !== config.clientSlug || row.status !== 'published'))
    throw new Error('Redirect escaped published client scope.');
  const normalized = rows
    .sort(
      (a, b) =>
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
        a.source_path.localeCompare(b.source_path),
    )
    .map((row, index) => toNextRule(row, index, new URL(config.url).origin))
    .sort(sortRules);
  const sources = new Set();
  for (const rule of normalized) {
    const key = rule.legacyMedia ? rule.sourcePath.toLowerCase() : rule.sourcePath;
    if (sources.has(key)) {
      throw new Error(`[directus-redirects] Duplicate source_path "${rule.sourcePath}".`);
    }
    sources.add(key);
  }

  return {
    redirects: normalized
      // Next owns relative destinations so Proxy never has to infer the public
      // origin behind a reverse proxy. Exact rules still precede its wildcard.
      .filter((rule) => !rule.legacyMedia || rule.nativeRelativeMedia)
      .map(({ source, destination, statusCode }) => ({ source, destination, statusCode })),
    legacyMediaRedirects: normalized
      .filter((rule) => rule.legacyMedia && !rule.nativeRelativeMedia)
      .map(({ sourcePath, destinationUrl, statusCode, wildcard, preserveQuery }) => ({
        sourcePath,
        destination: destinationUrl,
        statusCode,
        wildcard,
        preserveQuery,
      })),
  };
}
