import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import AutoModeOutlined from "@mui/icons-material/AutoModeOutlined";
import { RowActions } from "@/components/RowActions";
import { useToast } from "@/hooks/useToast";
import { type useT, useI18n } from "@/i18n/I18nContext";
import {
  getRecurringJobs,
  triggerTechHealthScan,
  type RecurringJobStatus,
} from "@/features/settings/api/jobs";
import { JobState } from "@/types/enums";
import { extractApiError } from "@/utils/apiError";

const STATUS_COLORS: Partial<Record<JobState, { bg: string; color: string }>> =
  {
    [JobState.Succeeded]: {
      bg: "color-mix(in srgb, var(--green) 15%, transparent)",
      color: "var(--green)",
    },
    [JobState.Failed]: {
      bg: "color-mix(in srgb, var(--red) 15%, transparent)",
      color: "var(--red)",
    },
    [JobState.Processing]: {
      bg: "color-mix(in srgb, var(--accent) 15%, transparent)",
      color: "var(--accent)",
    },
    [JobState.Enqueued]: {
      bg: "color-mix(in srgb, var(--yellow) 15%, transparent)",
      color: "var(--yellow)",
    },
  };

function StatusBadge({
  state,
  t,
}: {
  state: string | null;
  t: ReturnType<typeof useT>;
}) {
  if (!state)
    return <Box sx={{ color: "var(--muted)", fontSize: "11px" }}>—</Box>;
  const key = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
  const colors = STATUS_COLORS[key as JobState] ?? {
    bg: "var(--s2)",
    color: "var(--muted)",
  };
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

function formatDate(
  iso: string | null,
  t: ReturnType<typeof useT>,
  locale: string,
): string {
  if (!iso) return t("settings.jobs.never");
  return new Date(iso).toLocaleString(locale, {
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
  px: "16px",
  whiteSpace: "nowrap",
};

export const JobsTab: React.FC = () => {
  const { showToast } = useToast();
  const { t, culture } = useI18n();

  const [jobs, setJobs] = useState<RecurringJobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [sort, setSort] = useState<{ col: string; dir: "asc" | "desc" } | null>(
    {
      col: "col_job",
      dir: "asc",
    },
  );

  const toggleSort = useCallback((col: string) => {
    setSort((s) => {
      if (s?.col !== col) return { col, dir: "asc" };
      if (s.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  }, []);

  const loadJobs = useCallback(
    async (signal?: AbortSignal) => {
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
    },
    [showToast, t],
  );

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await triggerTechHealthScan();
      showToast(t("settings.jobs.trigger_success"), "success");
      setTimeout(() => loadJobs(), 1500);
    } catch (err) {
      showToast(
        extractApiError(err, t("settings.jobs.trigger_error")),
        "error",
      );
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    void loadJobs(ctrl.signal);
    return () => ctrl.abort();
  }, [loadJobs]);

  const jobName = useCallback(
    (id: string) => {
      const key = `settings.jobs.job.${id}`;
      const val = t(key);
      return val === key ? id : val;
    },
    [t],
  );

  const sortedJobs = useMemo(() => {
    if (!sort) return jobs;
    const mul = sort.dir === "asc" ? 1 : -1;
    return jobs.slice().sort((a, b) => {
      switch (sort.col) {
        case "col_job":
          return mul * jobName(a.id).localeCompare(jobName(b.id));
        case "col_last_run":
          return (
            mul *
            ((a.lastExecution ? new Date(a.lastExecution).getTime() : 0) -
              (b.lastExecution ? new Date(b.lastExecution).getTime() : 0))
          );
        case "col_status":
          return (
            mul * (a.lastJobState ?? "").localeCompare(b.lastJobState ?? "")
          );
        case "col_next_run":
          return (
            mul *
            ((a.nextExecution ? new Date(a.nextExecution).getTime() : 0) -
              (b.nextExecution ? new Date(b.nextExecution).getTime() : 0))
          );
        default:
          return 0;
      }
    });
  }, [jobs, sort, jobName]);

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
      }}
    >
      {loading ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={20} />
        </Box>
      ) : jobs.length === 0 ? (
        <Box className="empty-state" sx={{ flex: 1, justifyContent: "center" }}>
          <AutoModeOutlined
            className="empty-state-icon"
            sx={{ fontSize: 40 }}
          />
          <Box className="empty-state-title">{t("settings.jobs.empty")}</Box>
          <Box className="empty-state-subtitle">
            {t("settings.jobs.empty_subtitle")}
          </Box>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <Box
            component="table"
            sx={{ width: "100%", borderCollapse: "collapse" }}
          >
            <Box component="thead">
              <Box component="tr">
                {[
                  { key: "col_job", width: "auto" },
                  { key: "col_last_run", width: "180px" },
                  { key: "col_status", width: "140px" },
                  { key: "col_next_run", width: "230px" },
                  { key: "actions", width: "48px" },
                ].map(({ key, width }) => {
                  const sortable = key !== "actions";
                  const isActive = sort?.col === key;
                  return (
                    <Box
                      component="th"
                      key={key}
                      onClick={() => sortable && toggleSort(key)}
                      sx={{
                        px: "16px",
                        py: "10px",
                        textAlign: "left",
                        width,
                        fontSize: "10px",
                        fontWeight: 700,
                        color: isActive ? "var(--accent)" : "var(--muted)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--s2)",
                        cursor: sortable ? "pointer" : "default",
                        userSelect: "none",
                        transition: "color 0.12s",
                        "&:hover": sortable
                          ? { color: "var(--text-secondary)" }
                          : {},
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        {key === "actions" ? "" : t(`settings.jobs.${key}`)}
                        {sortable && isActive && (
                          <Box
                            sx={{
                              fontSize: "12px",
                              color: "var(--accent)",
                              lineHeight: 1,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {sort?.dir === "asc" ? "↑" : "↓"}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
            <Box component="tbody">
              {sortedJobs.map((job) => (
                <Box
                  component="tr"
                  key={job.id}
                  sx={{
                    borderBottom: "1px solid var(--border)",
                    "&:last-child": { borderBottom: "none" },
                    "&:hover": { background: "var(--s2)" },
                    "&:hover .row-actions": { opacity: "1 !important" },
                    transition: "background 0.1s",
                  }}
                >
                  <Box
                    component="td"
                    sx={{ ...CELL_SX, color: "var(--text)", fontWeight: 500 }}
                  >
                    {jobName(job.id)}
                  </Box>
                  <Box component="td" sx={CELL_SX}>
                    {formatDate(job.lastExecution, t, culture)}
                  </Box>
                  <Box component="td" sx={CELL_SX}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <StatusBadge state={job.lastJobState} t={t} />
                      {job.error && (
                        <Tooltip title={job.error} placement="top" arrow>
                          <ErrorOutlineOutlined
                            sx={{
                              fontSize: 15,
                              color: "var(--red)",
                              cursor: "help",
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                  <Box component="td" sx={CELL_SX}>
                    {formatDate(job.nextExecution, t, culture)}
                  </Box>
                  <Box component="td" sx={{ ...CELL_SX, textAlign: "right" }}>
                    {job.id === "tech-health-scan" && (
                      <RowActions
                        actions={[
                          {
                            icon: triggering ? (
                              <CircularProgress size={12} />
                            ) : (
                              <PlayArrowOutlined sx={{ fontSize: 14 }} />
                            ),
                            label: t("settings.jobs.trigger"),
                            onClick: handleTrigger,
                            disabled: triggering,
                            color: "accent",
                          },
                        ]}
                      />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
