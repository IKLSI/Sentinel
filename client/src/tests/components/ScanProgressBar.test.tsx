import { describe, expect, it } from "vitest";
import { ScanProgressBar } from "@/components/ui/common/feedback/ScanProgressBar";
import { render, screen } from "@/tests/test-utils";

describe("ScanProgressBar", () => {
  it("affiche un segment par étape du scan", async () => {
    render(
      <ScanProgressBar
        progress={{
          projectId: "11111111-1111-1111-1111-111111111111",
          stage: "Manifests",
          step: 3,
          totalSteps: 6,
        }}
      />,
    );

    expect(
      (await screen.findByRole("status")).firstElementChild?.children,
    ).toHaveLength(6);
  });
});
