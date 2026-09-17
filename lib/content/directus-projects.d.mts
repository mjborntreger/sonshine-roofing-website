export type DirectusBuildConfig = { url: string; clientSlug: string; token: string };

export function directusBuildConfig(env?: Record<string, string | undefined>): DirectusBuildConfig;

export function readDirectusCollection<T = Record<string, unknown>>(
  config: DirectusBuildConfig,
  fetcher: typeof fetch,
  collection: string,
  fields: readonly string[],
  options?: { filter?: Record<string, unknown>; deep?: Record<string, unknown> },
): Promise<T[]>;
