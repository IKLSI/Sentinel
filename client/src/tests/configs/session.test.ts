import { afterEach, describe, expect, it } from "vitest";
import {
  endSession,
  getAccessToken,
  hasPersistedSession,
  startSession,
} from "@/configs/session";
import { STORAGE_KEYS } from "@/constants/storage";

describe("session", () => {
  afterEach(() => endSession());

  it("keeps the access token in memory only", () => {
    startSession("token");

    expect(getAccessToken()).toBe("token");
    expect(Object.values(localStorage)).not.toContain("token");
    expect(hasPersistedSession()).toBe(true);
  });

  it("forgets the token and the session hint on end", () => {
    startSession("token");
    endSession();

    expect(getAccessToken()).toBeNull();
    expect(hasPersistedSession()).toBe(false);
  });

  it("treats a legacy stored token as a session to restore, then removes it", () => {
    localStorage.setItem(STORAGE_KEYS.LEGACY_ACCESS_TOKEN, "legacy");

    expect(hasPersistedSession()).toBe(true);

    startSession("fresh");

    expect(localStorage.getItem(STORAGE_KEYS.LEGACY_ACCESS_TOKEN)).toBeNull();
  });
});
