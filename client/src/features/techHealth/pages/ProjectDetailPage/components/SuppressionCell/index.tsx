import { memo, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useI18n } from "@/contexts/I18nContext";
import { useRemoveSuppressionMutation } from "@/domains/projects/mutations";
import type { VulnerabilitySuppression } from "@/domains/projects/types";
import { formatDate } from "@/formatters/date";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { SuppressionModal } from "@/features/techHealth/pages/ProjectDetailPage/components/SuppressionModal";

const NO_VALUE = "—";

const badgeSx = {
  display: "inline-flex",
  alignItems: "center",
  px: "7px",
  py: "2px",
  borderRadius: "var(--r-xs)",
  fontSize: "10px",
  fontWeight: 600,
  color: "var(--text-secondary)",
  background: "var(--s3)",
  border: "1px solid var(--border)",
} as const;

interface Props {
  projectId: string;
  findingKey: string;
  vulnerabilityLabel: string;
  suppression?: VulnerabilitySuppression | null;
}

export const SuppressionCell = memo<Props>(
  ({ projectId, findingKey, vulnerabilityLabel, suppression }) => {
    const { t, culture } = useI18n();
    const isAdmin = useIsAdmin();
    const [modalOpen, setModalOpen] = useState(false);
    const removeMutation = useRemoveSuppressionMutation();
    const onRemoveError = useApiErrorToast("tech_health.suppression.error");

    if (suppression) {
      const details = [
        t(`tech_health.suppression.reason.${suppression.reason}`),
        suppression.justification,
        suppression.expiresAt
          ? t("tech_health.suppression.until", {
              date: formatDate(suppression.expiresAt, culture),
            })
          : null,
      ].filter(Boolean);

      return (
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <AppTooltip
            title={
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "3px" }}
              >
                {details.map((line) => (
                  <span key={String(line)}>{line}</span>
                ))}
              </Box>
            }
          >
            <Box component="span" sx={badgeSx}>
              {t("tech_health.suppression.badge")}
            </Box>
          </AppTooltip>
          {isAdmin && (
            <AppTooltip title={t("tech_health.suppression.reactivate")}>
              <IconButton
                size="small"
                aria-label={t("tech_health.suppression.reactivate")}
                disabled={removeMutation.isPending}
                onClick={() =>
                  removeMutation.mutate(
                    { id: projectId, suppressionId: suppression.id },
                    { onError: onRemoveError },
                  )
                }
              >
                <VisibilityOutlined sx={{ fontSize: 15 }} />
              </IconButton>
            </AppTooltip>
          )}
        </Box>
      );
    }

    if (!isAdmin) return <>{NO_VALUE}</>;

    return (
      <>
        <AppTooltip title={t("tech_health.suppression.ignore")}>
          <IconButton
            size="small"
            aria-label={t("tech_health.suppression.ignore")}
            onClick={() => setModalOpen(true)}
          >
            <VisibilityOffOutlined sx={{ fontSize: 15 }} />
          </IconButton>
        </AppTooltip>
        {modalOpen && (
          <SuppressionModal
            open={modalOpen}
            projectId={projectId}
            findingKey={findingKey}
            vulnerabilityLabel={vulnerabilityLabel}
            onClose={() => setModalOpen(false)}
          />
        )}
      </>
    );
  },
);
SuppressionCell.displayName = "SuppressionCell";
