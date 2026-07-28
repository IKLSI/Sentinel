import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Ticket } from "../../../types";
import {
  addComment,
  deleteComment,
  downloadAttachmentByUrl,
  getTicket,
  updateComment,
  uploadAttachment,
} from "../api/tickets";

export const ticketQueryKey = (id: string) => ["ticket", id] as const;

export const useTicket = (id: string | undefined) => {
  const query = useQuery({
    queryKey: ticketQueryKey(id ?? ""),
    queryFn: ({ signal }) => getTicket(id as string, signal),
    enabled: !!id,
    staleTime: 15_000,
  });

  return {
    ticket: query.data ?? null,
    loading: query.isLoading,
    notFound: query.isError,
  };
};

export const useAddComment = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => addComment(ticketId, content),
    onSuccess: (created) => {
      queryClient.setQueryData<Ticket>(ticketQueryKey(ticketId), (prev) =>
        prev ? { ...prev, comments: [...prev.comments, created] } : prev,
      );
    },
  });
};

export const useUpdateComment = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => updateComment(ticketId, commentId, content),
    onSuccess: (updated) => {
      queryClient.setQueryData<Ticket>(ticketQueryKey(ticketId), (prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map((c) =>
                c.id === updated.id ? updated : c,
              ),
            }
          : prev,
      );
    },
  });
};

export const useDeleteComment = (ticketId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(ticketId, commentId),
    onSuccess: (_data, commentId) => {
      queryClient.setQueryData<Ticket>(ticketQueryKey(ticketId), (prev) =>
        prev
          ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) }
          : prev,
      );
    },
  });
};

export const useUploadAttachment = (ticketId: string) => {
  return useMutation({
    mutationFn: (file: File) => uploadAttachment(ticketId, file),
  });
};

export const useDownloadAttachment = () => {
  return useMutation({
    mutationFn: ({ url, fileName }: { url: string; fileName: string }) =>
      downloadAttachmentByUrl(url, fileName),
  });
};
