import { describe, expect, it } from "vitest";
import { TableSkeletonRows } from "@/components/ui/common/table/TableSkeletonRows";
import { render } from "@/tests/test-utils";

describe("TableSkeletonRows", () => {
  it("rend une cellule par colonne sur chaque ligne", () => {
    const { container } = render(
      <table>
        <tbody>
          <TableSkeletonRows cells={["title", "chip", "empty"]} rows={2} />
        </tbody>
      </table>,
    );

    expect(container.querySelectorAll("tr")).toHaveLength(2);
    expect(container.querySelectorAll("td")).toHaveLength(6);
  });

  it("ne dessine rien dans une colonne vide", () => {
    const { container } = render(
      <table>
        <tbody>
          <TableSkeletonRows cells={["empty"]} rows={1} />
        </tbody>
      </table>,
    );

    expect(container.querySelector(".MuiSkeleton-root")).toBeNull();
  });
});
