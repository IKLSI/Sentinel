import { afterEach, describe, expect, it } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import apiClient from "@/configs/apiClient";
import { endSession, startSession } from "@/configs/session";

const sentAuthorization = async (url: string): Promise<unknown> => {
  let authorization: unknown;
  await apiClient.get(url, {
    adapter: async (config: InternalAxiosRequestConfig) => {
      authorization = config.headers.Authorization;
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    },
  });
  return authorization;
};

describe("apiClient", () => {
  afterEach(() => endSession());

  it("sends the access token to relative API paths", async () => {
    startSession("secret");

    expect(await sentAuthorization("/api/auth/me")).toBe("Bearer secret");
  });

  it("never sends the access token to another origin", async () => {
    startSession("secret");

    expect(await sentAuthorization("https://evil.example/x")).toBeUndefined();
  });
});
