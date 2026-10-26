import { STORAGE_KEYS } from "@/constants/storage";
import { decodeJwtPayload } from "@/helpers/accessToken";

const SESSION_ACTIVE_FLAG = "true";

let currentAccessToken: string | null = null;

export const getAccessToken = (): string | null => currentAccessToken;

const USER_ID_CLAIM = "userId";

export const subjectOf = (accessToken: string): string | null => {
  const subject = decodeJwtPayload(accessToken)?.[USER_ID_CLAIM];
  return typeof subject === "string" ? subject : null;
};

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
