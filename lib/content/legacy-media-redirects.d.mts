export type LegacyMediaRedirect = {
  sourcePath: string;
  destination: string;
  statusCode: number;
  wildcard: boolean;
  preserveQuery: boolean;
};
export function isLegacyMediaPath(pathname: string): boolean;
export const nonMediaLegacyRedirects: {
  source: string;
  destination: string;
  permanent: boolean;
}[];
export function resolveLegacyMediaRedirect(
  requestUrl: string,
  rules: LegacyMediaRedirect[],
): { destination: string; statusCode: number } | null;
