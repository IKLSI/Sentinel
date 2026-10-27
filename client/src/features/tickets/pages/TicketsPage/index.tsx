import type React from "react";
import { useCallback, useEffect, useMemo } from "react";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { LoadErrorState } from "@/components/ui/common/feedback/LoadErrorState";
import { DeleteModal } from "@/components/ui/common/modal/DeleteModal";
import { PageContainer } from "@/components/layout/PageContainer";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useT } from "@/contexts/I18nContext";
import { useProjectOptionsQuery } from "@/domains/projects/queries";
import { useUserOptionsQuery } from "@/domains/users/queries";
import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import {
  criterionFromSearch,
  searchFromCriterion,
} from "@/features/tickets/pages/TicketsPage/filterParams";
import {
  useCreateTicketDialog,
  useDeleteTicketDialog,
  useEditTicketDialog,
  useTicketsListing,
} from "@/features/tickets/pages/TicketsPage/hooks";
import { TicketsToolbar } from "@/features/tickets/pages/TicketsPage/components/TicketsToolbar";
import { TicketsTable } from "@/features/tickets/pages/TicketsPage/components/TicketsTable";
import { Pagination } from "@/components/ui/common/table/Pagination";
import { CreateTicketModal } from "@/features/tickets/pages/TicketsPage/components/CreateTicketModal";
import { EditTicketModal } from "@/features/tickets/pages/TicketsPage/components/EditTicketModal";
import { PAGE_SIZE_OPTIONS } from "@/hooks/usePagination";
import { PANEL_SX } from "@/helpers/cardSx";

const routeApi = getRouteApi("/_authenticated/tickets/");

export const TicketsPage: React.FC = () => {
  const t = useT();
  const navigate = routeApi.useNavigate();
  const searchParams = routeApi.useSearch();
  const { openCreate } = searchParams;
  const criterion = useMemo(
    () => criterionFromSearch(searchParams),
    [searchParams],
  );
  const navigateToCriterion = useCallback(
    (next: FilterCriterion | null) => {
      navigate({
        search: (previous) => ({ ...previous, ...searchFromCriterion(next) }),
        replace: true,
      });
    },
    [navigate],
  );
  const listing = useTicketsListing(criterion, navigateToCriterion);
  const { pagination, ticketsQuery } = listing;

  const { data: projectsData } = useProjectOptionsQuery();
  const projects = useMemo(() => projectsData ?? [], [projectsData]);
  const { data: usersData } = useUserOptionsQuery();
  const users = useMemo(() => usersData ?? [], [usersData]);

  const createDialog = useCreateTicketDialog();
  const editDialog = useEditTicketDialog();
  const deleteDialog = useDeleteTicketDialog();
  const openCreateDialog = createDialog.openDialog;

  const tickets = ticketsQuery.data ?? null;
  const loading = ticketsQuery.isLoading;
  const initialLoading = loading && !tickets;
  const error = ticketsQuery.error;
  const totalCount = tickets?.totalCount ?? 0;

  useQueryErrorToast(!!error, "tickets.list.load_error");

  useEffect(() => {
    if (!openCreate) return;
    openCreateDialog();
    navigate({
      search: (previous) => ({ ...previous, openCreate: undefined }),
      replace: true,
    });
  }, [openCreate, openCreateDialog, navigate]);

  return (
    <>
      <PageContainer>
        <TicketsToolbar
          search={listing.search}
          onSearchChange={listing.handleSearchChange}
          criterion={criterion}
          onCriterionChange={listing.handleCriterionChange}
          users={users}
          projects={projects}
          onCreate={openCreateDialog}
          onExport={listing.handleExport}
          exporting={listing.exporting}
        />

        {!initialLoading && error && !tickets ? (
          <LoadErrorState
            onRetry={() => ticketsQuery.refetch()}
            retrying={ticketsQuery.isFetching}
          />
        ) : (
          <Box
            sx={{
              ...PANEL_SX,
              overflow: "hidden",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              opacity: loading && !initialLoading ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <TicketsTable
              tickets={tickets?.items ?? []}
              sort={listing.sort}
              onToggleSort={listing.toggleSort}
              onEdit={editDialog.openDialog}
              onDelete={deleteDialog.openDialog}
              hasFiltersApplied={listing.hasFiltersApplied}
              loading={initialLoading}
            />

            {!initialLoading && (
              <Pagination
                page={pagination.page}
                totalPages={tickets?.totalPages ?? 1}
                total={totalCount}
                onChange={pagination.setPage}
                pageSize={pagination.pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageSizeChange={pagination.setPageSize}
                countLabel={
                  totalCount > 1
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
        irreversible
      >
        {t("tickets.list.delete_prefix")}
        <strong>{deleteDialog.target?.reference}</strong>
        {t("tickets.list.delete_suffix")}
      </DeleteModal>
    </>
  );
};
