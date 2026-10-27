import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { StatusChip } from "@/components/ui/common/StatusChip";
import { type Translate, useI18n } from "@/contexts/I18nContext";
import type { RecurringJobStatus } from "@/domains/jobs/types";
import { JobState } from "@/enums";
import { formatDateTime } from "@/formatters/date";
import {
  JOB_CARD_SX,
  JOB_SCHEDULE_SLOT_SX,
  JOB_SCHEDULE_SX,
} from "@/features/settings/pages/SettingsPage/constants";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";

interface Props {
  job: RecurringJobStatus;
  name: string;
  onTrigger: () => void;
  canTrigger: boolean;
  triggering?: boolean;
}

const STATUS_VARIANTS: Partial<
  Record<JobState, "green" | "red" | "blue" | "yellow">
> = {
  [JobState.Succeeded]: "green",
  [JobState.Failed]: "red",
  [JobState.Processing]: "blue",
  [JobState.Enqueued]: "yellow",
};

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const jobStatusVariant = (state: string | null | undefined) =>
  (state && STATUS_VARIANTS[capitalize(state) as JobState]) || "gray";

const jobStatusLabel = (t: Translate, state: string | null | undefined) => {
  const labelKey = state
    ? `settings.jobs.status.${state.toLowerCase()}`
    : "settings.jobs.status.never_run";
  const translated = t(labelKey);
  return translated === labelKey ? (state ?? "") : translated;
};

export const JobCard: React.FC<Props> = ({
  job,
  name,
  onTrigger,
  canTrigger,
  triggering = false,
}) => {
  const { t, culture } = useI18n();

  const statusVariant = jobStatusVariant(job.lastJobState);
  const statusLabel = jobStatusLabel(t, job.lastJobState);

  const schedule = [
    { label: t("settings.jobs.col_last_run"), value: job.lastExecution },
    { label: t("settings.jobs.col_next_run"), value: job.nextExecution },
  ];

  return (
    <Box sx={{ ...JOB_CARD_SX, boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)" }}>
      <Box>
        <Box
          sx={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
            mb: "8px",
          }}
        >
          {name}
        </Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <Box sx={{ flexShrink: 0 }}>
            <StatusChip variant={statusVariant}>{statusLabel}</StatusChip>
          </Box>
          {job.error && (
            <AppTooltip title={job.error}>
              <Box
                sx={{
                  fontSize: "12px",
                  lineHeight: 1.5,
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  wordBreak: "break-word",
                  cursor: "help",
                }}
              >
                {job.error}
              </Box>
            </AppTooltip>
          )}
        </Box>
      </Box>

      <Box sx={JOB_SCHEDULE_SX}>
        {schedule.map(({ label, value }) => (
          <Box
            key={label}
            sx={{
              ...JOB_SCHEDULE_SLOT_SX,
              textAlign: "center",
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--accent)",
                letterSpacing: "0.01em",
                mb: "4px",
              }}
            >
              {label}
            </Box>
            <Box
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                color: value ? "var(--text)" : "var(--muted)",
                fontVariantNumeric: "tabular-nums",
                ...TEXT_ELLIPSIS_SX,
              }}
            >
              {value ? formatDateTime(value, culture) : "—"}
            </Box>
          </Box>
        ))}
      </Box>

      <Button
        variant="contained"
        fullWidth
        onClick={onTrigger}
        disabled={!canTrigger || triggering}
        startIcon={
          triggering ? (
            <CircularProgress size={12} sx={{ color: "inherit" }} />
          ) : (
            <PlayArrowOutlined sx={{ fontSize: 17 }} />
          )
        }
        sx={{ mt: "auto", height: "38px" }}
      >
        {t("settings.jobs.trigger")}
      </Button>
    </Box>
  );
};
