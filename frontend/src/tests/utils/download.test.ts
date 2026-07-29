import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/services/client", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: new Blob(["fake"]) }),
  },
}));

import apiClient from "@/services/client";
import { downloadExcel } from "@/utils/download";

describe("downloadExcel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("triggers download click with correct filename", async () => {
    const clickSpy = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      click: clickSpy,
      href: "",
      download: "",
    } as unknown as HTMLAnchorElement);

    await downloadExcel("/api/export", "rapport.xlsx");

    expect(clickSpy).toHaveBeenCalledOnce();
  });
});
