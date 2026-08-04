import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { CenteredLoader } from "@/components/ui/common/CenteredLoader";
import { DeleteModal } from "@/components/ui/common/DeleteModal";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import { useProjectsQuery } from "@/domains/projects/queries";
import { useExportTicketsExcelMutation } from "@/domains/tickets/downloads";
import {
  useCreateTicketMutation,
  useDeleteTicketMutation,
  useUpdateTicketMutation,
} from "@/domains/tickets/mutations";
import { useTicketsQuery } from "@/domains/tickets/queries";
import type {
  CreateTicket,
  Ticket,
  TicketFilters,
  UpdateTicket,
} from "@/domains/tickets/types";
import { useUsersQuery } from "@/domains/users/queries";
import type { TicketPriority, TicketStatus, TicketType } from "@/enums";
import { EMPTY_CREATE_TICKET_FORM } from "@/features/tickets/pages/TicketsPage/helpers";
import type { TicketFiltersState } from "@/features/tickets/pages/TicketsPage/filters";
import {
  createTicketSchema,
  type CreateTicketFormValues,
  editTicketSchema,
  type EditTicketFormValues,
} from "@/features/tickets/pages/TicketsPage/schemas";
import { TicketsToolbar } from "@/features/tickets/pages/TicketsPage/components/TicketsToolbar";
import {
  TicketsTable,
  type SortState,
} from "@/features/tickets/pages/TicketsPage/components/TicketsTable";
import { Pagination } from "@/components/ui/common/Pagination";
import { CreateTicketModal } from "@/features/tickets/pages/TicketsPage/components/CreateTicketModal";
import { EditTicketModal } from "@/features/tickets/pages/TicketsPage/components/EditTicketModal";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSortState } from "@/hooks/useSortState";
import { SortDirection, TicketSortField } from "@/enums";

const SEARCH_DEBOUNCE_MS = 300;

const routeApi = getRouteApi("/_authenticated/tickets/");

