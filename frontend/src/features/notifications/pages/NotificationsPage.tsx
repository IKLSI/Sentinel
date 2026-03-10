import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../../../layouts/Topbar";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import { useNotifications } from "../hooks/useNotifications";
import { Notification, NotificationType } from "../../../types";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { SvgIconProps } from "@mui/material";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import TaskAltOutlined from "@mui/icons-material/TaskAltOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import ReceiptOutlined from "@mui/icons-material/ReceiptOutlined";
import PublishOutlined from "@mui/icons-material/PublishOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import AssignmentIndOutlined from "@mui/icons-material/AssignmentIndOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";

type IconComponent = React.FC<SvgIconProps>;

const typeIconComponents: Record<NotificationType, IconComponent> = {
  ticket_created: ConfirmationNumberOutlined,
  ticket_updated: TaskAltOutlined,
  ticket_assigned: AssignmentIndOutlined,
  ticket_status_changed: RefreshOutlined,
  sla_breach: AccessTimeOutlined,
  sla_warning: WarningAmberOutlined,
  vulnerability: GppBadOutlined,
  invoice: ReceiptOutlined,
  deployment: PublishOutlined,
  system: InfoOutlined,
};

const typeVariants: Record<
  NotificationType,
  "blue" | "red" | "orange" | "green" | "gray"
> = {
  ticket_created: "blue",
  ticket_updated: "blue",
  ticket_assigned: "blue",
  ticket_status_changed: "gray",
  sla_breach: "red",
  sla_warning: "orange",
  vulnerability: "red",
  invoice: "green",
  deployment: "orange",
  system: "gray",
};

const typeAccent: Record<"blue" | "red" | "orange" | "green" | "gray", string> =
  {
    red: "var(--red)",
    blue: "var(--accent)",
    green: "var(--green)",
    orange: "var(--orange)",
    gray: "var(--muted)",
  };


const entityRoute: Partial<Record<string, (id: string) => string>> = {
  ticket: (id) => `/tickets/${id}`,
  invoice: (id) => `/invoices/${id}`,
  techproject: (id) => `/tech-health/${id}`,
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead, markAsRead, loading } =
    useNotifications();
  const [selected, setSelected] = useState<Notification | null>(null);

  const handleOpen = (notif: Notification) => {
    if (!notif.isRead) markAsRead(notif.id);
    setSelected(notif);
  };

  const handleNavigate = () => {
    if (!selected?.entityType || !selected?.entityId) return;
    const routeFn = entityRoute[selected.entityType.toLowerCase()];
    if (!routeFn) return;
    setSelected(null);
    navigate(routeFn(selected.entityId));
  };

  const navLabel: Partial<Record<string, string>> = {
    ticket: "Voir le ticket",
    invoice: "Voir la facture",
    techproject: "Voir le projet",
  };

  return (
    <>
      <Topbar
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
            : undefined
        }
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none" }}
              onClick={markAllAsRead}
            >
              Tout marquer comme lu
            </Button>
          ) : undefined
        }
      />

      <div style={{ padding: "24px 28px", maxWidth: "800px" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "60px",
            }}
          >
            <CircularProgress size={24} />
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              color: "var(--muted)",
              fontSize: "13px",
            }}
          >
            Aucune notification
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {notifications.map((notif) => {
              const variant = typeVariants[notif.type] ?? "gray";
              const accent = typeAccent[variant];
              return (
                <div
                  key={notif.id}
                  onClick={() => handleOpen(notif)}
                  style={{
                    background: notif.isRead
                      ? "var(--s1)"
                      : "var(--accent-subtle)",
                    border: `1px solid ${notif.isRead ? "var(--border)" : "var(--accent-border)"}`,
                    borderLeft: `3px solid ${notif.isRead ? "var(--border)" : accent}`,
                    borderRadius: "var(--r)",
                    padding: "12px 16px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--s2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.isRead
                      ? "var(--s1)"
                      : "var(--accent-subtle)";
                  }}
                >
                  {(() => {
                    const Icon = typeIconComponents[notif.type] ?? InfoOutlined;
                    return (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: accent,
                          flexShrink: 0,
                        }}
                      >
                        <Icon sx={{ fontSize: 14 }} />
                      </div>
                    );
                  })()}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "3px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: accent,
                            marginLeft: "auto",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--muted2)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginBottom: "4px",
                      }}
                    >
                      {notif.message}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--muted)",
                      }}
                    >
                      {formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "8px",
            overflow: "hidden",
          },
        }}
      >
        {selected &&
          (() => {
            const variant = typeVariants[selected.type] ?? "gray";
            const accent = typeAccent[variant];
            const entityKey = selected.entityType?.toLowerCase();
            const canNavigate = !!(
              entityKey &&
              entityRoute[entityKey] &&
              selected.entityId
            );

            return (
              <div>
                <div
                  style={{
                    borderTop: `3px solid ${accent}`,
                    padding: "20px 20px 16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {(() => {
                      const Icon = typeIconComponents[selected.type] ?? InfoOutlined;
                      return (
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            flexShrink: 0,
                            background: `color-mix(in srgb, ${accent} 14%, transparent)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: accent,
                          }}
                        >
                          <Icon sx={{ fontSize: 18 }} />
                        </div>
                      );
                    })()}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          lineHeight: 1.3,
                        }}
                      >
                        {selected.title}
                      </div>
                      {!selected.isRead && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontFamily: "var(--font-mono)",
                            color: accent,
                            fontWeight: 700,
                            display: "block",
                            marginTop: "3px",
                          }}
                        >
                          NON LUE
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--muted)",
                        padding: "2px",
                        display: "flex",
                        flexShrink: 0,
                      }}
                    >
                      <CloseOutlined sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                </div>

                <div style={{ height: "1px", background: "var(--border)" }} />

                <div style={{ padding: "20px" }}>
                  <p
                    style={{
                      margin: "0 0 20px",
                      fontSize: "14px",
                      color: "var(--text)",
                      lineHeight: 1.75,
                    }}
                  >
                    {selected.message}
                  </p>

                  <div
                    style={{
                      background: "var(--s2)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r)",
                      padding: "12px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--text)",
                          fontWeight: 600,
                        }}
                      >
                        {format(
                          new Date(selected.createdAt),
                          "dd MMMM yyyy 'à' HH:mm",
                          { locale: fr },
                        )}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          color: "var(--muted)",
                        }}
                      >
                        {formatDistanceToNow(new Date(selected.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                    {canNavigate && (
                      <button
                        onClick={handleNavigate}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "var(--accent)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "var(--r)",
                          padding: "7px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <OpenInNewOutlined sx={{ fontSize: 12 }} />
                        {navLabel[entityKey!] ?? "Voir"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
      </Dialog>
    </>
  );
};
