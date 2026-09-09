export type ArchiveFilterGroup = {
  key: string;
  label: string;
  paramKey: string;
  options: Array<{ slug: string; label: string }>;
  enabledWhen?: { key: string; values: string[] };
};

export type ArchiveFilters = {
  search: string;
  selections: Record<string, string>;
};

export function isArchiveFilterEnabled(
  group: ArchiveFilterGroup,
  filters: ArchiveFilters,
): boolean {
  return (
    !group.enabledWhen ||
    group.enabledWhen.values.includes(filters.selections[group.enabledWhen.key] ?? '')
  );
}

export function normalizeArchiveFilters(
  filters: ArchiveFilters,
  groups: ArchiveFilterGroup[],
  minSearchLength = 2,
): ArchiveFilters {
  const search = filters.search.trim();
  const normalized: ArchiveFilters = {
    search: search.length >= minSearchLength ? search : '',
    selections: {},
  };
  for (const group of groups) {
    const value = (filters.selections[group.key] ?? '').trim().toLowerCase();
    normalized.selections[group.key] =
      group.options.find((option) => option.slug.toLowerCase() === value)?.slug ?? '';
  }
  for (const group of groups) {
    if (!isArchiveFilterEnabled(group, normalized)) normalized.selections[group.key] = '';
  }
  return normalized;
}

export function readArchiveFilters(
  params: URLSearchParams,
  groups: ArchiveFilterGroup[],
  minSearchLength = 2,
  searchParamKey = 'q',
): { filters: ArchiveFilters; adjustedLegacyLink: boolean } {
  const selections: Record<string, string> = {};
  let adjustedLegacyLink = false;
  for (const group of groups) {
    const values = params
      .getAll(group.paramKey)
      .flatMap((value) => value.split(','))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (new Set(values).size > 1) adjustedLegacyLink = true;
    selections[group.key] =
      values.find((value) => group.options.some((option) => option.slug.toLowerCase() === value)) ??
      '';
  }
  return {
    filters: normalizeArchiveFilters(
      { search: params.get(searchParamKey) ?? '', selections },
      groups,
      minSearchLength,
    ),
    adjustedLegacyLink,
  };
}

// Keep unrelated query parameters (including shared-video links) intact.
export function writeArchiveFilters(
  params: URLSearchParams,
  filters: ArchiveFilters,
  groups: ArchiveFilterGroup[],
  searchParamKey = 'q',
): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete(searchParamKey);
  for (const group of groups) next.delete(group.paramKey);
  if (filters.search) next.set(searchParamKey, filters.search);
  for (const group of groups) {
    const value = filters.selections[group.key];
    if (value) next.set(group.paramKey, value);
  }
  return next;
}

export function archiveLocationKey(
  params: URLSearchParams,
  groups: ArchiveFilterGroup[],
  searchParamKey = 'q',
): string {
  return JSON.stringify([
    params.getAll(searchParamKey),
    ...groups.map((group) => params.getAll(group.paramKey)),
  ]);
}

export function archivePayloadInput(filters: ArchiveFilters): {
  search: string;
  selections: Record<string, string[]>;
} {
  return {
    search: filters.search,
    selections: Object.fromEntries(
      Object.entries(filters.selections).map(([key, value]) => [key, value ? [value] : []]),
    ),
  };
}
