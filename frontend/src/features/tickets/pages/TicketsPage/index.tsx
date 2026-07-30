import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { DeleteModal } from "@/components/DeleteModal";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import {
  useTickets,
  useCreateTicket,
  useUpdateTicket,
  useDeleteTicket,
  useExportTicketsExcel,
} from "@/features/tickets/hooks/useTickets";
import { TICKET_STATUSES } from "@/features/tickets/constants";
import { useProjects } from "@/features/techHealth/hooks/useProjects";
import { useUsers } from "@/features/users/hooks/useUsers";
import type {
  Ticket,
  TicketFilters,
  TicketPriority,
  TicketType,
} from "@/types";
import {
  type CreateTicketPayload,
  EMPTY_CREATE_TICKET_FORM,
  PRIORITY_ORDER,
} from "./helpers";
import {
  createTicketSchema,
  type CreateTicketFormValues,
  editTicketSchema,
  type EditTicketFormValues,
} from "./schemas";
import { TicketsToolbar } from "./components/TicketsToolbar";
import { TicketsTable, type SortState } from "./components/TicketsTable";
import { Pagination } from "./components/Pagination";
import { CreateTicketModal } from "./components/CreateTicketModal";
import { EditTicketModal } from "./components/EditTicketModal";
import { useApiError } from "@/hooks/useApiError";
import { SortDirection } from "@/types/enums";

const routeApi = getRouteApi("/_authenticated/tickets/");

export const TicketsPage: React.FC = () => {
  const t = useT();
  const apiError = useApiError();
  const navigate = routeApi.useNavigate();
  const { openCreate } = routeApi.useSearch();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    priority: "",
    status: "",
    type: "",
  });
  const [page, setPage] = useState(1);
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
  const { data: projectsData } = useProjects();
  const modalProjects = projectsData ?? [];
  const { users: modalUsers } = useUsers();
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
  const [sort, setSort] = useState<SortState | null>({
    col: "priority",
    dir: SortDirection.Asc,
  });

  const pageSize = 20;

  const createTicketMutation = useCreateTicket();
  const updateTicketMutation = useUpdateTicket();
  const deleteTicketMutation = useDeleteTicket();
  const exportTicketsMutation = useExportTicketsExcel();

  const createSubmitting = createTicketMutation.isPending;
  const editSaving = updateTicketMutation.isPending;
  const deleting = deleteTicketMutation.isPending;
  const exporting = exportTicketsMutation.isPending;

  const handleExport = () => {
    exportTicketsMutation.mutate(
      {
        priority: filters.priority || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
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
    const payload: CreateTicketPayload = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      type: data.type,
    };
    if (data.projectId) payload.projectId = data.projectId;
    if (data.assignedToId) payload.assignedToId = data.assignedToId;
    if (data.estimatedMinutes > 0)
      payload.estimatedHours = data.estimatedMinutes / 60;
    createTicketMutation.mutate(payload as unknown as Partial<Ticket>, {
      onSuccess: (created) => {
        if (createAnother) {
          resetCreateForm({ ...EMPTY_CREATE_TICKET_FORM, estimatedMinutes: 0 });
          showToast(
            t("tickets.list.create_success", { reference: created.reference }),
            "success",
          );
        } else {
          setShowCreateModal(false);
          navigate({ to: "/tickets/$id", params: { id: created.id } });
        }
      },
      onError: (err) =>
        showToast(apiError(err, t("tickets.list.create_error")), "error"),
    });
  });

  const openEditModal = useCallback(
    (ticket: Ticket) => {
      resetEditForm({
        title: ticket.title,
        description: ticket.description ?? "",
        priority: ticket.priority,
        type: ticket.type,
        status: ticket.status,
        projectId: ticket.projectId ?? "",
        assignedToId: ticket.assignee?.id ?? "",
        estimatedMinutes:
          ticket.estimatedHours != null
            ? Math.round(ticket.estimatedHours * 60)
            : 0,
      });
      setEditTarget(ticket);
    },
    [resetEditForm],
  );

  const toggleSort = useCallback((col: string) => {
    setSort((s) => {
      if (s?.col !== col) return { col, dir: SortDirection.Asc };
      if (s.dir === SortDirection.Asc) return { col, dir: SortDirection.Desc };
      return null;
    });
  }, []);

  const onDeleteTarget = useCallback((id: string, reference: string) => {
    setDeleteTarget({ id, reference });
  }, []);

  const handleEdit = handleEditSubmit(async (data) => {
    if (!editTarget) return;
    const payload: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      type: data.type,
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
        data: payload as Partial<Ticket>,
      });
      setEditTarget(null);
    } catch (err) {
      showToast(apiError(err, t("tickets.list.edit_error")), "error");
    }
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteTicketMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) =>
        showToast(apiError(err, t("tickets.list.delete_error")), "error"),
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const ticketsFilters: TicketFilters = {
    page,
    pageSize,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.priority
      ? { priority: filters.priority as TicketPriority }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type as TicketType } : {}),
  };

  const { tickets, loading, error } = useTickets(ticketsFilters);

  useEffect(() => {
    if (error) showToast(t("tickets.list.load_error"), "error");
  }, [error, showToast, t]);

  useEffect(() => {
    if (openCreate) openCreateModal();
  }, [openCreate, openCreateModal]);

  const filtered = useMemo(() => {
    return (tickets?.items ?? []).slice().sort((a, b) => {
      if (!sort) return 0;
      const mul = sort.dir === SortDirection.Asc ? 1 : -1;
      switch (sort.col) {
        case "title":
          return mul * a.title.localeCompare(b.title);
        case "priority":
          return (
            mul *
            ((PRIORITY_ORDER[a.priority] ?? 9) -
              (PRIORITY_ORDER[b.priority] ?? 9))
          );
        case "status":
          return (
            mul *
            (TICKET_STATUSES.indexOf(a.status) -
              TICKET_STATUSES.indexOf(b.status))
          );
        case "assignee":
          return (
            mul *
            `${a.assignee?.firstName ?? ""}${a.assignee?.lastName ?? ""}`.localeCompare(
              `${b.assignee?.firstName ?? ""}${b.assignee?.lastName ?? ""}`,
            )
          );
        default:
          return 0;
      }
    });
  }, [tickets?.items, sort]);

  const hasFiltersApplied = !!(
    debouncedSearch ||
    filters.priority ||
    filters.status ||
    filters.type
  );

  return (
    <>
      <Box
        className="page-enter"
        sx={{
          p: "20px 28px",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <TicketsToolbar
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={(f) => {
            setFilters(f);
            setPage(1);
          }}
          onCreate={openCreateModal}
          onExport={handleExport}
          exporting={exporting}
        />

        {loading && !tickets ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <CircularProgress size={24} />
          </Box>
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
              total={tickets?.total ?? 0}
              onChange={setPage}
            />
          </Box>
        )}
      </Box>

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
