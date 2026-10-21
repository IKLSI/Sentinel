const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const ISO_DATE_LENGTH = 10;

export const hoursAgo = (hours: number): string =>
  new Date(Date.now() - hours * HOUR_MS).toISOString();

export const daysAgo = (days: number): string => hoursAgo(days * 24);

export const isoDateDaysAgo = (days: number): string =>
  daysAgo(days).slice(0, ISO_DATE_LENGTH);

export const daysUntil = (isoDate: string): number =>
  Math.round((Date.parse(isoDate) - Date.now()) / DAY_MS);
