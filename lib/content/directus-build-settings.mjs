let settingsPromise;

function requiredEnv(name, required) {
  const value = process.env[name]?.trim();
  if (!value && required) {
    throw new Error(`[directus-build-settings] Missing required environment variable: ${name}`);
  }
  return value || null;
}

async function fetchSettings() {
  const productionBuild = process.env.NODE_ENV === 'production';
  const directusUrl = requiredEnv('DIRECTUS_URL', productionBuild);
  const clientSlug = requiredEnv('DIRECTUS_CLIENT_SLUG', productionBuild);
  const token = requiredEnv('DIRECTUS_TOKEN', productionBuild);

  if (!directusUrl || !clientSlug || !token) return null;

  const url = new URL('items/site_settings', `${directusUrl.replace(/\/+$/, '')}/`);
  url.searchParams.set('fields', 'content_security_policy,llms_txt');
  url.searchParams.set('filter', JSON.stringify({ client: { slug: { _eq: clientSlug } } }));
  url.searchParams.set('limit', '2');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `[directus-build-settings] Directus site_settings HTTP ${response.status} ${response.statusText}`,
    );
  }

  const payload = await response.json();
  if (Array.isArray(payload.errors) && payload.errors.length) {
    throw new Error(
      payload.errors
        .map((error) => error?.message)
        .filter(Boolean)
        .join('; ') || '[directus-build-settings] Directus site_settings request failed.',
    );
  }

  const items = Array.isArray(payload.data) ? payload.data : [];
  if (items.length !== 1) {
    throw new Error(
      `[directus-build-settings] Expected exactly one site_settings record for "${clientSlug}"; found ${items.length}.`,
    );
  }

  const contentSecurityPolicy = items[0]?.content_security_policy?.trim();
  if (!contentSecurityPolicy && productionBuild) {
    throw new Error(
      '[directus-build-settings] site_settings.content_security_policy is required for production builds.',
    );
  }

  const llmsTxt =
    typeof items[0]?.llms_txt === 'string' && items[0].llms_txt.trim() ? items[0].llms_txt : '';

  return {
    contentSecurityPolicy: contentSecurityPolicy?.replace(/\s+/g, ' ') || '',
    llmsTxt,
  };
}

export function getDirectusBuildSettings() {
  settingsPromise ??= fetchSettings();
  return settingsPromise;
}
