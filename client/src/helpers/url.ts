const PATH_PARAM_PATTERN = /:([A-Za-z_][A-Za-z0-9_]*)/g;

export type UrlParams = Record<string, unknown>;

export function buildUrl(urlTemplate: string, params: UrlParams = {}): string {
  const consumed = new Set<string>();

  const path = urlTemplate.replace(PATH_PARAM_PATTERN, (match, name) => {
    if (!(name in params)) return match;
    consumed.add(name);
    return encodeURIComponent(String(params[name]));
  });

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (consumed.has(key)) continue;
    if (value === undefined || value === null) continue;
    search.append(key, String(value));
  }

  const queryString = search.toString();

  return queryString ? `${path}?${queryString}` : path;
}
