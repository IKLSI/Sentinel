import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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
  addComment,
  deleteComment,
  getTicket,
  updateComment,
} from "@/features/tickets/api/tickets";
import { Ticket } from "@/types";
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
import { extractApiError } from "@/utils/apiError";
import { useNotifications } from "@/features/notifications/useNotifications";
import { CommentMode, Theme } from "@/types/enums";

export const TicketDetailPage: React.FC = () => {
  const t = useT();
  const { id } = useParams<{ id: string }>();
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

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [composerMode, setComposerMode] = useState<CommentMode>(
    CommentMode.Reply,
  );
  const [composerValue, setComposerValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editCommentTarget, setEditCommentTarget] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [editCommentValue, setEditCommentValue] = useState("");
  const [editCommentPreview, setEditCommentPreview] = useState(false);
  const [editCommentSaving, setEditCommentSaving] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<string | null>(
    null,
  );
  const [deleteCommentLoading, setDeleteCommentLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    setLoading(true);
    setNotFound(false);
    getTicket(id, ctrl.signal)
      .then((tk) => {
        if (ctrl.signal.aborted) return;
        setTicket(tk);
        markReadByTicketId(id);
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        setNotFound(true);
        showToast(t("tickets.detail.not_found_toast"), "error");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [id, showToast, t, markReadByTicketId]);

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

  const handleAddComment = async (content: string) => {
    if (!ticket || !content.trim()) return;
    setSubmitting(true);
    try {
      const isInternal = composerMode === "internal";
      const created = await addComment(ticket.id, content, isInternal);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              comments: [
                ...prev.comments,
                { ...created, isInternal: created.isInternal || isInternal },
              ],
            }
          : prev,
      );
      setComposerValue("");
      showToast(
        isInternal
          ? t("tickets.detail.internal_note_added")
          : t("tickets.detail.reply_sent"),
        "success",
      );
    } catch (err) {
      showToast(
        extractApiError(err, t("tickets.detail.add_comment_error")),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async () => {
    if (!ticket || !editCommentTarget || !editCommentValue.trim()) return;
    setEditCommentSaving(true);
    try {
      const updated = await updateComment(
        ticket.id,
        editCommentTarget.id,
        editCommentValue,
      );
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map((c) =>
                c.id === updated.id
                  ? { ...updated, isInternal: c.isInternal }
                  : c,
              ),
            }
          : prev,
      );
      setEditCommentTarget(null);
      showToast(t("tickets.detail.comment_updated"), "success");
    } catch (err) {
      showToast(
        extractApiError(err, t("tickets.detail.update_error")),
        "error",
      );
    } finally {
      setEditCommentSaving(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!ticket || !deleteCommentTarget) return;
    setDeleteCommentLoading(true);
    try {
      await deleteComment(ticket.id, deleteCommentTarget);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter(
                (c) => c.id !== deleteCommentTarget,
              ),
            }
          : prev,
      );
      setDeleteCommentTarget(null);
      showToast(t("tickets.detail.comment_deleted"), "success");
    } catch (err) {
      showToast(
        extractApiError(err, t("tickets.detail.delete_error")),
        "error",
      );
    } finally {
      setDeleteCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: "80px" }}>
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
            maxHeight: { xs: "calc(100vh - 22px)", md: "calc(100vh - 36px)" },
            background: palette.panelBg,
            border: `1px solid ${palette.panelBorder}`,
            borderRadius: 'var(--r-xl)',
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
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
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
                  <Box sx={{ fontSize: "13px", color: palette.mdText, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {ticket.description}
                  </Box>
                </Box>
              </>
            )}

            <SectionDivider
              palette={palette}
              icon={<ForumOutlined sx={{ fontSize: 13 }} />}
              label={`${t("tickets.detail.section_conversation")}${ticket.comments.length > 0 ? ` · ${ticket.comments.length}` : ""}`}
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
              mode={composerMode}
              onModeChange={setComposerMode}
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
        {t("tickets.detail.delete_comment_message")}<br />{t("common.action_irreversible_before")}<b>{t("common.action_irreversible_word")}</b>{t("common.action_irreversible_after")}
      </DeleteModal>
    </>
  );
};
