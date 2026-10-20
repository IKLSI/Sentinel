import { describe, expect, it } from "vitest";
import {
  buildBadgeMarkdown,
  buildProjectBadgePath,
} from "@/domains/publicScan/helpers";

describe("buildProjectBadgePath", () => {
  it("construit le chemin du badge à partir du jeton", () => {
    expect(buildProjectBadgePath("abc_DEF-123")).toBe(
      "/api/public/badge/abc_DEF-123.svg",
    );
  });
});

describe("buildBadgeMarkdown", () => {
  it("assemble l'image du badge et le lien vers la page de scan", () => {
    expect(
      buildBadgeMarkdown(
        "https://sentinel.example",
        "/api/public/badge/abc.svg",
        "/scan",
      ),
    ).toBe(
      "[![Sentinel](https://sentinel.example/api/public/badge/abc.svg)](https://sentinel.example/scan)",
    );
  });
});
