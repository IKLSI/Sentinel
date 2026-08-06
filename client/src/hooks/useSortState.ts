import { useCallback, useState } from "react";
import { SortDirection } from "@/enums";

export interface SortState<TCol extends string> {
  col: TCol;
  dir: SortDirection;
}

export function useSortState<TCol extends string>(
  initial: SortState<TCol>,
  onChange?: () => void,
) {
  const [sort, setSort] = useState<SortState<TCol>>(initial);

  const toggleSort = useCallback(
    (col: TCol) => {
      setSort((s) =>
        s.col === col
          ? {
              col,
              dir:
                s.dir === SortDirection.Asc
                  ? SortDirection.Desc
                  : SortDirection.Asc,
            }
          : { col, dir: SortDirection.Asc },
      );
      onChange?.();
    },
    [onChange],
  );

  return [sort, toggleSort] as const;
}
