import { useCallback, useState } from "react";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const DEFAULT_PAGE_SIZE = 25;

const FIRST_PAGE = 1;

export function usePagination(initialPageSize: number = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(FIRST_PAGE);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const resetPage = useCallback(() => setPage(FIRST_PAGE), []);

  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setPage(FIRST_PAGE);
  }, []);

  return { page, pageSize, setPage, setPageSize, resetPage };
}
