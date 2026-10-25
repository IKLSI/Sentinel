import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePagination } from "@/hooks/usePagination";

describe("usePagination", () => {
  it("démarre à la page 1 avec 25 lignes", () => {
    const { result } = renderHook(() => usePagination());
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(25);
  });

  it("revient à la page 1 avec resetPage", () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.setPage(4));
    act(() => result.current.resetPage());
    expect(result.current.page).toBe(1);
  });

  it("revient à la page 1 quand la taille change", () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.setPage(3));
    act(() => result.current.setPageSize(50));
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(50);
  });
});
