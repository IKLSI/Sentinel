import type React from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import AutoModeOutlined from "@mui/icons-material/AutoModeOutlined";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { LoadingRegion } from "@/components/ui/common/feedback/LoadingRegion";
import { titleWidthAt } from "@/components/ui/common/feedback/skeletonShapes";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import { useTriggerTechHealthScanMutation } from "@/domains/jobs/mutations";
import { useRecurringJobsQuery } from "@/domains/jobs/queries";
import { JobCard } from "@/features/settings/pages/SettingsPage/components/JobsTab/components/JobCard";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import {
  JOBS_GRID_SX,
  JOB_CARD_SX,
  JOB_SCHEDULE_SLOT_SX,
  JOB_SCHEDULE_SX,
} from "@/features/settings/pages/SettingsPage/constants";
import { PANEL_SX } from "@/helpers/cardSx";

const TECH_HEALTH_SCAN_JOB_ID = "tech-health-scan";
const SKELETON_CARDS = [0, 1, 2];
const SKELETON_SCHEDULE = ["last", "next"];

export const JobsTab: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();
  const onTriggerError = useApiErrorToast("settings.jobs.trigger_error");

  const jobsQuery = useRecurringJobsQuery();
  const jobs = jobsQuery.data ?? [];
  const loading = jobsQuery.isLoading;
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

  const jobName = (id: string) => {
    const key = `settings.jobs.job.${id}`;
    const val = t(key);
    return val === key ? id : val;
  };

  if (loading)
    return (
      <LoadingRegion label={t("settings.jobs.loading")}>
        <Box sx={JOBS_GRID_SX}>
          {SKELETON_CARDS.map((position) => (
            <Box key={position} sx={JOB_CARD_SX}>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "10px" }}
              >
                <Skeleton
                  variant="rounded"
                  width={titleWidthAt(position)}
                  height={16}
                />
                <Skeleton
                  variant="rounded"
                  width={72}
                  height={20}
                  sx={{ borderRadius: "999px" }}
                />
              </Box>
              <Box sx={JOB_SCHEDULE_SX}>
                {SKELETON_SCHEDULE.map((slot) => (
                  <Box
                    key={slot}
                    sx={{
                      ...JOB_SCHEDULE_SLOT_SX,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Skeleton variant="rounded" width={64} height={10} />
                    <Skeleton variant="rounded" width={96} height={13} />
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </LoadingRegion>
    );

  if (jobs.length === 0)
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          ...PANEL_SX,
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
      <Box sx={JOBS_GRID_SX}>
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
