import React, { useState, useEffect } from "react";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useT } from "@/i18n/I18nContext";
import { DurationPicker } from "@/components/DurationPicker";
import { TimeEntryDto } from "@/features/timeTracking/api/timeEntries";

interface Props {
  anchor: HTMLElement | null;
  onClose: () => void;
  entries: TimeEntryDto[];
  onSave: (minutes: number) => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
}

export const CellPopover: React.FC<Props> = ({
  anchor,
  onClose,
  entries,
  onSave,
  onDelete,
  saving,
  deleting,
}) => {
  const t = useT();
  const isEditing = entries.length > 0;
  const existingMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0);

  const [minutes, setMinutes] = useState(existingMinutes);

  useEffect(() => {
    setMinutes(entries.reduce((s, e) => s + e.durationMinutes, 0));
  }, [entries]);

  return (
    <Popover
      open={!!anchor}
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      slotProps={{
        paper: {
          sx: {
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
            p: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            minWidth: "180px",
          },
        },
      }}
    >
      <Box
        sx={{
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {t("time_tracking.field_duration")}
      </Box>
      <DurationPicker
        value={minutes}
        onChange={setMinutes}
        placeholder={t("time_tracking.duration_help")}
        width="100%"
      />
      <Box sx={{ display: "flex", gap: "6px" }}>
        {isEditing && (
          <Button
            size="small"
            variant="contained"
            disabled={deleting || saving}
            onClick={onDelete}
            sx={{
              textTransform: "none",
              fontSize: "12px",
              fontWeight: 600,
              background: "var(--red-subtle)",
              color: "var(--red)",
              boxShadow: "none",
              border: "1px solid transparent",
              minWidth: 0,
              px: "10px",
              "&:hover": {
                background: "var(--red)",
                color: "#fff",
                boxShadow: "none",
              },
            }}
          >
            {deleting ? (
              <CircularProgress size={12} sx={{ color: "var(--red)" }} />
            ) : (
              t("time_tracking.action_delete")
            )}
          </Button>
        )}
        <Button
          size="small"
          variant="contained"
          disabled={saving || deleting || minutes <= 0}
          onClick={() => onSave(minutes)}
          sx={{
            flex: 1,
            textTransform: "none",
            fontSize: "12px",
            fontWeight: 600,
            background:
              "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)",
            boxShadow: "none",
            "&:hover": {
              background:
                "color-mix(in srgb, var(--accent) 85%, black)",
              boxShadow: "none",
            },
          }}
        >
          {saving ? (
            <CircularProgress size={12} sx={{ color: "var(--s1)" }} />
          ) : (
            t("time_tracking.timesheet_cell_save")
          )}
        </Button>
      </Box>
    </Popover>
  );
};
