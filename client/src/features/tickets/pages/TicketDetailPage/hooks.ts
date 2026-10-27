import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useT } from "@/contexts/I18nContext";
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
} from "@/domains/tickets/mutations";
import type { Ticket } from "@/domains/tickets/types";
import type { CommentAttachment } from "@/components/ui/common/AttachmentChip";
import {
  commentContentSchema,
  parseCommentContent,
} from "@/features/tickets/pages/TicketDetailPage/helpers";

interface ComposerDraft {
  value: string;
  attachments: CommentAttachment[];
}

export const useTicketComments = (ticketId: string, ticket: Ticket | null) => {
  const t = useT();
  const { showToast } = useToast();
  const onAddCommentError = useApiErrorToast(
    "tickets.detail.add_comment_error",
  );
  const onUpdateCommentError = useApiErrorToast("tickets.detail.update_error");
  const onDeleteCommentError = useApiErrorToast("tickets.detail.delete_error");

  const addCommentMutation = useAddCommentMutation(ticketId);
  const updateCommentMutation = useUpdateCommentMutation(ticketId);
  const deleteCommentMutation = useDeleteCommentMutation(ticketId);

  const [composerValue, setComposerValue] = useState("");
  const [composerAttachments, setComposerAttachments] = useState<
    CommentAttachment[]
  >([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<string | null>(
    null,
  );
  const draftRef = useRef<ComposerDraft | null>(null);
  const composerRef = useRef<ComposerDraft>({
    value: composerValue,
    attachments: composerAttachments,
  });

  useEffect(() => {
    composerRef.current = {
      value: composerValue,
      attachments: composerAttachments,
    };
  }, [composerValue, composerAttachments]);

  const startEditComment = useCallback((commentId: string, content: string) => {
    const { text, attachments } = parseCommentContent(content);
    setEditingCommentId((current) => {
      if (!current) draftRef.current = composerRef.current;
      return commentId;
    });
    setComposerValue(text);
    setComposerAttachments(attachments);
  }, []);

  const cancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setComposerValue(draftRef.current?.value ?? "");
    setComposerAttachments(draftRef.current?.attachments ?? []);
    draftRef.current = null;
  }, []);

  const handleSubmitComment = (content: string) => {
    if (!ticket || !commentContentSchema.safeParse(content).success) return;

    if (editingCommentId) {
      updateCommentMutation.mutate(
        { id: ticket.id, commentId: editingCommentId, data: { content } },
        {
          onSuccess: () => {
            cancelEditComment();
            showToast(t("tickets.detail.comment_updated"), "success");
          },
          onError: onUpdateCommentError,
        },
      );
      return;
    }

    addCommentMutation.mutate(
      { id: ticket.id, data: { content } },
      {
        onSuccess: () => {
          setComposerValue("");
          setComposerAttachments([]);
          showToast(t("tickets.detail.reply_sent"), "success");
        },
        onError: onAddCommentError,
      },
    );
  };

  const handleDeleteComment = () => {
    if (!ticket || !deleteCommentTarget) return;
    deleteCommentMutation.mutate(
      { id: ticket.id, commentId: deleteCommentTarget },
      {
        onSuccess: () => {
          if (editingCommentId === deleteCommentTarget) cancelEditComment();
          setDeleteCommentTarget(null);
          showToast(t("tickets.detail.comment_deleted"), "success");
        },
        onError: onDeleteCommentError,
      },
    );
  };

  return {
    composerValue,
    setComposerValue,
    composerAttachments,
    setComposerAttachments,
    editingCommentId,
    submitting: editingCommentId
      ? updateCommentMutation.isPending
      : addCommentMutation.isPending,
    startEditComment,
    cancelEditComment,
    handleSubmitComment,
    deleteCommentTarget,
    setDeleteCommentTarget,
    deleting: deleteCommentMutation.isPending,
    handleDeleteComment,
  };
};
