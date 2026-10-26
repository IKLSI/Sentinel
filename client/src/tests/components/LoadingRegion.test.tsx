import { describe, expect, it } from "vitest";
import { LoadingRegion } from "@/components/ui/common/LoadingRegion";
import { render, screen } from "@/tests/test-utils";

describe("LoadingRegion", () => {
  it("signale le chargement et annonce son libellé", () => {
    const { container } = render(
      <LoadingRegion label="Chargement des projets…">
        <span>contenu</span>
      </LoadingRegion>,
    );

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Chargement des projets…",
    );
  });
});
