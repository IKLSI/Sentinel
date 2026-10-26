import { memo, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useI18n } from "@/contexts/I18nContext";
import type { VulnerabilitySuppression } from "@/domains/projects/types";
import { formatDate } from "@/formatters/date";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { SuppressionModal } from "@/features/techHealth/pages/ProjectDetailPage/components/SuppressionModal";
import { useFindingActions } from "@/features/techHealth/pages/ProjectDetailPage/findingActions";
import { NO_VALUE } from "@/constants/display";

const suppressedIconSx = { fontSize: 15, color: "var(--accent)" } as const;

interface Props {
  findingKey: string;
  vulnerabilityLabel: string;
  suppression?: VulnerabilitySuppression | null;
}

export const SuppressionCell = memo<Props>(
  ({ findingKey, vulnerabilityLabel, suppression }) => {
    const { t, culture } = useI18n();
    const isAdmin = useIsAdmin();
    const [modalOpen, setModalOpen] = useState(false);
    const { removeSuppression, removingSuppressionId } = useFindingActions();

    if (suppression) {
      const details = [
        t("tech_health.suppression.badge"),
        t(`tech_health.suppression.reason.${suppression.reason}`),
        suppression.expiresAt
          ? t("tech_health.suppression.until", {
              date: formatDate(suppression.expiresAt, culture),
            })
          : null,
      ].filter(Boolean);

      if (!isAdmin) {
        return (
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
            <Box
              component="span"
              aria-label={t("tech_health.suppression.badge")}
              sx={{ display: "inline-flex" }}
            >
              <VisibilityOutlined sx={suppressedIconSx} />
            </Box>
          </AppTooltip>
        );
      }

      return (
        <AppTooltip title={t("tech_health.suppression.reactivate")}>
          <IconButton
            size="small"
            aria-label={t("tech_health.suppression.reactivate")}
            disabled={removingSuppressionId === suppression.id}
            onClick={() => removeSuppression(suppression.id)}
          >
            <VisibilityOutlined sx={suppressedIconSx} />
          </IconButton>
        </AppTooltip>
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
            open
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
