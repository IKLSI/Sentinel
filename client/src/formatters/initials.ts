const SEPARATOR_PATTERN = /[\s\-_]+/;
const INITIALS_LENGTH = 2;

export const initialsFromName = (name?: string | null): string =>
  (name ?? "")
    .split(SEPARATOR_PATTERN)
    .filter(Boolean)
    .slice(0, INITIALS_LENGTH)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
