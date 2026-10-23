import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CallMergeOutlined from "@mui/icons-material/CallMergeOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
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

const mergeRequestChipSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  height: 30,
  px: "10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 600,
  whiteSpace: "nowrap",
  textDecoration: "none",
  color: "var(--green)",
  background: "var(--green-subtle)",
  transition: "background 0.15s ease",
  "&:hover": {
    background: "color-mix(in srgb, var(--green) 22%, transparent)",
  },
};

const failedLabelSx = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--red)",
  whiteSpace: "nowrap",
};

const chipIconSx = { fontSize: 14 };

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

  const startLabel = failed
    ? t("tech_health.remediation.retry")
    : mergeRequestUrl
      ? t("tech_health.remediation.update_mr")
      : remediableVulnerabilities > 1
        ? t("tech_health.remediation.fix_all_plural", {
            count: remediableVulnerabilities,
          })
        : t("tech_health.remediation.fix_all_singular");

  return (
    <>
      {mergeRequestUrl && !inProgress && (
        <Box
          component="a"
          href={mergeRequestUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("tech_health.remediation.open_mr")}
          sx={mergeRequestChipSx}
        >
          <CallMergeOutlined sx={chipIconSx} />
          {t("tech_health.remediation.mr_opened")}
          <OpenInNewOutlined sx={chipIconSx} />
        </Box>
      )}

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
            {startLabel}
          </Button>
        </AppTooltip>
      )}
    </>
  );
};
