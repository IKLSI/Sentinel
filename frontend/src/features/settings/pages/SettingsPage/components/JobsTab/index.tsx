import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import { RowActions } from "@/components/RowActions";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import { getRecurringJobs, triggerTechHealthScan, RecurringJobStatus } from "@/features/settings/api/jobs";
import { extractApiError } from "@/utils/apiError";
import { CARD_SX } from "../../helpers";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Succeeded: { bg: "color-mix(in srgb, var(--success, #22c55e) 15%, transparent)", color: "var(--success, #22c55e)" },
  Failed: { bg: "color-mix(in srgb, #ef4444 15%, transparent)", color: "#ef4444" },
  Processing: { bg: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" },
  Enqueued: { bg: "color-mix(in srgb, #f59e0b 15%, transparent)", color: "#f59e0b" },
};

function StatusBadge({ state, t }: { state: string | null; t: ReturnType<typeof useT> }) {
  if (!state) return <Box sx={{ color: "var(--muted)", fontSize: "11px" }}>—</Box>;
  const key = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
  const colors = STATUS_COLORS[key] ?? { bg: "var(--s2)", color: "var(--muted)" };
  const labelKey = `settings.jobs.status.${state.toLowerCase()}`;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: "8px",
        height: "20px",
        borderRadius: "10px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.03em",
        background: colors.bg,
        color: colors.color,
      }}
    >
      {t(labelKey) === labelKey ? state : t(labelKey)}
    </Box>
  );
}

function formatDate(iso: string | null, t: ReturnType<typeof useT>): string {
  if (!iso) return t("settings.jobs.never");
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CELL_SX = {
  fontSize: "12px",
  color: "var(--text-secondary)",
  py: "10px",
  px: "12px",
  borderTop: "1px solid var(--border)",
};

export const JobsTab: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();

  const [jobs, setJobs] = useState<RecurringJobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const loadJobs = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const data = await getRecurringJobs(signal);
      if (signal?.aborted) return;
      setJobs(data);
    } catch (err) {
      if (signal?.aborted) return;
      showToast(extractApiError(err, t("settings.jobs.load_error")), "error");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [showToast, t]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await triggerTechHealthScan();
      showToast(t("settings.jobs.trigger_success"), "success");
      setTimeout(() => loadJobs(), 1500);
    } catch (err) {
      showToast(extractApiError(err, t("settings.jobs.trigger_error")), "error");
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    void loadJobs(ctrl.signal);
    return () => ctrl.abort();
  }, [loadJobs]);

  const jobName = (id: string) => {
    const key = `settings.jobs.job.${id}`;
    const val = t(key);
    return val === key ? id : val;
  };

  return (
    <Box sx={{ overflow: "auto", flex: 1, pr: "4px" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "16px", pb: "8px" }}>
        <Box sx={CARD_SX}>
          <Box
            sx={{
              px: "16px",
              minHeight: "40px",
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid var(--border)",
              background: "var(--s2)",
            }}
          >
            <Box sx={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {t("settings.jobs.title")}
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ p: "32px", display: "flex", justifyContent: "center" }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
              <Box component="tbody">
                {jobs.map((job) => (
                  <Box component="tr" key={job.id} sx={{ "&:hover td": { background: "var(--s2)" }, "&:hover .row-actions": { opacity: "1 !important" } }}>
                    <Box component="td" sx={{ ...CELL_SX, color: "var(--text)", fontWeight: 500 }}>
                      {jobName(job.id)}
                    </Box>
                    <Box component="td" sx={{ ...CELL_SX, fontFamily: "monospace", fontSize: "11px" }}>
                      {job.cron}
                    </Box>
                    <Box component="td" sx={CELL_SX}>
                      {formatDate(job.lastExecution, t)}
                    </Box>
                    <Box component="td" sx={CELL_SX}>
                      <StatusBadge state={job.lastJobState} t={t} />
                    </Box>
                    <Box component="td" sx={CELL_SX}>
                      {formatDate(job.nextExecution, t)}
                    </Box>
                    <Box component="td" sx={{ ...CELL_SX, pl: "32px" }}>
                      {job.id === "tech-health-scan" && (
                        <RowActions
                          actions={[{
                            icon: triggering ? <CircularProgress size={12} /> : <PlayArrowOutlined sx={{ fontSize: 14 }} />,
                            label: t("settings.jobs.trigger"),
                            onClick: handleTrigger,
                            disabled: triggering,
                            color: "accent",
                          }]}
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};
