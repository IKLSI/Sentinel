import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/configs/apiClient", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: new Blob(["fake"]) }),
  },
}));

import apiClient from "@/configs/apiClient";
import { downloadExcel, downloadFromAbsoluteUrl } from "@/helpers/download";

type AnchorStub = {
  click: ReturnType<typeof vi.fn>;
  href: string;
  download: string;
};

function stubAnchor(): AnchorStub {
  const anchor: AnchorStub = { click: vi.fn(), href: "", download: "" };
  vi.spyOn(document, "createElement").mockReturnValue(
    anchor as unknown as HTMLAnchorElement,
  );
  return anchor;
}

function respondWith(headers?: Record<string, string>): void {
  vi.mocked(apiClient.get).mockResolvedValue({
    data: new Blob(["fake"]),
    headers,
  });
}

describe("downloadExcel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    respondWith();
    URL.createObjectURL = vi.fn(() => "blob:fake-url");
    URL.revokeObjectURL = vi.fn();
  });

  it("calls api with correct endpoint and params", async () => {
    await downloadExcel("/api/export", "file.xlsx", { from: "2025-01-01" });
    expect(apiClient.get).toHaveBeenCalledWith("/api/export", {
      params: { from: "2025-01-01" },
      responseType: "blob",
    });
  });

  it("creates and revokes object URL", async () => {
    await downloadExcel("/api/export", "file.xlsx");
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("triggers download click", async () => {
    const anchor = stubAnchor();

    await downloadExcel("/api/export", "rapport.xlsx");

    expect(anchor.click).toHaveBeenCalledOnce();
  });

  it("uses the server filename from content-disposition", async () => {
    respondWith({
      "content-disposition": 'attachment; filename="tickets-2026-08-07.xlsx"',
    });
    const anchor = stubAnchor();

    await downloadExcel("/api/export", "fallback.xlsx");

    expect(anchor.download).toBe("tickets-2026-08-07.xlsx");
  });

  it("decodes the rfc 5987 filename", async () => {
    respondWith({
      "content-disposition":
        "attachment; filename=\"sante-technique.xlsx\"; filename*=UTF-8''sant%C3%A9-technique.xlsx",
    });
    const anchor = stubAnchor();

    await downloadExcel("/api/export", "fallback.xlsx");

    expect(anchor.download).toBe("santé-technique.xlsx");
  });

  it("falls back when the encoded filename is malformed", async () => {
    respondWith({
      "content-disposition": "attachment; filename*=UTF-8''sant%E9.xlsx",
    });
    const anchor = stubAnchor();

    await downloadExcel("/api/export", "fallback.xlsx");

    expect(anchor.download).toBe("fallback.xlsx");
  });

  it("falls back when the header is missing", async () => {
    const anchor = stubAnchor();

    await downloadExcel("/api/export", "fallback.xlsx");

    expect(anchor.download).toBe("fallback.xlsx");
  });
});

describe("downloadFromAbsoluteUrl", () => {
  const attachmentId = "123e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({ data: new Blob(["fake"]) });
    URL.createObjectURL = vi.fn(() => "blob:fake-url");
    URL.revokeObjectURL = vi.fn();
  });

  it("rejects an external origin", async () => {
    await expect(
      downloadFromAbsoluteUrl("https://evil.example/x", "x.pdf"),
    ).rejects.toThrow();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("rejects a path outside ticket attachments", async () => {
    await expect(
      downloadFromAbsoluteUrl("/api/users", "x.pdf"),
    ).rejects.toThrow();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("downloads a ticket attachment of the API origin", async () => {
    await downloadFromAbsoluteUrl(
      `/api/tickets/${attachmentId}/attachments/${attachmentId}`,
      "x.pdf",
    );
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
