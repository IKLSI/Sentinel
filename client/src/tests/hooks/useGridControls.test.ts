import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGridControls } from "@/hooks/useGridControls";

interface Row {
  id: number;
  name: string;
}

const rows: Row[] = Array.from({ length: 60 }, (_, index) => ({
  id: index + 1,
  name: `lib-${index + 1}`,
}));

const options = {
  rows,
  searchableValues: (row: Row) => [row.name],
  fields: [],
  comparators: { id: (a: Row, b: Row) => a.id - b.id },
  defaultSort: { key: "id", direction: "asc" as const },
};

describe("useGridControls pagination", () => {
  it("découpe les lignes par page de 25", () => {
    const { result } = renderHook(() => useGridControls<Row>(options));

    expect(result.current.pagedRows).toHaveLength(25);
    expect(result.current.visibleRows).toHaveLength(60);
    expect(result.current.pagination.totalPages).toBe(3);
  });

  it("affiche la dernière page partielle", () => {
    const { result } = renderHook(() => useGridControls<Row>(options));

    act(() => result.current.pagination.setPage(3));

    expect(result.current.pagedRows).toHaveLength(10);
    expect(result.current.pagedRows[0].id).toBe(51);
  });

  it("revient à la page 1 quand la recherche change", () => {
    const { result } = renderHook(() => useGridControls<Row>(options));

    act(() => result.current.pagination.setPage(3));
    act(() => result.current.setSearch("lib-1"));

    expect(result.current.pagination.page).toBe(1);
  });

  it("applique la nouvelle taille de page", () => {
    const { result } = renderHook(() => useGridControls<Row>(options));

    act(() => result.current.pagination.setPageSize(50));

    expect(result.current.pagedRows).toHaveLength(50);
    expect(result.current.pagination.totalPages).toBe(2);
  });
});
