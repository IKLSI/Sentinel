import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { LoadErrorState } from "@/components/ui/common/LoadErrorState";
import { DeleteModal } from "@/components/ui/common/DeleteModal";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/hooks/useToast";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useT } from "@/contexts/I18nContext";
import { useProjectOptionsQuery } from "@/domains/projects/queries";
import { useExportTicketsExcelMutation } from "@/domains/tickets/downloads";
import { useTicketsQuery } from "@/domains/tickets/queries";
import type { TicketFilters } from "@/domains/tickets/types";
import { useUserOptionsQuery } from "@/domains/users/queries";
import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import {
  criterionFromSearch,
  queryFromCriterion,
  searchFromCriterion,
} from "@/features/tickets/pages/TicketsPage/filterParams";
import {
  useCreateTicketDialog,
  useDeleteTicketDialog,
  useEditTicketDialog,
} from "@/features/tickets/pages/TicketsPage/hooks";
import { TicketsToolbar } from "@/features/tickets/pages/TicketsPage/components/TicketsToolbar";
import {
  TicketsTable,
  type SortState,
} from "@/features/tickets/pages/TicketsPage/components/TicketsTable";
import { Pagination } from "@/components/ui/common/Pagination";
import { CreateTicketModal } from "@/features/tickets/pages/TicketsPage/components/CreateTicketModal";
import { EditTicketModal } from "@/features/tickets/pages/TicketsPage/components/EditTicketModal";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSortState } from "@/hooks/useSortState";
import { PAGE_SIZE_OPTIONS, usePagination } from "@/hooks/usePagination";
import { SortDirection, TicketSortField } from "@/enums";

const SEARCH_DEBOUNCE_MS = 300;

const routeApi = getRouteApi("/_authenticated/tickets/");

export const TicketsPage: React.FC = () => {
  const t = useT();
  const navigate = routeApi.useNavigate();
  const searchParams = routeApi.useSearch();
  const { openCreate } = searchParams;
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const criterion = useMemo(
    () => criterionFromSearch(searchParams),
    [searchParams],
  );
  const { page, pageSize, setPage, setPageSize, resetPage } = usePagination();
  const handleCriterionChange = useCallback(
    (next: FilterCriterion | null) => {
      resetPage();
      navigate({
        search: (previous) => ({ ...previous, ...searchFromCriterion(next) }),
        replace: true,
      });
    },
    [navigate, resetPage],
  );
  const handleSearchChange = useCallback(
    (v: string) => {
      setSearch(v);
      resetPage();
    },
    [resetPage],
  );
  const { data: projectsData } = useProjectOptionsQuery();
  const projects = useMemo(() => projectsData ?? [], [projectsData]);
  const { data: usersData } = useUserOptionsQuery();
  const users = useMemo(() => usersData ?? [], [usersData]);
  const [sort, toggleSort] = useSortState<SortState["col"]>({
    col: TicketSortField.Priority,
    dir: SortDirection.Desc,
  });

  const createDialog = useCreateTicketDialog();
  const editDialog = useEditTicketDialog();
  const deleteDialog = useDeleteTicketDialog();
  const exportTicketsMutation = useExportTicketsExcelMutation();
  const exporting = exportTicketsMutation.isPending;
  const openCreateDialog = createDialog.openDialog;

  const handleExport = () => {
    exportTicketsMutation.mutate(
      {
        ...queryFromCriterion(criterion),
        search: debouncedSearch || undefined,
      },
      {
        onError: () => showToast(t("tickets.list.export_error"), "error"),
      },
    );
  };

  const ticketsFilters: TicketFilters = {
    page,
    pageSize,
    sortBy: sort.col,
    sortDirection: sort.dir,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...queryFromCriterion(criterion),
  };

  const ticketsQuery = useTicketsQuery(ticketsFilters);
  const tickets = ticketsQuery.data ?? null;
  const loading = ticketsQuery.isLoading;
  const initialLoading = loading && !tickets;
  const error = ticketsQuery.error;

  useQueryErrorToast(!!error, "tickets.list.load_error");

  useEffect(() => {
    if (!openCreate) return;
    openCreateDialog();
    navigate({
      search: (previous) => ({ ...previous, openCreate: undefined }),
      replace: true,
    });
  }, [openCreate, openCreateDialog, navigate]);

  const filtered = tickets?.items ?? [];

  const hasFiltersApplied = !!debouncedSearch || !!criterion;

  return (
    <>
      <PageContainer>
        <TicketsToolbar
          search={search}
          onSearchChange={handleSearchChange}
          criterion={criterion}
          onCriterionChange={handleCriterionChange}
          users={users}
          projects={projects}
          onCreate={openCreateDialog}
          onExport={handleExport}
          exporting={exporting}
        />

        {!initialLoading && error && !tickets ? (
          <LoadErrorState
            onRetry={() => ticketsQuery.refetch()}
            retrying={ticketsQuery.isFetching}
          />
        ) : (
          <Box
            sx={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              overflow: "hidden",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              opacity: loading && !initialLoading ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <TicketsTable
              tickets={filtered}
              sort={sort}
              onToggleSort={toggleSort}
              onEdit={editDialog.openDialog}
              onDelete={deleteDialog.openDialog}
              hasFiltersApplied={hasFiltersApplied}
              loading={initialLoading}
            />

            {!initialLoading && (
              <Pagination
                page={page}
                totalPages={tickets?.totalPages ?? 1}
                total={tickets?.totalCount ?? 0}
                onChange={setPage}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageSizeChange={setPageSize}
                countLabel={
                  (tickets?.totalCount ?? 0) > 1
                    ? t("tickets.list.count_plural")
                    : t("tickets.list.count_singular")
                }
              />
            )}
          </Box>
        )}
      </PageContainer>

      <CreateTicketModal
        open={createDialog.open}
        onClose={createDialog.closeDialog}
        register={createDialog.register}
        errors={createDialog.errors}
        projects={projects}
        users={users}
        submitting={createDialog.submitting}
        onSubmit={createDialog.submit}
        createAnother={createDialog.createAnother}
        onCreateAnotherChange={createDialog.setCreateAnother}
      />

      <EditTicketModal
        open={editDialog.open}
        onClose={editDialog.closeDialog}
        register={editDialog.register}
        errors={editDialog.errors}
        projects={projects}
        users={users}
        saving={editDialog.saving}
        onSubmit={editDialog.submit}
      />

      <DeleteModal
        open={!!deleteDialog.target}
        onClose={deleteDialog.closeDialog}
        onConfirm={deleteDialog.confirm}
        loading={deleteDialog.deleting}
        title={t("tickets.list.delete_title")}
      >
        {t("tickets.list.delete_prefix")}
        <strong>{deleteDialog.target?.reference}</strong>
        {t("tickets.list.delete_suffix")}
        <br />
        {t("common.action_irreversible_before")}
        <b>{t("common.action_irreversible_word")}</b>
        {t("common.action_irreversible_after")}
      </DeleteModal>
    </>
  );
};
