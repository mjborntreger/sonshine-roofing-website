import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// BuildKit mounts exist only for this RUN. Never persist their source file or values.
export function buildEnvironment(env, text) {
  if (!env.CONTENT_BUILD_ID?.trim()) throw new Error('CONTENT_BUILD_ID must identify this fresh content capture');
  let secret;
  try { secret = parseEnv(text); } catch { throw new Error('Build secret must use valid dotenv syntax'); }
  if (!secret.DIRECTUS_TOKEN?.trim()) throw new Error('Build secret DIRECTUS_TOKEN is required');
  return {
    ...env,
    DIRECTUS_TOKEN: secret.DIRECTUS_TOKEN,
    YOUTUBE_API_KEY: undefined,
    ...(secret.YOUTUBE_API_KEY?.trim() ? { YOUTUBE_API_KEY: secret.YOUTUBE_API_KEY } : {}),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let env;
  try {
    env = buildEnvironment(process.env, readFileSync('/run/secrets/build_env', 'utf8'));
  } catch (error) {
    console.error(error.code === 'ENOENT' ? 'BuildKit build_env secret mount is required' : error.message);
    process.exit(1);
  }
  const result = spawnSync('npm', ['run', 'build'], { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
