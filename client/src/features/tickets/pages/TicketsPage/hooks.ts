import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/useToast";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useUndoToast } from "@/hooks/useUndoToast";
import { useT } from "@/contexts/I18nContext";
import { invalidateKeys } from "@/domains/helpers";
import { ticketKeys } from "@/domains/tickets/constants";
import {
  hideCachedTicket,
  useCreateTicketMutation,
  useDeleteTicketMutation,
  useUpdateTicketMutation,
} from "@/domains/tickets/mutations";
import { useExportTicketsExcelMutation } from "@/domains/tickets/downloads";
import { useTicketsQuery } from "@/domains/tickets/queries";
import type {
  CreateTicket,
  Ticket,
  TicketFilters,
  UpdateTicket,
} from "@/domains/tickets/types";
import { useTicketCreatedToast } from "@/features/tickets/hooks/useTicketCreatedToast";
import {
  EMPTY_CREATE_TICKET_FORM,
  toTicketRestore,
} from "@/features/tickets/pages/TicketsPage/helpers";
import {
  createTicketSchema,
  editTicketSchema,
  type CreateTicketFormValues,
  type EditTicketFormValues,
} from "@/features/tickets/pages/TicketsPage/schemas";
import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import { queryFromCriterion } from "@/features/tickets/pages/TicketsPage/filterParams";
import type { SortState } from "@/features/tickets/pages/TicketsPage/components/TicketsTable";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSortState } from "@/hooks/useSortState";
import { usePagination } from "@/hooks/usePagination";
import { SortDirection, TicketSortField, TicketStatus } from "@/enums";

const SEARCH_DEBOUNCE_MS = 300;

export const useTicketsListing = (
  criterion: FilterCriterion | null,
  onCriterionChange: (criterion: FilterCriterion | null) => void,
) => {
  const t = useT();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const pagination = usePagination();
  const { page, pageSize, resetPage } = pagination;
  const [sort, toggleSort] = useSortState<SortState["col"]>({
    col: TicketSortField.Priority,
    dir: SortDirection.Desc,
  });
  const exportTicketsMutation = useExportTicketsExcelMutation();

  const handleCriterionChange = useCallback(
    (next: FilterCriterion | null) => {
      resetPage();
      onCriterionChange(next);
    },
    [onCriterionChange, resetPage],
  );

  const handleSearchChange = useCallback(
    (v: string) => {
      setSearch(v);
      resetPage();
    },
    [resetPage],
  );

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

  return {
    search,
    handleSearchChange,
    handleCriterionChange,
    pagination,
    sort,
    toggleSort,
    handleExport,
    exporting: exportTicketsMutation.isPending,
    ticketsQuery,
    hasFiltersApplied: !!debouncedSearch || !!criterion,
  };
};

export const useDeleteTicketDialog = () => {
  const t = useT();
  const dialog = useDeleteDialog<{ id: string; reference: string }>(
    useDeleteTicketMutation(),
    "tickets.list.delete_error",
    ({ reference }) => t("tickets.list.delete_success", { reference }),
    {
      hide: ({ id }) => hideCachedTicket(id),
      restore: () => invalidateKeys([ticketKeys.lists()]),
    },
  );
  const { setTarget } = dialog;

  const openDialog = useCallback(
    (id: string, reference: string) => setTarget({ id, reference }),
    [setTarget],
  );

  return { ...dialog, openDialog };
};

export const useCreateTicketDialog = () => {
  const showTicketCreatedToast = useTicketCreatedToast();
  const onCreateError = useApiErrorToast("tickets.list.create_error");
  const createTicketMutation = useCreateTicketMutation();
  const [open, setOpen] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: EMPTY_CREATE_TICKET_FORM,
  });

  const openDialog = useCallback(() => {
    reset(EMPTY_CREATE_TICKET_FORM);
    setOpen(true);
  }, [reset]);

  const closeDialog = useCallback(() => setOpen(false), []);

  const submit = handleSubmit((data) => {
    const payload: CreateTicket = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      type: data.type,
    };
    if (data.projectId) payload.projectId = data.projectId;
    if (data.assignedToId) payload.assignedToId = data.assignedToId;
    createTicketMutation.mutate(
      { data: payload },
      {
        onSuccess: (created) => {
          if (createAnother) reset(EMPTY_CREATE_TICKET_FORM);
          else setOpen(false);
          showTicketCreatedToast(created);
        },
        onError: onCreateError,
      },
    );
  });

  return {
    open,
    openDialog,
    closeDialog,
    register,
    errors,
    submit,
    submitting: createTicketMutation.isPending,
    createAnother,
    setCreateAnother,
  };
};

export const useEditTicketDialog = () => {
  const t = useT();
  const showUndoToast = useUndoToast();
  const onEditError = useApiErrorToast("tickets.list.edit_error");
  const updateTicketMutation = useUpdateTicketMutation();
  const [target, setTarget] = useState<Ticket | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditTicketFormValues>({
    resolver: zodResolver(editTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      type: "bug",
      status: TicketStatus.New,
      projectId: "",
      assignedToId: "",
    },
  });

  const openDialog = useCallback(
    (ticket: Ticket) => {
      reset({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        type: ticket.type,
        status: ticket.status,
        projectId: ticket.projectId ?? "",
        assignedToId: ticket.assignedToId ?? "",
      });
      setTarget(ticket);
    },
    [reset],
  );

  const closeDialog = useCallback(() => setTarget(null), []);

  const submit = handleSubmit(async (data) => {
    if (!target) return;
    const payload: UpdateTicket = {
      title: data.title,
      description: data.description,
      priority: data.priority as UpdateTicket["priority"],
      type: data.type as UpdateTicket["type"],
      clearProject: !data.projectId,
      clearAssignee: !data.assignedToId,
    };
    if (data.projectId) payload.projectId = data.projectId;
    if (data.assignedToId) payload.assignedToId = data.assignedToId;
    if (data.status && data.status !== target.status)
      payload.status = data.status;
    try {
      await updateTicketMutation.mutateAsync({
        id: target.id,
        data: payload,
      });
      setTarget(null);
      showUndoToast(
        t("tickets.list.edit_success", { reference: target.reference }),
        () =>
          updateTicketMutation
            .mutateAsync({ id: target.id, data: toTicketRestore(target) })
            .catch(onEditError),
      );
    } catch (err) {
      onEditError(err);
    }
  });

  return {
    open: !!target,
    openDialog,
    closeDialog,
    register,
    errors,
    submit,
    saving: updateTicketMutation.isPending,
  };
};
