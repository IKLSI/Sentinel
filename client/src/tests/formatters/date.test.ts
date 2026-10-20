import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Language } from "@/enums";
import { formatElapsed, formatRelativeToNow } from "@/formatters/date";

const NOW = new Date("2026-10-20T12:00:00Z");

describe("formatRelativeToNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formate une date passée avec une majuscule initiale", () => {
    expect(formatRelativeToNow("2026-10-17T12:00:00Z", Language.Fr)).toBe(
      "Il y a 3 jours",
    );
  });

  it("utilise la langue demandée", () => {
    expect(formatRelativeToNow("2026-10-20T10:00:00Z", Language.En)).toBe(
      "2 hours ago",
    );
  });
});

describe("formatElapsed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renvoie la durée écoulée sans préfixe", () => {
    expect(formatElapsed("2026-10-20T11:55:00Z", Language.Fr)).toBe(
      "5 minutes",
    );
  });

  it("choisit la plus grande unité pertinente", () => {
    expect(formatElapsed("2026-08-20T12:00:00Z", Language.En)).toBe("2 months");
  });
});
