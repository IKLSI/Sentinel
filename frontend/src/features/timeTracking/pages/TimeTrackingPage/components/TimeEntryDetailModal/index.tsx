import React from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useT } from "@/i18n/I18nContext";
import { TimeEntryDto } from "@/features/timeTracking/api/timeEntries";
import {
  formatDuration,
  getProjectColor,
  parseDateLocal,
} from "../../helpers";

interface Props {
  open: boolean;
  onClose: () => void;
  entry: TimeEntryDto | null;
  isAdmin: boolean;
  currentUserId?: string;
}

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ fontSize: "9px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.04em", mb: "5px" }}>
    {children}
  </Box>
);

export const TimeEntryDetailModal: React.FC<Props> = ({ open, onClose, entry, isAdmin, currentUserId }) => {
  const t = useT();
  if (!entry) return null;

  const projColor = entry.projectName ? getProjectColor(entry.projectName) : "var(--accent)";
  const parsedDate = parseDateLocal(entry.date);
  const isOwn = entry.userId === currentUserId;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: 'var(--r-lg)',
            overflow: "hidden",
            boxShadow: "0 20px 56px rgba(0,0,0,.3)",
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: "18px", py: "13px", borderBottom: "1px solid var(--border)", background: "var(--s2)" }}>
        <Box sx={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.09em", textTransform: "uppercase" }}>
          {t("time_tracking.modal_detail_title")}
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ width: 24, height: 24, color: "var(--muted)", "&:hover": { color: "var(--text)", background: "var(--s3)" } }}>
          <CloseOutlined sx={{ fontSize: 13 }} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ px: "20px", pt: "18px", pb: "18px" }}>

        {/* Titre */}
        <Box sx={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.025em", lineHeight: 1.35, mb: "18px" }}>
          {entry.title ?? "—"}
        </Box>

        {/* Stats */}
        <Box sx={{ display: "grid", gridTemplateColumns: isAdmin ? "1fr 1fr 1fr" : "1fr 1fr", gap: "16px", mb: "18px" }}>
          <Box>
            <FieldLabel>{t("time_tracking.field_duration")}</FieldLabel>
            <Box sx={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: projColor, letterSpacing: "-0.01em", lineHeight: 1 }}>
              {formatDuration(entry.durationMinutes)}
            </Box>
          </Box>

          <Box>
            <FieldLabel>{t("time_tracking.field_date")}</FieldLabel>
            <Box sx={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", textTransform: "capitalize", lineHeight: 1 }}>
              {format(parsedDate, "d MMMM yyyy", { locale: fr })}
            </Box>
          </Box>

          {isAdmin && (
            <Box>
              <FieldLabel>{t("time_tracking.field_author")}</FieldLabel>
              <Box sx={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", lineHeight: 1 }}>
                {isOwn ? t("time_tracking.you") : entry.userName}
              </Box>
            </Box>
          )}
        </Box>

        {/* Séparateur */}
        <Box sx={{ borderTop: "1px solid var(--border)", mb: "14px" }} />

        {/* Description */}
        {entry.description ? (
          <Box sx={{ fontSize: "12px", color: "var(--muted2)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
            {entry.description}
          </Box>
        ) : (
          <Box sx={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic" }}>
            {t("time_tracking.detail_no_description")}
          </Box>
        )}
      </Box>

      {/* Footer badges */}
      {(entry.projectName || entry.ticketTitle) && (
        <>
          <Box sx={{ borderTop: "1px solid var(--border)" }} />
          <Box sx={{ px: "20px", py: "11px", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", background: "var(--s2)" }}>
            {entry.projectName && (
              <Box component="span" sx={{ fontSize: "10px", fontWeight: 600, color: "var(--muted2)", px: "5px", py: "1px", borderRadius: 'var(--r-xs)', border: "1px solid var(--border2)", background: "var(--s3)" }}>
                {entry.projectName}
              </Box>
            )}
            {entry.ticketTitle && (
              <Box sx={{ fontSize: "10px", fontWeight: 600, px: "5px", py: "1px", borderRadius: 'var(--r-xs)', background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}>
                {entry.ticketTitle}
              </Box>
            )}
          </Box>
        </>
      )}
    </Dialog>
  );
};
