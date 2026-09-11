const ID = /^[A-Za-z0-9_-]{11}$/u;

export function extractYouTubeId(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);
    let id = null;
    if (['youtu.be', 'www.youtu.be'].includes(host) && parts.length === 1) id = parts[0];
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
      if (url.pathname === '/watch' && url.searchParams.getAll('v').length === 1) id = url.searchParams.get('v');
      if (parts.length === 2 && ['embed', 'shorts', 'v', 'live'].includes(parts[0])) id = parts[1];
    }
    if (['youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host) && parts.length === 2 && parts[0] === 'embed') id = parts[1];
    return id && ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function youtubeThumb(id) {
  if (!ID.test(id)) throw new Error('YouTube thumbnail requires a valid video identity.');
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeWatchUrl(id) {
  if (!ID.test(id)) throw new Error('YouTube link requires a valid video identity.');
  return `https://www.youtube.com/watch?v=${id}`;
}
