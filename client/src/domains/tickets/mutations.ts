import { ROUTES_API } from "@/configs/api-routes.gen";
import { queryClient } from "@/configs/queryClient";
import { CONTENT_TYPES, HTTP_HEADERS } from "@/constants/http";
import {
  useDeleteMutation,
  usePostMutation,
  usePutMutation,
} from "@/domains/helpers";
import { ticketKeys } from "@/domains/tickets/constants";
import type {
  TicketPagedResult,
  CreateComment,
  CreateTicket,
  CreateTicketFromFinding,
  Ticket,
  TicketAttachment,
  TicketComment,
  UpdateTicket,
} from "@/domains/tickets/types";

const updateCachedComments = (
  ticketId: string,
  update: (comments: TicketComment[]) => TicketComment[],
) =>
  queryClient.setQueryData<Ticket>(ticketKeys.detail(ticketId), (previous) =>
    previous
      ? { ...previous, comments: update(previous.comments ?? []) }
      : previous,
  );

export const hideCachedTicket = (id: string) =>
  queryClient.setQueriesData<TicketPagedResult>(
    { queryKey: ticketKeys.lists() },
    (previous) =>
      previous && {
        ...previous,
        items: previous.items.filter((ticket) => ticket.id !== id),
        totalCount: previous.totalCount - 1,
      },
  );

export const useCreateTicketMutation = () =>
  usePostMutation<Ticket, Ticket, { data: CreateTicket }>(
    ROUTES_API.api.tickets.__path,
  );

export const useCreateTicketFromFindingMutation = () =>
  usePostMutation<Ticket, Ticket, { data: CreateTicketFromFinding }>(
    ROUTES_API.api.tickets.fromFinding.__path,
  );

export const useUpdateTicketMutation = () =>
  usePutMutation<Ticket, Ticket, { id: string; data: UpdateTicket }>(
    ROUTES_API.api.tickets[":id"].__path,
    {
      onSuccess: (updated) =>
        queryClient.setQueryData(ticketKeys.detail(updated.id), updated),
    },
  );

export const useDeleteTicketMutation = () =>
  useDeleteMutation<void, void, { id: string }>(
    ROUTES_API.api.tickets[":id"].__path,
  );

export const useAddCommentMutation = (ticketId: string) =>
  usePostMutation<
    TicketComment,
    TicketComment,
    { id: string; data: CreateComment }
  >(ROUTES_API.api.tickets[":id"].comments.__path, {
    onSuccess: (created) =>
      updateCachedComments(ticketId, (comments) =>
        comments.some((comment) => comment.id === created.id)
          ? comments.map((comment) =>
              comment.id === created.id ? created : comment,
            )
          : [...comments, created],
      ),
  });

export const useUpdateCommentMutation = (ticketId: string) =>
  usePutMutation<
    TicketComment,
    TicketComment,
    { id: string; commentId: string; data: CreateComment }
  >(ROUTES_API.api.tickets[":id"].comments[":commentId"].__path, {
    onSuccess: (updated) =>
      updateCachedComments(ticketId, (comments) =>
        comments.map((comment) =>
          comment.id === updated.id ? updated : comment,
        ),
      ),
  });

export const useDeleteCommentMutation = (ticketId: string) =>
  useDeleteMutation<void, void, { id: string; commentId: string }>(
    ROUTES_API.api.tickets[":id"].comments[":commentId"].__path,
    {
      onSuccess: (_result, { commentId }) =>
        updateCachedComments(ticketId, (comments) =>
          comments.filter((comment) => comment.id !== commentId),
        ),
    },
  );

export const useUploadAttachmentMutation = () =>
  usePostMutation<
    TicketAttachment,
    TicketAttachment,
    { id: string; data: FormData }
  >(ROUTES_API.api.tickets[":id"].attachments.__path, {
    axiosOptions: {
      headers: { [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.MULTIPART },
    },
  });