export const TicketsPage: React.FC = () => {
  const t = useT();
  const onCreateError = useApiErrorToast("tickets.list.create_error");
  const onEditError = useApiErrorToast("tickets.list.edit_error");
  const onDeleteError = useApiErrorToast("tickets.list.delete_error");
  const navigate = routeApi.useNavigate();
  const { openCreate, priority, status, type } = routeApi.useSearch();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const filters = useMemo<TicketFiltersState>(
    () => ({
      priority: priority ?? "",
      status: status ?? "",
      type: type ?? "",
    }),
    [priority, status, type],
  );
  const [page, setPage] = useState(1);
  const handleFiltersChange = useCallback(
    (next: TicketFiltersState) => {
      setPage(1);
      navigate({
        search: (previous) => ({
          ...previous,
          priority: (next.priority as TicketPriority) || undefined,
          status: (next.status as TicketStatus) || undefined,
          type: (next.type as TicketType) || undefined,
        }),
        replace: true,
      });
    },
    [navigate],
  );
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    reference: string;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const {
    register: createRegister,
    handleSubmit: handleCreateSubmit,
    control: createControl,
    reset: resetCreateForm,
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { ...EMPTY_CREATE_TICKET_FORM, estimatedMinutes: 0 },
  });
  const [createAnother, setCreateAnother] = useState(false);
  const { data: projectsData } = useProjectsQuery();
  const modalProjects = projectsData ?? [];
  const usersQuery = useUsersQuery();
  const modalUsers = usersQuery.data?.items ?? [];
  const [editTarget, setEditTarget] = useState<Ticket | null>(null);
  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    control: editControl,
    reset: resetEditForm,
  } = useForm<EditTicketFormValues>({
    resolver: zodResolver(editTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      type: "bug",
      status: "",
      projectId: "",
      assignedToId: "",
      estimatedMinutes: 0,
    },
  });
  const [sort, toggleSort] = useSortState<SortState["col"]>(
    { col: TicketSortField.Priority, dir: SortDirection.Desc },
    () => setPage(1),
  );

  const pageSize = 25;

  const createTicketMutation = useCreateTicketMutation();
  const updateTicketMutation = useUpdateTicketMutation();
  const deleteTicketMutation = useDeleteTicketMutation();
  const exportTicketsMutation = useExportTicketsExcelMutation();

  const createSubmitting = createTicketMutation.isPending;
  const editSaving = updateTicketMutation.isPending;
  const deleting = deleteTicketMutation.isPending;
  const exporting = exportTicketsMutation.isPending;

  const handleExport = () => {
    exportTicketsMutation.mutate(
      {
        priority: (filters.priority as TicketPriority) || undefined,
        status: filters.status || undefined,
        type: (filters.type as TicketType) || undefined,
        search: debouncedSearch || undefined,
      },
      {
        onError: () => showToast(t("tickets.list.export_error"), "error"),
      },
    );
  };

  const openCreateModal = useCallback(() => {
    resetCreateForm({ ...EMPTY_CREATE_TICKET_FORM, estimatedMinutes: 0 });
    setShowCreateModal(true);
  }, [resetCreateForm]);

  const handleCreate = handleCreateSubmit((data) => {
    const payload: CreateTicket = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      type: data.type,
    };
    if (data.projectId) payload.projectId = data.projectId;
    if (data.assignedToId) payload.assignedToId = data.assignedToId;
    if (data.estimatedMinutes > 0)
      payload.estimatedHours = data.estimatedMinutes / 60;
    createTicketMutation.mutate(
      { data: payload },
      {
        onSuccess: (created) => {
          if (createAnother) {
            resetCreateForm({
              ...EMPTY_CREATE_TICKET_FORM,
              estimatedMinutes: 0,
            });
            showToast(
              t("tickets.list.create_success", {
                reference: created.reference,
              }),
              "success",
            );
          } else {
            setShowCreateModal(false);
            navigate({ to: "/tickets/$id", params: { id: created.id } });
          }
        },
        onError: onCreateError,
      },
    );
  });

  const openEditModal = useCallback(
    (ticket: Ticket) => {
      resetEditForm({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        type: ticket.type,
        status: ticket.status,
        projectId: ticket.projectId ?? "",
        assignedToId: ticket.assignedToId ?? "",
        estimatedMinutes:
          ticket.estimatedHours != null
            ? Math.round(ticket.estimatedHours * 60)
            : 0,
      });
      setEditTarget(ticket);
    },
    [resetEditForm],
  );

  const onDeleteTarget = useCallback((id: string, reference: string) => {
    setDeleteTarget({ id, reference });
  }, []);

  const handleEdit = handleEditSubmit(async (data) => {
    if (!editTarget) return;
    const payload: UpdateTicket = {
      title: data.title,
      description: data.description,
      priority: data.priority as UpdateTicket["priority"],
      type: data.type as UpdateTicket["type"],
    };
    if (data.projectId) payload.projectId = data.projectId;
    if (data.assignedToId) payload.assignedToId = data.assignedToId;
    if (data.estimatedMinutes > 0)
      payload.estimatedHours = data.estimatedMinutes / 60;
    if (data.status && data.status !== editTarget.status)
      payload.status = data.status;
    try {
      await updateTicketMutation.mutateAsync({
        id: editTarget.id,
        data: payload,
      });
      setEditTarget(null);
    } catch (err) {
      onEditError(err);
    }
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    const reference = deleteTarget.reference;
    deleteTicketMutation.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          showToast(t("tickets.list.delete_success", { reference }), "success");
        },
        onError: onDeleteError,
      },
    );
  };

  const ticketsFilters: TicketFilters = {
    page,
    pageSize,
    sortBy: sort.col,
    sortDirection: sort.dir,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.priority
      ? { priority: filters.priority as TicketPriority }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type as TicketType } : {}),
  };

  const ticketsQuery = useTicketsQuery(ticketsFilters);
  const tickets = ticketsQuery.data ?? null;
  const loading = ticketsQuery.isLoading;
  const error = ticketsQuery.error;

  useEffect(() => {
    if (error) showToast(t("tickets.list.load_error"), "error");
  }, [error, showToast, t]);

  useEffect(() => {
    if (openCreate) openCreateModal();
  }, [openCreate, openCreateModal]);

  const filtered = tickets?.items ?? [];

  const hasFiltersApplied = !!(
    debouncedSearch ||
    filters.priority ||
    filters.status ||
    filters.type
  );

  return (
    <>
      <PageContainer>
        <TicketsToolbar
          search={search}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onCreate={openCreateModal}
          onExport={handleExport}
          exporting={exporting}
        />

        {loading && !tickets ? (
          <CenteredLoader />
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
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <TicketsTable
              tickets={filtered}
              sort={sort}
              onToggleSort={toggleSort}
              onEdit={openEditModal}
              onDelete={onDeleteTarget}
              hasFiltersApplied={hasFiltersApplied}
            />

            <Pagination
              page={page}
              totalPages={tickets?.totalPages ?? 1}
              total={tickets?.totalCount ?? 0}
              onChange={setPage}
              previousLabel={t("tickets.list.previous")}
              nextLabel={t("tickets.list.next")}
              countLabel={
                (tickets?.totalCount ?? 0) > 1
                  ? t("tickets.list.count_plural")
                  : t("tickets.list.count_singular")
              }
            />
          </Box>
        )}
      </PageContainer>

      <CreateTicketModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        register={createRegister}
        control={createControl}
        projects={modalProjects}
        users={modalUsers}
        submitting={createSubmitting}
        onSubmit={handleCreate}
        createAnother={createAnother}
        onCreateAnotherChange={setCreateAnother}
      />

      <EditTicketModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        register={editRegister}
        control={editControl}
        projects={modalProjects}
        users={modalUsers}
        saving={editSaving}
        onSubmit={handleEdit}
      />

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t("tickets.list.delete_title")}
      >
        {t("tickets.list.delete_prefix")}
        <strong>{deleteTarget?.reference}</strong>
        {t("tickets.list.delete_suffix")}
        <br />
        {t("common.action_irreversible_before")}
        <b>{t("common.action_irreversible_word")}</b>
        {t("common.action_irreversible_after")}
      </DeleteModal>
    </>
  );
};
