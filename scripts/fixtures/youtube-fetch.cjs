'use strict';

// Exercise the optional production-key branch without credentials or API access.
if (process.env.DEPLOYMENT_FIXTURE !== '1') throw new Error('Synthetic build only');
const { appendFileSync } = require('node:fs');
const nativeFetch = globalThis.fetch;
globalThis.fetch = async function fixtureYouTubeFetch(input, init) {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.origin !== 'https://www.googleapis.com' || url.pathname !== '/youtube/v3/videos')
    return nativeFetch(input, init);
  appendFileSync(process.env.CONTENT_BUILD_AUDIT, '1\n');
  return Response.json({
    items: (url.searchParams.get('id') || '').split(',').map((id) => ({
      id,
      snippet: { publishedAt: '2020-01-01T12:00:00Z', title: 'Synthetic video', thumbnails: {} },
    })),
  });
};
