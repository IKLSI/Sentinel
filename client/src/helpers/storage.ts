export const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
};

export const readStoredValue = <T extends string>(
  key: string,
  allowed: Record<string, T>,
): T | null => {
  const stored = readStorage(key);
  return Object.values(allowed).find((value) => value === stored) ?? null;
};
