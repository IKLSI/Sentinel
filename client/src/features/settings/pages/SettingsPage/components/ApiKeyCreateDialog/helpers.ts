const API_KEY_MAX_LIFETIME_DAYS = 365;
const API_KEY_DEFAULT_LIFETIME_DAYS = 90;

const isoDateInDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

export const minExpirationDate = (): string => isoDateInDays(1);

export const maxExpirationDate = (): string =>
  isoDateInDays(API_KEY_MAX_LIFETIME_DAYS - 1);

export const defaultExpirationDate = (): string =>
  isoDateInDays(API_KEY_DEFAULT_LIFETIME_DAYS);
