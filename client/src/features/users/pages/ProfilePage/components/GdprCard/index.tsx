import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useExportMyDataMutation } from "@/domains/users/mutations";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { ExportButton } from "@/components/ui/common/ExportButton";
import { useT } from "@/contexts/I18nContext";
import {
  CARD_SX,
  GDPR_ACTION_SX,
} from "@/features/users/pages/ProfilePage/constants";
import { CardHeader } from "@/components/ui/common/CardHeader";

interface Props {
  onDeleteRequest: () => void;
}

export const GdprCard: React.FC<Props> = ({ onDeleteRequest }) => {
  const t = useT();
  const onExportError = useApiErrorToast("profile.gdpr.export_error");
  const exportGdpr = useExportMyDataMutation();
  const exportingGdpr = exportGdpr.isPending;

  const handleExportGdpr = () => {
    exportGdpr.mutate(undefined, { onError: onExportError });
  };

  return (
    <Box sx={CARD_SX}>
      <CardHeader label={t("profile.section.gdpr")} />

      <Box
        sx={{
          px: "16px",
          py: "11px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text)",
              mb: "2px",
            }}
          >
            {t("profile.gdpr.export_label")}
          </Box>
          <Box sx={{ fontSize: "11px", color: "var(--muted)" }}>
            {t("profile.gdpr.export_help")}
          </Box>
        </Box>
        <ExportButton
          onClick={handleExportGdpr}
          exporting={exportingGdpr}
          label={t("profile.gdpr.export_button")}
          showIcon={false}
          sx={GDPR_ACTION_SX}
        />
      </Box>

      <Box
        sx={{
          px: "16px",
          py: "11px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          background: "transparent",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--red)",
              mb: "2px",
            }}
          >
            {t("profile.gdpr.delete_label")}
          </Box>
          <Box sx={{ fontSize: "11px", color: "var(--muted)" }}>
            {t("profile.gdpr.delete_help")}
          </Box>
        </Box>
        <Button
          variant="contained"
          color="error"
          size="small"
          sx={GDPR_ACTION_SX}
          onClick={onDeleteRequest}
        >
          {t("profile.gdpr.delete_button")}
        </Button>
      </Box>
    </Box>
  );
};
