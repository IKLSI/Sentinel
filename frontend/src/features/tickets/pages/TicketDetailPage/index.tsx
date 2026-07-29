import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import { DeleteModal } from "@/components/DeleteModal";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useT } from "@/i18n/I18nContext";
import { useTheme } from "@/store/ThemeContext";
import {
  useTicket,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
} from "@/features/tickets/hooks/useTicket";
import {
  buildFieldSx,
  buildMarkdownSx,
  buildPalette,
  buildPriorityConfig,
  buildStatusConfig,
} from "./helpers";
import { TicketHeader } from "./components/TicketHeader";
import { SectionDivider } from "./components/SectionDivider";
import { CommentThread } from "./components/CommentThread";
import { CommentComposer } from "./components/CommentComposer";
import { PropertiesCard } from "./components/PropertiesCard";
import { HistoryCard } from "./components/HistoryCard";
import { EditCommentModal } from "./components/EditCommentModal";
import { useApiError } from "@/hooks/useApiError";
import { useNotifications } from "@/features/notifications/useNotifications";
import { Theme } from "@/types/enums";

const routeApi = getRouteApi("/_authenticated/tickets/$id");

export const TicketDetailPage: React.FC = () => {
  const t = useT();
  const apiError = useApiError();
  const { id } = routeApi.useParams();
  const { markReadByTicketId } = useNotifications();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === Theme.Dark;
  const palette = useMemo(() => buildPalette(isDark), [isDark]);
  const statusConfig = useMemo(() => buildStatusConfig(isDark), [isDark]);
  const priorityConfig = useMemo(() => buildPriorityConfig(isDark), [isDark]);
  const markdownSx = useMemo(() => buildMarkdownSx(palette), [palette]);
  const fieldSx = useMemo(() => buildFieldSx(palette), [palette]);

  const { ticket, loading, notFound } = useTicket(id);
  const addCommentMutation = useAddComment(id ?? "");
  const updateCommentMutation = useUpdateComment(id ?? "");
  const deleteCommentMutation = useDeleteComment(id ?? "");

  const [composerValue, setComposerValue] = useState("");
  const submitting = addCommentMutation.isPending;

  const [editCommentTarget, setEditCommentTarget] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [editCommentValue, setEditCommentValue] = useState("");
  const [editCommentPreview, setEditCommentPreview] = useState(false);
  const editCommentSaving = updateCommentMutation.isPending;
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<string | null>(
    null,
  );
  const deleteCommentLoading = deleteCommentMutation.isPending;

  useEffect(() => {
    if (ticket && id) markReadByTicketId(id);
  }, [ticket, id, markReadByTicketId]);

  useEffect(() => {
    if (notFound) showToast(t("tickets.detail.not_found_toast"), "error");
  }, [notFound, showToast, t]);

  const endpointMatch = useMemo(() => {
    if (!ticket) return null;
    const merged = `${ticket.title} ${ticket.description}`;
    return merged.match(/(\/api\/[a-z0-9/_-]+)/i)?.[1] ?? null;
  }, [ticket]);

  const titleBeforeEndpoint = useMemo(() => {
    if (!ticket || !endpointMatch) return ticket?.title ?? "";
    if (ticket.title.includes(endpointMatch)) {
      return ticket.title.replace(endpointMatch, "").trim();
    }
    return ticket.title;
  }, [ticket, endpointMatch]);

  const handleAddComment = (content: string) => {
    if (!ticket || !content.trim()) return;
    addCommentMutation.mutate(content, {
      onSuccess: () => {
        setComposerValue("");
        showToast(t("tickets.detail.reply_sent"), "success");
      },
      onError: (err) =>
        showToast(
          apiError(err, t("tickets.detail.add_comment_error")),
          "error",
        ),
    });
  };

  const handleEditComment = () => {
    if (!ticket || !editCommentTarget || !editCommentValue.trim()) return;
    updateCommentMutation.mutate(
      { commentId: editCommentTarget.id, content: editCommentValue },
      {
        onSuccess: () => {
          setEditCommentTarget(null);
          showToast(t("tickets.detail.comment_updated"), "success");
        },
        onError: (err) =>
          showToast(apiError(err, t("tickets.detail.update_error")), "error"),
      },
    );
  };

  const handleDeleteComment = () => {
    if (!ticket || !deleteCommentTarget) return;
    deleteCommentMutation.mutate(deleteCommentTarget, {
      onSuccess: () => {
        setDeleteCommentTarget(null);
        showToast(t("tickets.detail.comment_deleted"), "success");
      },
      onError: (err) =>
        showToast(apiError(err, t("tickets.detail.delete_error")), "error"),
    });
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
      <Box
        className="page-enter"
        sx={{
          p: { xs: "20px 8px", md: "20px 28px" },
          minHeight: "100vh",
          display: "flex",
          gap: "14px",
          alignItems: "flex-start",
          flexDirection: { xs: "column", lg: "row" },
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
          <TicketHeader
            palette={palette}
            endpointMatch={endpointMatch}
            titleBeforeEndpoint={titleBeforeEndpoint}
          />

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
                      color: palette.mdText,
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
              comments={ticket.comments}
              currentUserId={user?.id}
              palette={palette}
              onEdit={(idValue, content) => {
                setEditCommentTarget({ id: idValue, content });
                setEditCommentValue(content);
                setEditCommentPreview(false);
              }}
              onDelete={setDeleteCommentTarget}
            />

            <CommentComposer
              ticketId={id ?? ""}
              value={composerValue}
              onValueChange={setComposerValue}
              submitting={submitting}
              onSubmit={handleAddComment}
              palette={palette}
              fieldSx={fieldSx}
              markdownSx={markdownSx}
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
            statusConfig={statusConfig}
            priorityConfig={priorityConfig}
          />
        </Box>
      </Box>

      <EditCommentModal
        open={!!editCommentTarget}
        onClose={() => setEditCommentTarget(null)}
        value={editCommentValue}
        onValueChange={setEditCommentValue}
        preview={editCommentPreview}
        onPreviewChange={setEditCommentPreview}
        saving={editCommentSaving}
        onSubmit={handleEditComment}
        markdownSx={markdownSx}
        fieldSx={fieldSx}
      />

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
