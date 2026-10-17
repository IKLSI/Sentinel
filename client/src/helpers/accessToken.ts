const EXPIRY_MARGIN_MS = 30_000;

const readExpiryMs = (token: string): number | null => {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: unknown };
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isAccessTokenExpiring = (token: string): boolean => {
  const expiryMs = readExpiryMs(token);
  return expiryMs === null || expiryMs - Date.now() <= EXPIRY_MARGIN_MS;
};
