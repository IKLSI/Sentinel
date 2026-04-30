import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import ForumOutlined from "@mui/icons-material/ForumOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import LinkRounded from "@mui/icons-material/LinkRounded";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import LockOutlined from "@mui/icons-material/LockOutlined";
import MessageOutlined from "@mui/icons-material/MessageOutlined";
import AttachFileOutlined from "@mui/icons-material/AttachFileOutlined";
import SendRounded from "@mui/icons-material/SendRounded";
import FormatBoldRounded from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRounded from "@mui/icons-material/FormatItalicRounded";
import CodeRounded from "@mui/icons-material/CodeRounded";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppModal } from "../../../components/AppModal";
import { DeleteModal } from "../../../components/DeleteModal";
import { useToast } from "../../../hooks/useToast";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  addComment,
  deleteComment,
  getTicket,
  updateComment,
} from "../api/tickets";
import { Ticket, TicketHistory, TicketStatus } from "../../../types";
import { useT } from "../../../i18n/I18nContext";

const statusConfig: Record<
  TicketStatus,
  { labelKey: string; color: string; dot: string }
> = {
  new: { labelKey: "tickets.detail.status_new", color: "#4f46e5", dot: "#818cf8" },
  in_progress: { labelKey: "tickets.detail.status_in_progress", color: "#c2410c", dot: "#f97316" },
  testing: { labelKey: "tickets.detail.status_testing", color: "#0e7490", dot: "#06b6d4" },
  resolved: { labelKey: "tickets.detail.status_resolved", color: "#15803d", dot: "#22c55e" },
  closed: { labelKey: "tickets.detail.status_closed", color: "#475569", dot: "#64748b" },
};

const priorityConfig: Record<
  string,
  { labelKey: string; color: string; dot: string }
> = {
  critical: { labelKey: "tickets.detail.priority_critical", color: "#be123c", dot: "#f43f5e" },
  high: { labelKey: "tickets.detail.priority_high", color: "#b45309", dot: "#f59e0b" },
  medium: { labelKey: "tickets.detail.priority_medium", color: "#ca8a04", dot: "#eab308" },
  low: { labelKey: "tickets.detail.priority_low", color: "#15803d", dot: "#22c55e" },
};

const typeLabelKeys: Record<string, string> = {
  bug: "tickets.detail.type_bug",
  feature: "tickets.detail.type_feature",
  security: "tickets.detail.type_security",
  performance: "tickets.detail.type_performance",
  maintenance: "tickets.detail.type_maintenance",
  question: "tickets.detail.type_question",
};

const markdownSx = {
  fontSize: "13px",
  color: "#334155",
  lineHeight: 1.7,
  "& p": { m: 0, mb: "10px" },
  "& p:last-child": { mb: 0 },
  "& code": {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "7px",
    px: "6px",
    py: "2px",
    color: "#0f172a",
  },
  "& pre": {
    mt: "14px",
    mb: "6px",
    borderRadius: "14px",
    border: "1px solid #0f172a",
    background: "#020617",
    overflow: "auto",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  },
  "& pre code": {
    display: "block",
    background: "transparent",
    border: "none",
    fontSize: "13px",
    lineHeight: 1.7,
    color: "#e2e8f0",
    p: "14px 18px",
  },
  "& strong": { color: "#0f172a", fontWeight: 700 },
  "& ul, & ol": { pl: "20px", m: 0 },
} as const;

