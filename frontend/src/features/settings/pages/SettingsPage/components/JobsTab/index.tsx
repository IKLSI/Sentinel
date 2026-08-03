import type React from "react";
import { useCallback, useMemo } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import AutoModeOutlined from "@mui/icons-material/AutoModeOutlined";
import { RowActions } from "@/components/ui/common/RowActions";
import { SortableTh } from "@/components/ui/common/SortableTh";
import { useToast } from "@/hooks/useToast";
import { type useT, useI18n } from "@/contexts/I18nContext";
import { useTriggerTechHealthScanMutation } from "@/domains/jobs/mutations";
import { useRecurringJobsQuery } from "@/domains/jobs/queries";
import { JobState } from "@/enums";
import { useApiError } from "@/hooks/useApiError";
import { useLocalSort } from "@/hooks/useLocalSort";

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
  const apiError = useApiError();

  const jobsQuery = useRecurringJobsQuery();
  const jobs = jobsQuery.data ?? [];
  const loading = jobsQuery.isLoading;
  const triggerScan = useTriggerTechHealthScanMutation();
  const triggering = triggerScan.isPending;
  const [sort, toggleSort] = useLocalSort({ col: "col_job", dir: "asc" });

  const handleTrigger = () => {
    triggerScan.mutate(
      {},
      {
        onSuccess: () =>
          showToast(t("settings.jobs.trigger_success"), "success"),
        onError: (err) =>
          showToast(apiError(err, t("settings.jobs.trigger_error")), "error"),
      },
    );
  };

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
                  return (
                    <SortableTh
                      key={key}
                      width={width}
                      sortable={sortable}
                      active={sort?.col === key}
                      ascending={sort?.dir === "asc"}
                      onSort={() => toggleSort(key)}
                    >
                      {key === "actions" ? "" : t(`settings.jobs.${key}`)}
                    </SortableTh>
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
