import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import { DeleteModal } from "@/components/ui/common/DeleteModal";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
} from "@/domains/tickets/mutations";
import { useTicketQuery } from "@/domains/tickets/queries";
import {
  buildFieldSx,
  buildMarkdownSx,
  buildPalette,
  buildPriorityConfig,
} from "@/features/tickets/pages/TicketDetailPage/helpers";
import { TicketHeader } from "@/features/tickets/pages/TicketDetailPage/components/TicketHeader";
import { SectionDivider } from "@/features/tickets/pages/TicketDetailPage/components/SectionDivider";
import { CommentThread } from "@/features/tickets/pages/TicketDetailPage/components/CommentThread";
import { CommentComposer } from "@/features/tickets/pages/TicketDetailPage/components/CommentComposer";
import { PropertiesCard } from "@/features/tickets/pages/TicketDetailPage/components/PropertiesCard";
import { HistoryCard } from "@/features/tickets/pages/TicketDetailPage/components/HistoryCard";
import { EditCommentModal } from "@/features/tickets/pages/TicketDetailPage/components/EditCommentModal";
import { useApiError } from "@/hooks/useApiError";
import { Theme } from "@/enums";
import { commentContentSchema } from "@/features/tickets/pages/TicketDetailPage/schemas";

const routeApi = getRouteApi("/_authenticated/tickets/$id");

export const TicketDetailPage: React.FC = () => {
  const t = useT();
  const apiError = useApiError();
  const { id } = routeApi.useParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === Theme.Dark;
  const palette = useMemo(() => buildPalette(isDark), [isDark]);
  const priorityConfig = useMemo(() => buildPriorityConfig(isDark), [isDark]);
  const markdownSx = useMemo(() => buildMarkdownSx(palette), [palette]);
  const fieldSx = useMemo(() => buildFieldSx(palette), [palette]);

  const ticketQuery = useTicketQuery(id);
  const ticket = ticketQuery.data ?? null;
  const loading = ticketQuery.isLoading;
  const notFound = ticketQuery.isError;
  const addCommentMutation = useAddCommentMutation(id ?? "");
  const updateCommentMutation = useUpdateCommentMutation(id ?? "");
  const deleteCommentMutation = useDeleteCommentMutation(id ?? "");

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
    if (notFound) showToast(t("tickets.detail.not_found_toast"), "error");
  }, [notFound, showToast, t]);

  const endpointMatch = useMemo(() => {
    if (!ticket) return null;
    const merged = `${ticket.title} ${ticket.description}`;
    return merged.match(/(\/api\/[a-z0-9/_-]+)/i)?.[1] ?? null;
  }, [ticket]);

  const titleBeforeEndpoint = useMemo(() => {
    const title = ticket?.title ?? "";
    if (!endpointMatch) return title;
    if (title.includes(endpointMatch)) {
      return title.replace(endpointMatch, "").trim();
    }
    return title;
  }, [ticket, endpointMatch]);

  const handleAddComment = (content: string) => {
    if (!ticket || !commentContentSchema.safeParse(content).success) return;
    addCommentMutation.mutate(
      { id: ticket.id, data: { content } },
      {
        onSuccess: () => {
          setComposerValue("");
          showToast(t("tickets.detail.reply_sent"), "success");
        },
        onError: (err) =>
          showToast(
            apiError(err, t("tickets.detail.add_comment_error")),
            "error",
          ),
      },
    );
  };

  const handleEditComment = () => {
    if (
      !ticket ||
      !editCommentTarget ||
      !commentContentSchema.safeParse(editCommentValue).success
    )
      return;
    updateCommentMutation.mutate(
      {
        id: ticket.id,
        commentId: editCommentTarget.id,
        data: { content: editCommentValue },
      },
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
    deleteCommentMutation.mutate(
      { id: ticket.id, commentId: deleteCommentTarget },
      {
        onSuccess: () => {
          setDeleteCommentTarget(null);
          showToast(t("tickets.detail.comment_deleted"), "success");
        },
        onError: (err) =>
          showToast(apiError(err, t("tickets.detail.delete_error")), "error"),
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
              comments={ticket.comments ?? []}
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
