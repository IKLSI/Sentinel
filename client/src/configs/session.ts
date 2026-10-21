import { STORAGE_KEYS } from "@/constants/storage";

const SESSION_ACTIVE_FLAG = "true";

let currentAccessToken: string | null = null;

export const getAccessToken = (): string | null => currentAccessToken;

export const startSession = (accessToken: string): void => {
  currentAccessToken = accessToken;
  localStorage.setItem(STORAGE_KEYS.SESSION_ACTIVE, SESSION_ACTIVE_FLAG);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_ACCESS_TOKEN);
};

export const endSession = (): void => {
  currentAccessToken = null;
  localStorage.removeItem(STORAGE_KEYS.SESSION_ACTIVE);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_ACCESS_TOKEN);
};

export const hasPersistedSession = (): boolean =>
  localStorage.getItem(STORAGE_KEYS.SESSION_ACTIVE) === SESSION_ACTIVE_FLAG ||
  localStorage.getItem(STORAGE_KEYS.LEGACY_ACCESS_TOKEN) !== null;
