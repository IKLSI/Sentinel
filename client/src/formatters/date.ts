import type { Language } from "@/enums";

const UNIT_SECONDS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

function largestUnit(iso: string): {
  unit: Intl.RelativeTimeFormatUnit;
  value: number;
} {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const [unit, size] =
    UNIT_SECONDS.find(([, size]) => Math.abs(seconds) >= size) ??
    UNIT_SECONDS[UNIT_SECONDS.length - 1];

  return { unit, value: Math.round(seconds / size) };
}

export function formatRelativeToNow(iso: string, culture: Language): string {
  const { unit, value } = largestUnit(iso);
  const relative = new Intl.RelativeTimeFormat(culture, {
    numeric: "auto",
  }).format(value, unit);

  return relative.charAt(0).toUpperCase() + relative.slice(1);
}

export function formatElapsed(iso: string, culture: Language): string {
  const { unit, value } = largestUnit(iso);

  return new Intl.NumberFormat(culture, {
    style: "unit",
    unit,
    unitDisplay: "long",
  }).format(Math.abs(value));
}

export function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
