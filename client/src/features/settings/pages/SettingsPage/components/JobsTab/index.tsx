import type React from "react";
import { useCallback } from "react";
import Box from "@mui/material/Box";
import AutoModeOutlined from "@mui/icons-material/AutoModeOutlined";
import { ListSkeleton } from "@/components/ui/common/ListSkeleton";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import { useTriggerTechHealthScanMutation } from "@/domains/jobs/mutations";
import { useRecurringJobsQuery } from "@/domains/jobs/queries";
import { JobCard } from "@/features/settings/pages/SettingsPage/components/JobCard";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";

const TECH_HEALTH_SCAN_JOB_ID = "tech-health-scan";

export const JobsTab: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();
  const onTriggerError = useApiErrorToast("settings.jobs.trigger_error");

  const jobsQuery = useRecurringJobsQuery();
  const jobs = jobsQuery.data ?? [];
  const loading = jobsQuery.isLoading && !jobsQuery.data;
  const triggerScan = useTriggerTechHealthScanMutation();

  const handleTrigger = () => {
    triggerScan.mutate(
      {},
      {
        onSuccess: () =>
          showToast(t("settings.jobs.trigger_success"), "success"),
        onError: onTriggerError,
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

  if (loading) return <ListSkeleton />;

  if (jobs.length === 0)
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          background: "var(--s1)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
        }}
      >
        <EmptyState
          icon={AutoModeOutlined}
          title={t("settings.jobs.empty")}
          subtitle={t("settings.jobs.empty_subtitle")}
          iconSize={40}
          sx={{ flex: 1, justifyContent: "center" }}
        />
      </Box>
    );

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        opacity: jobsQuery.isFetching ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        {jobs.map((job) => {
          const triggerable = job.id === TECH_HEALTH_SCAN_JOB_ID;
          return (
            <JobCard
              key={job.id}
              job={job}
              name={jobName(job.id)}
              onTrigger={handleTrigger}
              canTrigger={triggerable}
              triggering={triggerable && triggerScan.isPending}
            />
          );
        })}
      </Box>
    </Box>
  );
};
