const EXPIRY_MARGIN_MS = 30_000;

export const decodeJwtPayload = (
  token: string,
): Record<string, unknown> | null => {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const claims: unknown = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof claims === "object" && claims !== null
      ? (claims as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const readExpiryMs = (token: string): number | null => {
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
};

export const isAccessTokenExpiring = (token: string): boolean => {
  const expiryMs = readExpiryMs(token);
  return expiryMs === null || expiryMs - Date.now() <= EXPIRY_MARGIN_MS;
};
