import { describe, expect, it } from "vitest";
import { ListSkeleton } from "@/components/ui/common/ListSkeleton";
import { render } from "@/tests/test-utils";

describe("ListSkeleton", () => {
  it("rend le nombre de lignes demandé et signale le chargement", () => {
    const { container } = render(<ListSkeleton rows={3} />);

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelectorAll(".MuiSkeleton-root")).toHaveLength(3);
  });

  it("affiche 6 lignes par défaut", () => {
    const { container } = render(<ListSkeleton />);

    expect(container.querySelectorAll(".MuiSkeleton-root")).toHaveLength(6);
  });
});
