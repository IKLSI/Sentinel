export const pluralKey = (base: string, count: number) =>
  `${base}_${count === 1 ? "one" : "other"}`;
