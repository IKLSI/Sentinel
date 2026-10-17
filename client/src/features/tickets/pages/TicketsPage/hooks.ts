import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import {
  useCreateTicketMutation,
  useDeleteTicketMutation,
  useUpdateTicketMutation,
} from "@/domains/tickets/mutations";
import type {
  CreateTicket,
  Ticket,
  UpdateTicket,
} from "@/domains/tickets/types";
import { EMPTY_CREATE_TICKET_FORM } from "@/features/tickets/pages/TicketsPage/helpers";
import {
  createTicketSchema,
  type CreateTicketFormValues,
  editTicketSchema,
  type EditTicketFormValues,
} from "@/features/tickets/pages/TicketsPage/schemas";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";

export const useCreateTicketDialog = (onCreated: (ticket: Ticket) => void) => {
  const t = useT();
  const { showToast } = useToast();
  const onCreateError = useApiErrorToast("tickets.list.create_error");
  const createTicketMutation = useCreateTicketMutation();
  const [open, setOpen] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);
  const { register, handleSubmit, reset } = useForm<CreateTicketFormValues>({
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
          if (createAnother) {
            reset(EMPTY_CREATE_TICKET_FORM);
            showToast(
              t("tickets.list.create_success", {
                reference: created.reference,
              }),
              "success",
            );
          } else {
            setOpen(false);
            onCreated(created);
          }
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
    submit,
    submitting: createTicketMutation.isPending,
    createAnother,
    setCreateAnother,
  };
};

export const useEditTicketDialog = () => {
  const onEditError = useApiErrorToast("tickets.list.edit_error");
  const updateTicketMutation = useUpdateTicketMutation();
  const [target, setTarget] = useState<Ticket | null>(null);
  const { register, handleSubmit, reset } = useForm<EditTicketFormValues>({
    resolver: zodResolver(editTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      type: "bug",
      status: "",
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
    } catch (err) {
      onEditError(err);
    }
  });

  return {
    open: !!target,
    openDialog,
    closeDialog,
    register,
    submit,
    saving: updateTicketMutation.isPending,
  };
};

export const useDeleteTicketDialog = () => {
  const t = useT();
  const { showToast } = useToast();
  const onDeleteError = useApiErrorToast("tickets.list.delete_error");
  const deleteTicketMutation = useDeleteTicketMutation();
  const [target, setTarget] = useState<{
    id: string;
    reference: string;
  } | null>(null);

  const openDialog = useCallback((id: string, reference: string) => {
    setTarget({ id, reference });
  }, []);

  const closeDialog = useCallback(() => setTarget(null), []);

  const confirm = () => {
    if (!target) return;
    const reference = target.reference;
    deleteTicketMutation.mutate(
      { id: target.id },
      {
        onSuccess: () => {
          setTarget(null);
          showToast(t("tickets.list.delete_success", { reference }), "success");
        },
        onError: onDeleteError,
      },
    );
  };

  return {
    target,
    openDialog,
    closeDialog,
    confirm,
    deleting: deleteTicketMutation.isPending,
  };
};
