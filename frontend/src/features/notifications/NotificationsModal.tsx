import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import Tooltip from "@mui/material/Tooltip";
import NotificationsNone from "@mui/icons-material/NotificationsNone";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import SyncOutlined from "@mui/icons-material/SyncOutlined";
import ChatBubbleOutlineOutlined from "@mui/icons-material/ChatBubbleOutlineOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import { useNavigate } from "@tanstack/react-router";
import { useT } from "@/i18n/I18nContext";
import { useNotifications } from "./useNotifications";
import type { NotificationItem } from "./api";

type Filter = "all" | "unread" | "read";

const FILTERS: { key: Filter; labelKey: string }[] = [
  { key: "all", labelKey: "notifications.filter.all" },
  { key: "unread", labelKey: "notifications.filter.unread" },
  { key: "read", labelKey: "notifications.filter.read" },
];

const TYPE_META: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  TicketAssigned: {
    icon: PersonAddOutlined,
    color: "var(--violet)",
    bg: "var(--violet-subtle)",
    label: "Assignation",
  },
  TicketStatusChanged: {
    icon: SyncOutlined,
    color: "var(--sky)",
    bg: "var(--sky-subtle)",
    label: "Statut",
  },
  TicketCommentAdded: {
    icon: ChatBubbleOutlineOutlined,
    color: "var(--emerald)",
    bg: "var(--emerald-subtle)",
    label: "Commentaire",
  },
};

