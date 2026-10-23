import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";
import CallMergeOutlined from "@mui/icons-material/CallMergeOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useT } from "@/contexts/I18nContext";
import { useStartRemediationMutation } from "@/domains/projects/mutations";
import type { Remediation } from "@/domains/projects/types";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useToast } from "@/hooks/useToast";

const IN_PROGRESS_STATUSES = new Set<Remediation["status"]>([
  "Queued",
  "Running",
]);

const tooltipLinesSx = {
  display: "flex",
  flexDirection: "column",
  gap: "3px",
} as const;

const iconSx = { fontSize: 14 };

interface Props {
  projectId: string;
  remediationAvailable: boolean;
  remediableVulnerabilities: number;
  includesMajorUpgrade: boolean;
  remediation: Remediation | null;
}

export const RemediateAllAction: React.FC<Props> = ({
  projectId,
  remediationAvailable,
  remediableVulnerabilities,
  includesMajorUpgrade,
  remediation,
}) => {
  const t = useT();
  const { showToast } = useToast();
  const startMutation = useStartRemediationMutation();
  const onStartError = useApiErrorToast("tech_health.remediation.error");

  const inProgress =
    startMutation.isPending ||
    (remediation != null && IN_PROGRESS_STATUSES.has(remediation.status));
  const failed = remediation?.status === "Failed";
  const mergeRequestUrl =
    remediation?.status === "Opened" ? remediation.mergeRequestUrl : null;
  const canStart = remediationAvailable && remediableVulnerabilities > 0;

  const handleStart = () =>
    startMutation.mutate(
      { id: projectId },
      {
        onSuccess: () =>
          showToast(t("tech_health.remediation.started"), "success"),
        onError: onStartError,
      },
    );

  return (
    <>
      {mergeRequestUrl && (
        <Button
          variant="contained"
          color="secondary"
          size="small"
          component="a"
          href={mergeRequestUrl}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<CallMergeOutlined sx={iconSx} />}
        >
          {t("tech_health.remediation.open_mr")}
        </Button>
      )}

      {inProgress && (
        <Button
          variant="contained"
          color="secondary"
          size="small"
          disabled
          startIcon={
            <CircularProgress size={13} thickness={5} color="inherit" />
          }
        >
          {t("tech_health.remediation.in_progress")}
        </Button>
      )}

      {!inProgress && canStart && (
        <AppTooltip
          title={
            <Box sx={tooltipLinesSx}>
              {failed && <span>{t("tech_health.remediation.failed")}</span>}
              {failed && remediation?.failureCode && (
                <span>{t(remediation.failureCode)}</span>
              )}
              <span>
                {t("tech_health.remediation.fix_all_hint", {
                  count: remediableVulnerabilities,
                })}
              </span>
              {includesMajorUpgrade && (
                <span>{t("tech_health.remediation.major_warning")}</span>
              )}
            </Box>
          }
        >
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleStart}
            startIcon={<AutoFixHighOutlined sx={iconSx} />}
          >
            {t(
              failed
                ? "tech_health.remediation.retry"
                : "tech_health.remediation.fix_all",
            )}
          </Button>
        </AppTooltip>
      )}
    </>
  );
};
