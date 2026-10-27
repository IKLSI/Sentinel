import type React from "react";
import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
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

const useMergeRequestOpenedToast = (
  status: Remediation["status"] | undefined,
  mergeRequestUrl: string | null,
) => {
  const t = useT();
  const { showToast } = useToast();
  const previousStatus = useRef(status);

  useEffect(() => {
    const wasInProgress =
      previousStatus.current != null &&
      IN_PROGRESS_STATUSES.has(previousStatus.current);
    previousStatus.current = status;
    if (!wasInProgress || !mergeRequestUrl) return;
    showToast(t("tech_health.remediation.opened"), "success", {
      label: t("common.view"),
      onClick: () =>
        window.open(mergeRequestUrl, "_blank", "noopener,noreferrer"),
    });
  }, [status, mergeRequestUrl, showToast, t]);
};

const tooltipLinesSx = {
  display: "flex",
  flexDirection: "column",
  gap: "3px",
} as const;

const failedLabelSx = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--red)",
  whiteSpace: "nowrap",
};

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
  const mergeRequestOpened =
    remediation?.status === "Opened" && remediation.mergeRequestUrl != null;
  const mergeRequestUrl = mergeRequestOpened
    ? remediation.mergeRequestUrl
    : null;
  useMergeRequestOpenedToast(remediation?.status, mergeRequestUrl);

  const canStart =
    remediationAvailable && remediableVulnerabilities > 0 && !inProgress;

  const handleStart = () =>
    startMutation.mutate(
      { id: projectId },
      {
        onSuccess: () =>
          showToast(t("tech_health.remediation.started"), "success"),
        onError: onStartError,
      },
    );

  const startLabel = () => {
    if (failed) return t("tech_health.remediation.retry");
    if (mergeRequestOpened) return t("tech_health.remediation.update_mr");
    return remediableVulnerabilities > 1
      ? t("tech_health.remediation.fix_all_plural", {
          count: remediableVulnerabilities,
        })
      : t("tech_health.remediation.fix_all_singular");
  };

  return (
    <>
      {inProgress && (
        <Button
          variant="contained"
          size="small"
          disabled
          startIcon={
            <CircularProgress size={13} thickness={5} color="inherit" />
          }
        >
          {t("tech_health.remediation.in_progress")}
        </Button>
      )}

      {canStart && failed && (
        <AppTooltip
          title={t(
            remediation?.failureCode ?? "tech_health.remediation.failed",
          )}
        >
          <Box component="span" sx={failedLabelSx}>
            {t("tech_health.remediation.failed")}
          </Box>
        </AppTooltip>
      )}

      {canStart && (
        <AppTooltip
          title={
            <Box sx={tooltipLinesSx}>
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
          >
            {startLabel()}
          </Button>
        </AppTooltip>
      )}
    </>
  );
};
