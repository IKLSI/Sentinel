import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import { DeleteModal } from "@/components/ui/common/DeleteModal";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/hooks/useToast";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
} from "@/domains/tickets/mutations";
import { useTicketQuery } from "@/domains/tickets/queries";
import type { CommentAttachment } from "@/components/ui/common/AttachmentChip";
import {
  buildPalette,
  buildPriorityConfig,
  parseCommentContent,
} from "@/features/tickets/pages/TicketDetailPage/helpers";
import { TicketHeader } from "@/features/tickets/pages/TicketDetailPage/components/TicketHeader";
import { SectionDivider } from "@/features/tickets/pages/TicketDetailPage/components/SectionDivider";
import { CommentThread } from "@/features/tickets/pages/TicketDetailPage/components/CommentThread";
import { CommentComposer } from "@/features/tickets/pages/TicketDetailPage/components/CommentComposer";
import { PropertiesCard } from "@/features/tickets/pages/TicketDetailPage/components/PropertiesCard";
import { HistoryCard } from "@/features/tickets/pages/TicketDetailPage/components/HistoryCard";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { Theme } from "@/enums";
import { commentContentSchema } from "@/features/tickets/pages/TicketDetailPage/schemas";

const routeApi = getRouteApi("/_authenticated/tickets/$id");

export const TicketDetailPage: React.FC = () => {
  const t = useT();
  const onAddCommentError = useApiErrorToast(
    "tickets.detail.add_comment_error",
  );
  const onUpdateCommentError = useApiErrorToast("tickets.detail.update_error");
  const onDeleteCommentError = useApiErrorToast("tickets.detail.delete_error");
  const { id } = routeApi.useParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === Theme.Dark;
  const palette = useMemo(() => buildPalette(isDark), [isDark]);
  const priorityConfig = useMemo(() => buildPriorityConfig(isDark), [isDark]);

  const ticketQuery = useTicketQuery(id);
  const ticket = ticketQuery.data ?? null;
  const loading = ticketQuery.isLoading;
  const notFound = ticketQuery.isError;
  const addCommentMutation = useAddCommentMutation(id ?? "");
  const updateCommentMutation = useUpdateCommentMutation(id ?? "");
  const deleteCommentMutation = useDeleteCommentMutation(id ?? "");

  const [composerValue, setComposerValue] = useState("");
  const [composerAttachments, setComposerAttachments] = useState<
    CommentAttachment[]
  >([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const draftRef = useRef<{
    value: string;
    attachments: CommentAttachment[];
  } | null>(null);
  const composerRef = useRef({
    value: composerValue,
    attachments: composerAttachments,
  });

  useEffect(() => {
    composerRef.current = {
      value: composerValue,
      attachments: composerAttachments,
    };
  }, [composerValue, composerAttachments]);
  const submitting = editingCommentId
    ? updateCommentMutation.isPending
    : addCommentMutation.isPending;

  const [deleteCommentTarget, setDeleteCommentTarget] = useState<string | null>(
    null,
  );
  const deleteCommentLoading = deleteCommentMutation.isPending;

  useQueryErrorToast(notFound, "tickets.detail.not_found_toast");

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

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (notFound || !ticket) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: "80px",
          gap: "8px",
        }}
      >
        <Box
          sx={{
            fontSize: "40px",
            fontWeight: 800,
            color: "var(--border2)",
            fontFamily: "var(--font-mono)",
          }}
        >
          404
        </Box>
        <Box sx={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
          {t("tickets.detail.not_found_title")}
        </Box>
        <Box sx={{ fontSize: "12px", color: "var(--muted)" }}>
          {t("tickets.detail.not_found_subtitle")}
        </Box>
      </Box>
    );
  }

  return (
    <>
      <PageContainer
        sx={{
          p: { xs: "20px 8px", md: "20px 28px" },
          height: "auto",
          minHeight: "100vh",
          gap: "14px",
          alignItems: "flex-start",
          flexDirection: { xs: "column", lg: "row" },
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            background: palette.panelBg,
            border: `1px solid ${palette.panelBorder}`,
            borderRadius: "var(--r-xl)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: palette.panelShadow,
          }}
        >
          <TicketHeader palette={palette} title={ticket.title} />

          <Box
            sx={{
              px: { xs: "24px", md: "40px" },
              pt: { xs: "24px", md: "36px" },
              pb: { xs: "18px", md: "24px" },
            }}
          >
            {ticket.description && (
              <>
                <SectionDivider
                  palette={palette}
                  icon={<DescriptionOutlined sx={{ fontSize: 13 }} />}
                  label={t("tickets.detail.section_description")}
                />

                <Box>
                  <Box
                    sx={{
                      fontSize: "13px",
                      color: palette.bodyText,
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                    }}
                  >
                    {ticket.description}
                  </Box>
                </Box>
              </>
            )}

            <SectionDivider
              palette={palette}
              icon={<ForumOutlined sx={{ fontSize: 13 }} />}
              label={t("tickets.detail.section_conversation")}
              my="28px"
            />

            <CommentThread
              comments={ticket.comments ?? []}
              currentUserId={user?.id}
              palette={palette}
              editingCommentId={editingCommentId}
              onEdit={startEditComment}
              onDelete={setDeleteCommentTarget}
            />

            <CommentComposer
              ticketId={id ?? ""}
              value={composerValue}
              onValueChange={setComposerValue}
              attachments={composerAttachments}
              onAttachmentsChange={setComposerAttachments}
              submitting={submitting}
              onSubmit={handleSubmitComment}
              editingCommentId={editingCommentId}
              onCancelEdit={cancelEditComment}
            />
          </Box>
        </Box>

        <Box
          sx={{
            width: { xs: "100%", lg: "270px" },
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            minHeight: 0,
          }}
        >
          <PropertiesCard
            ticket={ticket}
            palette={palette}
            priorityConfig={priorityConfig}
          />

          <HistoryCard
            ticket={ticket}
            palette={palette}
            isDark={isDark}
            priorityConfig={priorityConfig}
          />
        </Box>
      </PageContainer>

      <DeleteModal
        open={!!deleteCommentTarget}
        onClose={() => setDeleteCommentTarget(null)}
        onConfirm={handleDeleteComment}
        loading={deleteCommentLoading}
        title={t("tickets.detail.delete_comment_title")}
      >
        {t("tickets.detail.delete_comment_message")}
        <br />
        {t("common.action_irreversible_before")}
        <b>{t("common.action_irreversible_word")}</b>
        {t("common.action_irreversible_after")}
      </DeleteModal>
    </>
  );
};