const fieldSx = {
  background: "#ffffff",
  border: "1px solid #dbe3ef",
  borderRadius: "14px",
  px: "18px",
  py: "14px",
  fontSize: "14px",
  color: "#0f172a",
  width: "100%",
  outline: "none",
  fontFamily: "var(--font-ui)",
  boxSizing: "border-box",
  transition: "border-color 0.12s, box-shadow 0.12s",
  "&:focus": {
    borderColor: "#a5b4fc",
    boxShadow: "0 0 0 3px rgba(99,102,241,0.15)",
  },
} as const;

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function getRelativeShort(date: string, t: (k: string, v?: Record<string, string | number>) => string) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('tickets.detail.relative_now');
  if (min < 60) return t('tickets.detail.relative_minutes', { n: min });
  const hours = Math.floor(min / 60);
  if (hours < 24) return t('tickets.detail.relative_hours', { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('tickets.detail.relative_days', { n: days });
  return format(new Date(date), "dd MMM", { locale: fr });
}

function normalizeStatusKey(value?: string) {
  if (!value) return "";
  const compact = value.trim().toLowerCase().replace(/[\s-]/g, "_");
  if (compact === "inprogress") return "in_progress";
  return compact;
}

function normalizePriorityKey(value?: string) {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/[\s-]/g, "_");
}

type TFn = (k: string, v?: Record<string, string | number>) => string;

function mapStatusLabel(value: string | undefined, t: TFn) {
  if (!value) return "—";
  const key = normalizeStatusKey(value) as TicketStatus;
  const labelKey = statusConfig[key]?.labelKey;
  return labelKey ? t(labelKey) : value;
}

function mapPriorityLabel(value: string | undefined, t: TFn) {
  if (!value) return "—";
  const key = normalizePriorityKey(value);
  const labelKey = priorityConfig[key]?.labelKey;
  return labelKey ? t(labelKey) : value;
}

function historyPresentation(entry: TicketHistory, t: TFn) {
  const field = entry.field.toLowerCase();
  if (field === "created" || field === "creation" || field.includes("create")) {
    return {
      tone: { dot: "#fda4af", ring: "#ffe4e6" },
      message: t('tickets.detail.history_created'),
    };
  }
  if (field.includes("status")) {
    return {
      tone: { dot: "#fbbf24", ring: "#fef3c7" },
      message: t('tickets.detail.history_status_change', { from: mapStatusLabel(entry.oldValue, t), to: mapStatusLabel(entry.newValue, t) }),
    };
  }
  if (field.includes("assign")) {
    return {
      tone: { dot: "#a78bfa", ring: "#ede9fe" },
      message: t('tickets.detail.history_assigned', { name: entry.newValue ?? t('tickets.detail.unassigned') }),
    };
  }
  if (field.includes("priority")) {
    return {
      tone: { dot: "#fb7185", ring: "#ffe4e6" },
      message: t('tickets.detail.history_priority_change', { from: mapPriorityLabel(entry.oldValue, t), to: mapPriorityLabel(entry.newValue, t) }),
    };
  }
  return {
    tone: { dot: "#86efac", ring: "#dcfce7" },
    message:
      entry.oldValue || entry.newValue
        ? `${entry.field} ${entry.oldValue ?? "—"} → ${entry.newValue ?? "—"}`
        : t('tickets.detail.history_field_updated', { field: entry.field }),
  };
}

