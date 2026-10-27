import type React from "react";
import Box from "@mui/material/Box";
import { Pagination } from "@/components/ui/common/table/Pagination";
import {
  VirtualTable,
  type VirtualTableColumn,
} from "@/components/ui/common/table/VirtualTable";
import { FilterBuilder } from "@/components/ui/forms/FilterBuilder";
import type { FilterFieldDefinition } from "@/components/ui/forms/FilterBuilder/types";
import { SearchInput } from "@/components/ui/forms/SearchInput";
import { useT } from "@/contexts/I18nContext";
import type { useGridControls } from "@/hooks/useGridControls";
import { PAGE_SIZE_OPTIONS } from "@/hooks/usePagination";
import { GRID_ROW_HEIGHT } from "@/features/projects/pages/ProjectDetailPage/constants";
import { buildGridFilterLabels } from "@/features/projects/pages/ProjectDetailPage/filters";

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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          mb: "16px",
          flexShrink: 0,
          position: "relative",
          zIndex: 2,
        }}
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t("tech_health.search_placeholder")}
        />

        <FilterBuilder
          fields={fields}
          value={criterion}
          onChange={setCriterion}
          labels={buildGridFilterLabels(t)}
        />

        {action && (
          <Box
            sx={{
              ml: "auto",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {action}
          </Box>
        )}
      </Box>

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
