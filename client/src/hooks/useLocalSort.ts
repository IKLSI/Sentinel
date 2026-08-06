import { useCallback, useState } from "react";

interface LocalSortState {
  col: string;
  dir: "asc" | "desc";
}

export function useLocalSort(initial: LocalSortState | null = null) {
  const [sort, setSort] = useState<LocalSortState | null>(initial);

  const toggleSort = useCallback((col: string) => {
    setSort((s) => {
      if (s?.col !== col) return { col, dir: "asc" };
      return { col, dir: s.dir === "asc" ? "desc" : "asc" };
    });
  }, []);

  return [sort, toggleSort] as const;
}
