import { memo } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";
import CallMergeOutlined from "@mui/icons-material/CallMergeOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useT } from "@/contexts/I18nContext";
import type { Remediation } from "@/domains/projects/types";
import { useFindingActions } from "@/features/techHealth/pages/ProjectDetailPage/findingActions";

const ICON_SIZE = 15;
const SPINNER_SIZE = 12;
const IN_PROGRESS_STATUSES = new Set<Remediation["status"]>([
  "Queued",
  "Running",
]);

const tooltipLinesSx = {
  display: "flex",
  flexDirection: "column",
  gap: "3px",
} as const;

const mergeRequestIconSx = { fontSize: ICON_SIZE, color: "var(--green)" };

const fixIconSx = (isMajorUpgrade: boolean, failed: boolean) => ({
  fontSize: ICON_SIZE,
  color: failed
    ? "var(--red)"
    : isMajorUpgrade
      ? "var(--orange)"
      : "var(--accent)",
});

interface Props {
  findingKey: string;
  canRemediate: boolean;
  isMajorUpgrade: boolean;
  remediation?: Remediation | null;
}

export const RemediationCell = memo<Props>(
  ({ findingKey, canRemediate, isMajorUpgrade, remediation }) => {
    const t = useT();
    const { remediationAvailable, startRemediation, startingRemediationKey } =
      useFindingActions();

    if (remediation?.status === "Opened" && remediation.mergeRequestUrl) {
      return (
        <AppTooltip title={t("tech_health.remediation.open_mr")}>
          <IconButton
            size="small"
            component="a"
            href={remediation.mergeRequestUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("tech_health.remediation.open_mr")}
          >
            <CallMergeOutlined sx={mergeRequestIconSx} />
          </IconButton>
        </AppTooltip>
      );
    }

    if (
      startingRemediationKey === findingKey ||
      (remediation && IN_PROGRESS_STATUSES.has(remediation.status))
    ) {
      return (
        <AppTooltip title={t("tech_health.remediation.in_progress")}>
          <Box
            component="span"
            role="status"
            aria-label={t("tech_health.remediation.in_progress")}
            sx={{ display: "inline-flex", p: "5px" }}
          >
            <CircularProgress size={SPINNER_SIZE} />
          </Box>
        </AppTooltip>
      );
    }

    if (!remediationAvailable || !canRemediate) return null;

    const failed = remediation?.status === "Failed";
    const label = t(
      failed
        ? "tech_health.remediation.retry"
        : isMajorUpgrade
          ? "tech_health.remediation.fix_major"
          : "tech_health.remediation.fix",
    );

    return (
      <AppTooltip
        title={
          <Box sx={tooltipLinesSx}>
            {failed && <span>{t("tech_health.remediation.failed")}</span>}
            {failed && remediation?.failureCode && (
              <span>{t(remediation.failureCode)}</span>
            )}
            <span>{label}</span>
          </Box>
        }
      >
        <IconButton
          size="small"
          aria-label={label}
          onClick={() => startRemediation(findingKey)}
        >
          <AutoFixHighOutlined sx={fixIconSx(isMajorUpgrade, failed)} />
        </IconButton>
      </AppTooltip>
    );
  },
);
RemediationCell.displayName = "RemediationCell";
