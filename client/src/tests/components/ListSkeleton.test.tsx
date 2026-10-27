import { describe, expect, it } from "vitest";
import { ListSkeleton } from "@/components/ui/common/feedback/ListSkeleton";
import { render } from "@/tests/test-utils";

const SHAPES_PER_ROW = 4;

describe("ListSkeleton", () => {
  it("rend le nombre de lignes demandé", () => {
    const { container } = render(<ListSkeleton rows={3} />);

    expect(container.querySelectorAll(".MuiSkeleton-root")).toHaveLength(
      3 * SHAPES_PER_ROW,
    );
  });

  it("affiche 6 lignes par défaut", () => {
    const { container } = render(<ListSkeleton />);

    expect(container.querySelectorAll(".MuiSkeleton-root")).toHaveLength(
      6 * SHAPES_PER_ROW,
    );
  });
});
