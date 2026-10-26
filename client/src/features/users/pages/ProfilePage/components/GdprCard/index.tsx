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
import { GdprRow } from "@/features/users/pages/ProfilePage/components/GdprRow";

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

      <GdprRow
        label={t("profile.gdpr.export_label")}
        labelColor="var(--text)"
        help={t("profile.gdpr.export_help")}
        bordered
      >
        <ExportButton
          onClick={handleExportGdpr}
          exporting={exportingGdpr}
          label={t("profile.gdpr.export_button")}
          showIcon={false}
          sx={GDPR_ACTION_SX}
        />
      </GdprRow>

      <GdprRow
        label={t("profile.gdpr.delete_label")}
        labelColor="var(--red)"
        help={t("profile.gdpr.delete_help")}
      >
        <Button
          variant="contained"
          color="error"
          size="small"
          sx={GDPR_ACTION_SX}
          onClick={onDeleteRequest}
        >
          {t("profile.gdpr.delete_button")}
        </Button>
      </GdprRow>
    </Box>
  );
};
