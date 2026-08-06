const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/g;
const EDGE_DASH_PATTERN = /^-+|-+$/g;
const ISO_DATE_LENGTH = 10;
const SLUG_FALLBACK = "projet";

export const toIsoDate = (date: Date = new Date()): string =>
  date.toISOString().slice(0, ISO_DATE_LENGTH);

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_PATTERN, "-")
    .replace(EDGE_DASH_PATTERN, "") || SLUG_FALLBACK;
