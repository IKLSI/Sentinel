import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { usePagination } from "@/hooks/usePagination";
import type {
  FilterCriterion,
  FilterFieldDefinition,
} from "@/components/ui/forms/FilterBuilder/types";
import type { VirtualTableSort } from "@/components/ui/common/VirtualTable";

export interface GridFilterField<T> extends FilterFieldDefinition {
  valueOf: (row: T) => string;
}

interface Options<T> {
  rows: T[];
  searchableValues: (row: T) => (string | null | undefined)[];
  fields: GridFilterField<T>[];
  comparators: Record<string, (a: T, b: T) => number>;
  defaultSort: VirtualTableSort;
}

const DESCENDING = -1;

export function useGridControls<T>({
  rows,
  searchableValues,
  fields,
  comparators,
  defaultSort,
}: Options<T>) {
  const [search, setSearchState] = useState("");
  const [criterion, setCriterionState] = useState<FilterCriterion | null>(null);
  const [sort, setSort] = useState<VirtualTableSort>(defaultSort);
  const { page, pageSize, setPage, setPageSize, resetPage } = usePagination();

  const setSearch = useCallback(
    (value: string) => {
      setSearchState(value);
      resetPage();
    },
    [resetPage],
  );

  const setCriterion = useCallback(
    (value: FilterCriterion | null) => {
      setCriterionState(value);
      resetPage();
    },
    [resetPage],
  );

  const toggleSort = useCallback(
    (key: string) => {
      setSort((current) =>
        current.key === key
          ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
          : { key, direction: "desc" },
      );
      resetPage();
    },
    [resetPage],
  );

  const deferredSearch = useDeferredValue(search);

  const sortedRows = useMemo(() => {
    const comparator = comparators[sort.key];
    if (!comparator) return rows;

    const direction = sort.direction === "asc" ? 1 : DESCENDING;
    return [...rows].sort((a, b) => comparator(a, b) * direction);
  }, [rows, comparators, sort]);

  const visibleRows = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    const field = criterion
      ? fields.find((candidate) => candidate.key === criterion.field)
      : null;

    return sortedRows.filter((row) => {
      if (
        term &&
        !searchableValues(row).some((value) =>
          value?.toLowerCase().includes(term),
        )
      )
        return false;

      if (field && criterion?.values.length)
        return criterion.values.includes(field.valueOf(row));

      return true;
    });
  }, [sortedRows, deferredSearch, criterion, fields, searchableValues]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pagedRows = useMemo(
    () =>
      visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [visibleRows, currentPage, pageSize],
  );

  return {
    search,
    setSearch,
    criterion,
    setCriterion,
    sort,
    toggleSort,
    visibleRows,
    pagedRows,
    pagination: {
      page: currentPage,
      pageSize,
      totalPages,
      setPage,
      setPageSize,
    },
  };
}