export const TicketDetailPage: React.FC = () => {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [composerMode, setComposerMode] = useState<"reply" | "internal">(
    "reply",
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
    setLoading(true);
    setNotFound(false);
    getTicket(id)
      .then((t) => setTicket(t))
      .catch(() => {
        setNotFound(true);
        showToast(t('tickets.detail.not_found_toast'), "error");
      })
      .finally(() => setLoading(false));
  }, [id, showToast, t]);

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

  const handleAddComment = async () => {
    if (!ticket || !composerValue.trim()) return;
    setSubmitting(true);
    try {
      const isInternal = composerMode === "internal";
      const created = await addComment(ticket.id, composerValue, isInternal);
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
        isInternal ? t('tickets.detail.internal_note_added') : t('tickets.detail.reply_sent'),
        "success",
      );
    } catch {
      showToast(t('tickets.detail.add_comment_error'), "error");
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
      showToast(t('tickets.detail.comment_updated'), "success");
    } catch {
      showToast(t('tickets.detail.update_error'), "error");
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
      showToast(t('tickets.detail.comment_deleted'), "success");
    } catch {
      showToast(t('tickets.detail.delete_error'), "error");
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
          {t('tickets.detail.not_found_title')}
        </Box>
        <Box sx={{ fontSize: "12px", color: "var(--muted)" }}>
          {t('tickets.detail.not_found_subtitle')}
        </Box>
      </Box>
    );
  }

  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority] ?? priorityConfig.medium;

  return (
    <>
      <Box
        className="page-enter"
        sx={{
          p: { xs: "12px 8px 10px", md: "20px 28px 16px" },
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
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "20px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 12px 30px -18px rgba(15,23,42,0.18)",
          }}
        >
          <Box
            sx={{
              px: { xs: "24px", md: "40px" },
              pt: { xs: "24px", md: "36px" },
              pb: 0,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                mb: "24px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 600,
                }}
              >
                <FolderOutlined sx={{ fontSize: 13, color: "#7c3aed" }} />
                {ticket.projectName ?? t('tickets.detail.project_label')}
              </Box>
              <ChevronRightOutlined sx={{ fontSize: 12, color: "#cbd5e1" }} />
              <Box
                sx={{
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em",
                  fontSize: "12px",
                  color: "#475569",
                  fontWeight: 700,
                }}
              >
                {ticket.reference}
              </Box>
              <ChevronRightOutlined sx={{ fontSize: 12, color: "#cbd5e1" }} />
              <Box sx={{ color: "#94a3b8", fontSize: "12px" }}>
                {t('tickets.detail.opened_label')}{" "}
                <Box
                  component="span"
                  sx={{ color: "#334155", fontWeight: 700 }}
                >
                  {getRelativeShort(ticket.createdAt, t)}
                </Box>
              </Box>
            </Box>

            <Box
              component="h1"
              sx={{
                m: 0,
                mt: "4px",
                mb: "0px",
                fontSize: { xs: "18px", md: "24px" },
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "#0f172a",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {titleBeforeEndpoint}
              {endpointMatch && (
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: { xs: "17px", md: "28px" },
                    color: "#5b3dd1",
                    background:
                      "linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%)",
                    border: "1px solid #d8ccff",
                    borderRadius: "14px",
                    px: "16px",
                    py: "8px",
                    fontWeight: 600,
                  }}
                >
                  <LinkRounded sx={{ fontSize: 20, color: "#8b5cf6" }} />
                  {endpointMatch}
                </Box>
              )}
            </Box>

          </Box>

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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                mb: "22px",
              }}
            >
              <Box sx={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  whiteSpace: "nowrap",
                }}
              >
                <DescriptionOutlined sx={{ fontSize: 13 }} />
                {t('tickets.detail.section_description')}
              </Box>
              <Box sx={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            </Box>

            <Box>
              {ticket.description ? (
                <Box sx={markdownSx}>
                  <ReactMarkdown>{ticket.description}</ReactMarkdown>
                </Box>
              ) : (
                <Box sx={{ color: "#94a3b8", fontSize: "13px" }}>
                  {t('tickets.detail.no_description')}
                </Box>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                my: "28px",
              }}
            >
              <Box sx={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  whiteSpace: "nowrap",
                }}
              >
                <ForumOutlined sx={{ fontSize: 13 }} />
                {t('tickets.detail.section_conversation')}{ticket.comments.length > 0 ? ` · ${ticket.comments.length}` : ""}
              </Box>
              <Box sx={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            </Box>

            <>
              <Box sx={{ position: "relative" }}>

              {ticket.comments.map((c, idx) => {
                const own = user?.id === c.authorId;
                return (
                  <Box
                    key={c.id}
                    sx={{
                      display: "flex",
                      gap: "10px",
                      mb: "12px",
                      position: "relative",
                    }}
                  >
                    {idx < ticket.comments.length - 1 && (
                      <Box
                        sx={{
                          position: "absolute",
                          left: "14px",
                          top: "36px",
                          height: "calc(100% - 30px)",
                          width: "1px",
                          background: "#e2e8f0",
                          zIndex: 0,
                        }}
                      />
                    )}
                    <Box
                      sx={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        background: c.isInternal
                          ? "linear-gradient(140deg, #c4b5fd 0%, #818cf8 100%)"
                          : "linear-gradient(140deg, #fda4af 0%, #fb7185 100%)",
                        color: "#fff",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 800,
                        fontSize: "11px",
                        display: "grid",
                        placeItems: "center",
                        zIndex: 1,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(c.author.firstName, c.author.lastName)}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          mb: "6px",
                        }}
                      >
                        <Box
                          sx={{
                            fontSize: "13px",
                            color: "#0f172a",
                            fontWeight: 700,
                          }}
                        >
                          {c.author.firstName} {c.author.lastName}
                        </Box>

                        {c.isInternal && (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              fontSize: "11px",
                              color: "#b45309",
                              fontWeight: 800,
                              px: "10px",
                              py: "4px",
                              borderRadius: "8px",
                            }}
                          >
                            <LockOutlined sx={{ fontSize: 14 }} />
                            {t('tickets.detail.internal_note_badge')}
                          </Box>
                        )}

                        <Box sx={{ color: "#cbd5e1", fontSize: "11px" }}>·</Box>
                        <Box
                          sx={{
                            fontFamily: "var(--font-mono)",
                            color: "#94a3b8",
                            fontSize: "11px",
                          }}
                        >
                          {format(new Date(c.createdAt), "HH:mm", {
                            locale: fr,
                          })}
                        </Box>

                        {own && (
                          <Box sx={{ ml: "auto", display: "flex", gap: "4px" }}>
                            <Box
                              component="button"
                              onClick={() => {
                                setEditCommentTarget({
                                  id: c.id,
                                  content: c.content,
                                });
                                setEditCommentValue(c.content);
                                setEditCommentPreview(false);
                              }}
                              sx={{
                                all: "unset",
                                width: "28px",
                                height: "28px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                color: "#94a3b8",
                                display: "grid",
                                placeItems: "center",
                                "&:hover": {
                                  background: "#f1f5f9",
                                  color: "#0f172a",
                                },
                              }}
                            >
                              <EditOutlined sx={{ fontSize: 15 }} />
                            </Box>
                            <Box
                              component="button"
                              onClick={() => setDeleteCommentTarget(c.id)}
                              sx={{
                                all: "unset",
                                width: "28px",
                                height: "28px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                color: "#94a3b8",
                                display: "grid",
                                placeItems: "center",
                                "&:hover": {
                                  background: "#fee2e2",
                                  color: "#dc2626",
                                },
                              }}
                            >
                              <DeleteOutlineOutlined sx={{ fontSize: 15 }} />
                            </Box>
                          </Box>
                        )}
                      </Box>

                      <Box
                        sx={{
                          border: c.isInternal
                            ? "1px solid #fde68a"
                            : "1px solid #e2e8f0",
                          borderRadius: "14px",
                          background: c.isInternal ? "#fffbeb" : "#f8fafc",
                        }}
                      >
                        <Box sx={{ p: "12px 16px" }}>
                          <Box sx={markdownSx}>
                            <ReactMarkdown>{c.content}</ReactMarkdown>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })}

              {ticket.comments.length === 0 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    py: "32px",
                    color: "#94a3b8",
                  }}
                >
                  <ForumOutlined sx={{ fontSize: 28, opacity: 0.4 }} />
                  <Box sx={{ fontSize: "13px", fontWeight: 500 }}>{t('tickets.detail.no_comments_title')}</Box>
                  <Box sx={{ fontSize: "12px", color: "#cbd5e1" }}>{t('tickets.detail.no_comments_subtitle')}</Box>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: "28px" }}>
              <Box
                sx={{
                  display: "inline-flex",
                  p: "3px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  mb: "8px",
                  gap: "3px",
                }}
              >
                {[
                  {
                    key: "reply",
                    label: t('tickets.detail.tab_reply'),
                    icon: <MessageOutlined sx={{ fontSize: 14 }} />,
                  },
                  {
                    key: "internal",
                    label: t('tickets.detail.tab_internal_note'),
                    icon: <LockOutlined sx={{ fontSize: 14 }} />,
                  },
                ].map((tab) => {
                  const active = composerMode === tab.key;
                  return (
                    <Box
                      key={tab.key}
                      component="button"
                      onClick={() =>
                        setComposerMode(tab.key as "reply" | "internal")
                      }
                      sx={{
                        all: "unset",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        px: "12px",
                        height: "34px",
                        borderRadius: "10px",
                        color: active ? "#0f172a" : "#64748b",
                        background: active ? "#ffffff" : "transparent",
                        boxShadow: active
                          ? "0 1px 2px rgba(15,23,42,0.08)"
                          : "none",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {tab.icon}
                      {tab.label}
                    </Box>
                  );
                })}
              </Box>

              <Box
                sx={{
                  border: "1px solid #dbe3ef",
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: "#ffffff",
                }}
              >
                <Box
                  component="textarea"
                  value={composerValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setComposerValue(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (
                      e.key === "Enter" &&
                      (e.metaKey || e.ctrlKey) &&
                      composerValue.trim()
                    )
                      handleAddComment();
                  }}
                  rows={4}
                  placeholder={
                    composerMode === "internal"
                      ? t('tickets.detail.composer_internal_placeholder')
                      : t('tickets.detail.composer_reply_placeholder')
                  }
                  sx={{
                    ...fieldSx,
                    border: "none",
                    borderRadius: 0,
                    boxShadow: "none !important",
                    px: "16px",
                    py: "12px",
                    resize: "vertical",
                    minHeight: "90px",
                  }}
                />
                <Box sx={{ height: "1px", background: "#e2e8f0" }} />
                <Box
                  sx={{
                    px: "12px",
                    py: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {[
                    <FormatBoldRounded key="b" sx={{ fontSize: 16 }} />,
                    <FormatItalicRounded key="i" sx={{ fontSize: 16 }} />,
                    <CodeRounded key="c" sx={{ fontSize: 16 }} />,
                    <LinkOutlined key="l" sx={{ fontSize: 16 }} />,
                    <AttachFileOutlined key="a" sx={{ fontSize: 16 }} />,
                  ].map((icon, idx) => (
                    <Box
                      key={idx}
                      component="button"
                      sx={{
                        all: "unset",
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        cursor: "pointer",
                        color: "#94a3b8",
                        display: "grid",
                        placeItems: "center",
                        "&:hover": { background: "#f1f5f9", color: "#334155" },
                      }}
                    >
                      {icon}
                    </Box>
                  ))}
                  <Box sx={{ flex: 1 }} />
                  <Button
                    variant="contained"
                    onClick={handleAddComment}
                    disabled={!composerValue.trim() || submitting}
                    sx={{
                      minWidth: "120px",
                      height: "36px",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "13px",
                      background:
                        "linear-gradient(180deg,#6d5ef7 0%, #4f46e5 100%)",
                    }}
                    endIcon={!submitting ? <SendRounded sx={{ fontSize: 15 }} /> : undefined}
                  >
                    {submitting ? (
                      <CircularProgress size={14} sx={{ color: "#fff" }} />
                    ) : (
                      t('tickets.detail.send')
                    )}
                  </Button>
                </Box>
              </Box>
            </Box>
            </>
          </Box>
        </Box>

        <Box
          sx={{
            width: { xs: "100%", lg: "290px" },
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              background: "#ffffff",
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              p: "8px 6px 4px",
            }}
          >
            <Box
              sx={{
                px: "10px",
                pt: "4px",
                pb: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 800,
                color: "#94a3b8",
                fontSize: "10px",
              }}
            >
              {t('tickets.detail.section_properties')}
            </Box>
            {[
              {
                key: "status",
                label: t('tickets.detail.field_status'),
                value: (
                  <>
                    <Box
                      sx={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "999px",
                        background: status.dot,
                        flexShrink: 0,
                      }}
                    />
                    <Box
                      sx={{
                        color: status.color,
                        fontWeight: 400,
                        fontSize: "12px",
                      }}
                    >
                      {t(status.labelKey)}
                    </Box>
                  </>
                ),
              },
              {
                key: "priority",
                label: t('tickets.detail.field_priority'),
                value: (
                  <>
                    <Box
                      sx={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "999px",
                        background: priority.dot,
                        flexShrink: 0,
                      }}
                    />
                    <Box
                      sx={{
                        color: priority.color,
                        fontWeight: 400,
                        fontSize: "12px",
                      }}
                    >
                      {t(priority.labelKey)}
                    </Box>
                  </>
                ),
              },
              {
                key: "type",
                label: t('tickets.detail.field_type'),
                value: (
                  <>
                    <ShieldOutlined sx={{ fontSize: 14, color: "#64748b" }} />
                    <Box
                      sx={{
                        color: "#0f172a",
                        fontWeight: 400,
                        fontSize: "12px",
                      }}
                    >
                      {typeLabelKeys[ticket.type] ? t(typeLabelKeys[ticket.type]) : ticket.type}
                    </Box>
                  </>
                ),
              },
              {
                key: "assignee",
                label: t('tickets.detail.field_assignee'),
                value: ticket.assignee ? (
                  <Box sx={{ color: "#0f172a", fontWeight: 400, fontSize: "12px" }}>
                    {ticket.assignee.firstName} {ticket.assignee.lastName}
                  </Box>
                ) : (
                  <Box
                    sx={{ color: "#94a3b8", fontWeight: 400, fontSize: "12px" }}
                  >
                    {t('tickets.detail.unassigned')}
                  </Box>
                ),
              },
              {
                key: "project",
                label: t('tickets.detail.field_project'),
                value: (
                  <>
                    <FolderOutlined sx={{ fontSize: 14, color: "#7c3aed" }} />
                    <Box
                      sx={{
                        color: "#0f172a",
                        fontWeight: 400,
                        fontSize: "12px",
                      }}
                    >
                      {ticket.projectName ?? "—"}
                    </Box>
                  </>
                ),
              },
            ].map((row, idx, arr) => (
              <Box key={row.key}>
                <Box
                  component="button"
                  sx={{
                    all: "unset",
                    width: "100%",
                    boxSizing: "border-box",
                    py: "9px",
                    px: "10px",
                    display: "grid",
                    gridTemplateColumns: "76px 1fr",
                    alignItems: "center",
                    gap: "8px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    "&:hover": { background: "#f8fafc" },
                  }}
                >
                  <Box
                    sx={{ color: "#94a3b8", fontSize: "11px", fontWeight: 400 }}
                  >
                    {row.label}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    {row.value}
                    {row.key !== "project" && (
                      <KeyboardArrowDownRounded
                        sx={{ ml: "auto", color: "#cbd5e1" }}
                      />
                    )}
                  </Box>
                </Box>
                {idx < arr.length - 1 && (
                  <Box
                    sx={{ mx: "8px", height: "1px", background: "#eef2f7" }}
                  />
                )}
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              background: "#ffffff",
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              p: "8px 6px 4px",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                px: "10px",
                pt: "4px",
                pb: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 800,
                color: "#94a3b8",
                fontSize: "10px",
              }}
            >
              {t('tickets.detail.section_history')}
            </Box>
            <Box
              sx={{
                position: "relative",
                px: "10px",
                pb: "6px",
                overflowY: "auto",
              }}
            >
              {ticket.history.length > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    left: "13px",
                    top: "14px",
                    bottom: "14px",
                    width: "2px",
                    background:
                      "linear-gradient(180deg, #e2e8f0 0%, #e2e8f0 80%, transparent 100%)",
                  }}
                />
              )}

              {[...ticket.history]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .map((h) => {
                  const event = historyPresentation(h, t);
                  return (
                    <Box
                      key={h.id}
                      sx={{
                        display: "flex",
                        gap: "8px",
                        mb: "8px",
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          width: "8px",
                          height: "8px",
                          mt: "8px",
                          borderRadius: "999px",
                          background: event.tone.dot,
                          border: "2px solid #fff",
                          boxShadow: `0 0 0 2px ${event.tone.ring}`,
                          zIndex: 1,
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0, pt: "2px" }}>
                        <Box
                          sx={{
                            fontSize: "11px",
                            color: "#0f172a",
                            lineHeight: 1.35,
                          }}
                        >
                          {event.message}
                        </Box>
                        <Box
                          sx={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "10px",
                            color: "#94a3b8",
                            mt: "4px",
                          }}
                        >
                          {getRelativeShort(h.createdAt, t)} · {h.author.firstName}{" "}
                          {h.author.lastName}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}

              {ticket.history.length === 0 && (
                <Box sx={{ color: "#94a3b8", fontSize: "13px", py: "4px" }}>
                  {t('tickets.detail.no_history')}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <AppModal
        open={!!editCommentTarget}
        onClose={() => !editCommentSaving && setEditCommentTarget(null)}
        title={t('tickets.detail.edit_comment_title')}
        actions={
          <>
            <Button
              variant="outlined"
              size="small"
              className="btn-cancel"
              sx={{ textTransform: "none" }}
              onClick={() => setEditCommentTarget(null)}
              disabled={editCommentSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: "none" }}
              onClick={handleEditComment}
              disabled={!editCommentValue.trim() || editCommentSaving}
            >
              {editCommentSaving ? (
                <CircularProgress size={14} sx={{ color: "#fff" }} />
              ) : (
                t('common.save')
              )}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: "4px",
                background: "var(--s2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                p: "3px",
              }}
            >
              {([
                { key: "edit", label: t('tickets.detail.tab_edit') },
                { key: "preview", label: t('tickets.detail.tab_preview') },
              ] as const).map((tab) => {
                const active =
                  tab.key === "edit" ? !editCommentPreview : editCommentPreview;
                return (
                  <Box
                    key={tab.key}
                    component="button"
                    onClick={() => setEditCommentPreview(tab.key === "preview")}
                    sx={{
                      all: "unset",
                      cursor: "pointer",
                      px: "12px",
                      height: "26px",
                      fontSize: "11px",
                      fontWeight: 600,
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      background: active ? "var(--s1)" : "transparent",
                      color: active ? "var(--text)" : "var(--muted)",
                      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                      transition: "all 0.12s",
                    }}
                  >
                    {tab.label}
                  </Box>
                );
              })}
            </Box>
            <Box
              sx={{
                fontSize: "10px",
                color: "var(--muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {t('tickets.detail.markdown_supported')}
            </Box>
          </Box>
          {editCommentPreview ? (
            <Box
              sx={{
                background: "var(--s2)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                p: "14px 16px",
                minHeight: "150px",
                ...markdownSx,
              }}
            >
              {editCommentValue ? (
                <ReactMarkdown>{editCommentValue}</ReactMarkdown>
              ) : (
                <Box sx={{ fontSize: "12px", color: "var(--muted)" }}>
                  {t('tickets.detail.preview_empty')}
                </Box>
              )}
            </Box>
          ) : (
            <Box
              component="textarea"
              autoFocus
              value={editCommentValue}
              rows={7}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEditCommentValue(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (
                  e.key === "Enter" &&
                  (e.metaKey || e.ctrlKey) &&
                  editCommentValue.trim()
                )
                  handleEditComment();
              }}
              sx={{ ...fieldSx, resize: "none", lineHeight: 1.65 }}
            />
          )}
        </Box>
      </AppModal>

      <DeleteModal
        open={!!deleteCommentTarget}
        onClose={() => setDeleteCommentTarget(null)}
        onConfirm={handleDeleteComment}
        loading={deleteCommentLoading}
        title={t('tickets.detail.delete_comment_title')}
      >
        {t('tickets.detail.delete_comment_message')}
      </DeleteModal>
    </>
  );
};