const DEFAULT_META = {
  icon: NotificationsNone,
  color: "var(--muted)",
  bg: "var(--s3)",
  label: "Notification",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}j`;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<Props> = ({ open, onClose }) => {
  const t = useT();
  const navigate = useNavigate();
  const { items, unreadCount, markReadByTicketId, markAllRead } =
    useNotifications();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered =
    activeFilter === "unread"
      ? items.filter((n) => !n.isRead)
      : activeFilter === "read"
        ? items.filter((n) => n.isRead)
        : items;

  const unreadFiltered = items.filter((n) => !n.isRead).length;

  const handleClick = (notif: NotificationItem) => {
    if (!notif.isRead && notif.ticketId) markReadByTicketId(notif.ticketId);
    if (notif.ticketId) {
      onClose();
      navigate({ to: "/tickets/$id", params: { id: notif.ticketId } });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: "var(--s1)",
            border: "1px solid",
            borderColor: "divider",
            outline: "none",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "580px",
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: "18px",
          pt: "16px",
          pb: "14px",
          borderBottom: "1px solid var(--border)",
          background:
            "linear-gradient(135deg, var(--accent-subtle) 0%, var(--s2) 60%)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Box
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text)",
              }}
            >
              {t("notifications.title")}
            </Box>
            {unreadFiltered > 0 && (
              <Box
                sx={{
                  px: "6px",
                  py: "1px",
                  borderRadius: "20px",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 700,
                  lineHeight: 1.6,
                  letterSpacing: "0.02em",
                }}
              >
                {unreadFiltered}
              </Box>
            )}
          </Box>
          {unreadCount > 0 && (
            <Box sx={{ fontSize: "10.5px", color: "var(--muted)", mt: "1px" }}>
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {unreadCount > 0 && (
            <Tooltip
              title={t("notifications.mark_all_read")}
              placement="top"
              arrow
            >
              <Box
                component="button"
                onClick={() => markAllRead(undefined)}
                sx={{
                  all: "unset",
                  cursor: "pointer",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--r)",
                  color: "var(--muted)",
                  transition: "color 0.12s, background 0.12s",
                  "&:hover": {
                    color: "var(--accent)",
                    background: "var(--accent-subtle)",
                  },
                }}
              >
                <CheckOutlined sx={{ fontSize: 15 }} />
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          px: "18px",
          py: "10px",
          display: "flex",
          gap: "2px",
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          background: "var(--s2)",
        }}
      >
        {FILTERS.map(({ key, labelKey }) => {
          const isActive = activeFilter === key;
          const count =
            key === "unread" ? items.filter((n) => !n.isRead).length : 0;
          return (
            <Box
              key={key}
              component="button"
              onClick={() => setActiveFilter(key)}
              sx={{
                all: "unset",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                px: "9px",
                py: "4px",
                borderRadius: "var(--r-sm)",
                fontSize: "11px",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--accent)" : "var(--muted)",
                background: isActive ? "var(--accent-subtle)" : "transparent",
                transition: "all 0.12s",
                "&:hover": !isActive
                  ? { color: "var(--text-secondary)", background: "var(--s3)" }
                  : {},
              }}
            >
              {t(labelKey)}
              {count > 0 && (
                <Box
                  component="span"
                  sx={{
                    fontSize: "9px",
                    fontWeight: 700,
                    px: "4px",
                    py: "1px",
                    borderRadius: "8px",
                    lineHeight: 1.4,
                    background: isActive
                      ? "color-mix(in srgb, var(--accent) 18%, transparent)"
                      : "var(--border)",
                    color: isActive ? "var(--accent)" : "var(--muted2)",
                    transition: "all 0.12s",
                  }}
                >
                  {count}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* List */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {filtered.length === 0 ? (
          <Box className="empty-state">
            <Box className="empty-state-title">{t("notifications.empty")}</Box>
            <Box className="empty-state-subtitle">
              {activeFilter === "unread"
                ? "Tout est à jour"
                : "Aucune notification"}
            </Box>
          </Box>
        ) : (
          filtered.map((notif, idx) => {
            const meta = TYPE_META[notif.type] ?? DEFAULT_META;
            const Icon = meta.icon;
            const isHovered = hoveredId === notif.id;
            const isLast = idx === filtered.length - 1;

            return (
              <Box
                key={notif.id}
                component={notif.ticketId ? "button" : "div"}
                onClick={() => notif.ticketId && handleClick(notif)}
                onMouseEnter={() => setHoveredId(notif.id)}
                onMouseLeave={() => setHoveredId(null)}
                sx={{
                  all: notif.ticketId ? "unset" : undefined,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  width: "100%",
                  boxSizing: "border-box",
                  px: "18px",
                  py: "13px",
                  cursor: notif.ticketId ? "pointer" : "default",
                  borderBottom: isLast ? "none" : "1px solid var(--border)",
                  background: notif.isRead
                    ? "transparent"
                    : "color-mix(in srgb, var(--accent) 4%, transparent)",
                  transition: "background 0.12s",
                  position: "relative",
                  "&:hover": notif.ticketId ? { background: "var(--s3)" } : {},
                }}
              >
                {/* Unread strip */}
                {!notif.isRead && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 3,
                      height: "50%",
                      borderRadius: "0 3px 3px 0",
                      background: "var(--accent)",
                    }}
                  />
                )}

                {/* Type icon */}
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "var(--r)",
                    background: meta.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    mt: "1px",
                  }}
                >
                  <Icon sx={{ fontSize: 15, color: meta.color }} />
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: "12.5px",
                        fontWeight: notif.isRead ? 400 : 600,
                        color: notif.isRead
                          ? "var(--text-secondary)"
                          : "var(--text)",
                        lineHeight: 1.45,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {t(notif.messageKey, notif.messageParams)}
                    </Box>
                    <Box
                      sx={{
                        fontSize: "10px",
                        color: "var(--muted)",
                        fontFamily: "var(--font-mono)",
                        flexShrink: 0,
                        mt: "1px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {timeAgo(notif.createdAt)}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      mt: "5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        px: "5px",
                        py: "1.5px",
                        borderRadius: "5px",
                        background: meta.bg,
                        fontSize: "9.5px",
                        fontWeight: 600,
                        color: meta.color,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        lineHeight: 1.4,
                      }}
                    >
                      {meta.label}
                    </Box>
                  </Box>
                </Box>

                {/* Chevron on hover */}
                {notif.ticketId && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      alignSelf: "center",
                      color: "var(--muted)",
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered
                        ? "translateX(0)"
                        : "translateX(-4px)",
                      transition: "opacity 0.15s, transform 0.15s",
                      flexShrink: 0,
                    }}
                  >
                    <ChevronRightOutlined sx={{ fontSize: 14 }} />
                  </Box>
                )}
              </Box>
            );
          })
        )}
      </Box>
    </Dialog>
  );
};
