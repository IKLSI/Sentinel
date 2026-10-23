import { afterEach, describe, expect, it, vi } from "vitest";
import { Theme } from "@/enums";
import { readStorage, readStoredValue, writeStorage } from "@/helpers/storage";

describe("storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns a stored value that belongs to the allowed set", () => {
    writeStorage("theme", Theme.Dark);

    expect(readStoredValue("theme", Theme)).toBe(Theme.Dark);
  });

  it("ignores a stored value outside the allowed set", () => {
    writeStorage("theme", "sepia");

    expect(readStoredValue("theme", Theme)).toBeNull();
  });

  it("returns null when storage access throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(readStorage("theme")).toBeNull();
  });

  it("swallows write failures", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(() => writeStorage("theme", Theme.Light)).not.toThrow();
  });
});
