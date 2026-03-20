import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
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

const typeVariants: Record<NotificationType, "blue" | "red" | "orange" | "green" | "gray"> = {
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

const typeAccent: Record<"blue" | "red" | "orange" | "green" | "gray", string> = {
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
  const { notifications, markAsRead, loading } = useNotifications();
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


      <Box className="page-enter" sx={{ p: "36px 28px 24px", maxWidth: "800px" }}>
        {loading ? (
          <Box className="d-flex justify-content-center" sx={{ p: "60px" }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box className="text-center" sx={{ p: "60px", color: "var(--muted)", fontSize: "13px" }}>
            Aucune notification
          </Box>
        ) : (
          <Box className="d-flex flex-column gap-2">
            {notifications.map((notif) => {
              const variant = typeVariants[notif.type] ?? "gray";
              const accent = typeAccent[variant];
              const Icon = typeIconComponents[notif.type] ?? InfoOutlined;
              return (
                <Box
                  key={notif.id}
                  className="d-flex gap-3 align-items-start"
                  onClick={() => handleOpen(notif)}
                  sx={{
                    background: notif.isRead ? "var(--s1)" : "var(--accent-subtle)",
                    border: `1px solid ${notif.isRead ? "var(--border)" : "var(--accent-border)"}`,
                    borderLeft: `3px solid ${notif.isRead ? "var(--border)" : accent}`,
                    borderRadius: "var(--r)",
                    p: "12px 16px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    "&:hover": { background: "var(--s2)" },
                  }}
                >
                  <Box
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                      color: accent,
                    }}
                  >
                    <Icon sx={{ fontSize: 14 }} />
                  </Box>

                  <Box className="flex-grow-1 overflow-hidden">
                    <Box className="d-flex align-items-center gap-2 mb-1">
                      <Box component="span" className="text-truncate" sx={{ fontSize: "13px", fontWeight: 700 }}>
                        {notif.title}
                      </Box>
                      {!notif.isRead && (
                        <Box
                          className="flex-shrink-0 ms-auto"
                          sx={{ width: 6, height: 6, borderRadius: "50%", background: accent }}
                        />
                      )}
                    </Box>
                    <Box className="text-truncate mb-1" sx={{ fontSize: "12px", color: "var(--muted2)" }}>
                      {notif.message}
                    </Box>
                    <Box sx={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)" }}>
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

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
            const canNavigate = !!(entityKey && entityRoute[entityKey] && selected.entityId);
            const Icon = typeIconComponents[selected.type] ?? InfoOutlined;

            return (
              <Box>
                <Box sx={{ borderTop: `3px solid ${accent}`, p: "20px 20px 16px" }}>
                  <Box className="d-flex align-items-center gap-3">
                    <Box
                      className="d-flex align-items-center justify-content-center flex-shrink-0"
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "10px",
                        background: `color-mix(in srgb, ${accent} 14%, transparent)`,
                        color: accent,
                      }}
                    >
                      <Icon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box className="flex-grow-1 overflow-hidden">
                      <Box sx={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.3 }}>
                        {selected.title}
                      </Box>
                      {!selected.isRead && (
                        <Box
                          component="span"
                          className="d-block mt-1"
                          sx={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: accent, fontWeight: 700 }}
                        >
                          NON LUE
                        </Box>
                      )}
                    </Box>
                    <Box
                      component="button"
                      className="d-flex flex-shrink-0"
                      onClick={() => setSelected(null)}
                      sx={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", p: "2px" }}
                    >
                      <CloseOutlined sx={{ fontSize: 16 }} />
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ height: "1px", background: "var(--border)" }} />

                <Box sx={{ p: "20px" }}>
                  <Box component="p" className="mb-4" sx={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.75 }}>
                    {selected.message}
                  </Box>

                  <Box
                    className="d-flex justify-content-between align-items-center"
                    sx={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: "var(--r)", p: "12px 14px" }}
                  >
                    <Box className="d-flex flex-column gap-1">
                      <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text)", fontWeight: 600 }}>
                        {format(new Date(selected.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </Box>
                      <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)" }}>
                        {formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true, locale: fr })}
                      </Box>
                    </Box>
                    {canNavigate && (
                      <Box
                        component="button"
                        className="d-flex align-items-center gap-2"
                        onClick={handleNavigate}
                        sx={{
                          background: "var(--accent)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "var(--r)",
                          p: "7px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <OpenInNewOutlined sx={{ fontSize: 12 }} />
                        {navLabel[entityKey!] ?? "Voir"}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })()}
      </Dialog>
    </>
  );
};
