import type React from "react";
import { Pagination } from "@/components/ui/common/Pagination";
import {
  VirtualTable,
  type VirtualTableColumn,
} from "@/components/ui/common/VirtualTable";
import type { FilterFieldDefinition } from "@/components/ui/forms/FilterBuilder/types";
import { useT } from "@/contexts/I18nContext";
import type { useGridControls } from "@/hooks/useGridControls";
import { PAGE_SIZE_OPTIONS } from "@/hooks/usePagination";
import { GRID_ROW_HEIGHT } from "@/features/techHealth/pages/ProjectDetailPage/helpers";
import { buildGridFilterLabels } from "@/features/techHealth/pages/ProjectDetailPage/filters";
import { GridToolbar } from "@/features/techHealth/pages/ProjectDetailPage/components/GridToolbar";

interface Props<T> {
  controls: ReturnType<typeof useGridControls<T>>;
  fields: FilterFieldDefinition[];
  columns: VirtualTableColumn[];
  getRowId: (row: T) => string;
  renderRow: (row: T, index: number) => React.ReactNode;
  countKeys: { singular: string; plural: string };
  action?: React.ReactNode;
}

export function FindingGrid<T>({
  controls,
  fields,
  columns,
  getRowId,
  renderRow,
  countKeys,
  action,
}: Props<T>) {
  const t = useT();
  const {
    search,
    setSearch,
    criterion,
    setCriterion,
    sort,
    toggleSort,
    visibleRows,
    pagedRows,
    pagination,
  } = controls;

  return (
    <>
      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        criterion={criterion}
        onCriterionChange={setCriterion}
        fields={fields}
        labels={buildGridFilterLabels(t)}
        action={action}
      />

      <VirtualTable<T>
        rows={pagedRows}
        getRowId={getRowId}
        columns={columns}
        estimateRowHeight={GRID_ROW_HEIGHT}
        sort={sort}
        onSortChange={toggleSort}
        noResultsLabel={t("tech_health.no_results")}
        footer={
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={visibleRows.length}
            onChange={pagination.setPage}
            pageSize={pagination.pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={pagination.setPageSize}
            countLabel={t(
              visibleRows.length > 1 ? countKeys.plural : countKeys.singular,
            )}
          />
        }
        renderRow={renderRow}
      />
    </>
  );
}
