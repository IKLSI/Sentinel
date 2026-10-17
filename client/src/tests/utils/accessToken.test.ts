import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isAccessTokenExpiring } from "@/helpers/accessToken";

const NOW = new Date("2026-10-16T12:00:00Z").getTime();

const tokenExpiringIn = (seconds: number): string => {
  const payload = btoa(
    JSON.stringify({ exp: Math.floor(NOW / 1000) + seconds }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${payload}.signature`;
};

describe("isAccessTokenExpiring", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should keep a token valid well beyond the margin", () => {
    expect(isAccessTokenExpiring(tokenExpiringIn(600))).toBe(false);
  });

  it("should flag a token expiring within the margin", () => {
    expect(isAccessTokenExpiring(tokenExpiringIn(10))).toBe(true);
  });

  it("should flag an expired token", () => {
    expect(isAccessTokenExpiring(tokenExpiringIn(-60))).toBe(true);
  });

  it("should flag a malformed token", () => {
    expect(isAccessTokenExpiring("not-a-jwt")).toBe(true);
  });
});
