import { describe, expect, it } from "vitest";
import { ScanProgressBar } from "@/components/ui/common/ScanProgressBar";
import { render, screen } from "@/tests/test-utils";

describe("ScanProgressBar", () => {
  it("affiche l'étape courante et sa position dans le scan", async () => {
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

    expect(await screen.findByRole("status")).toHaveTextContent("3/6");
  });
});
