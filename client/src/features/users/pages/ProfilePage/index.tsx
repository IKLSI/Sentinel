import type React from "react";
import { useState } from "react";
import { version } from "@/../package.json";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { PageContainer } from "@/components/layout/PageContainer";
import { CardHeader } from "@/components/ui/common/CardHeader";
import { ExportButton } from "@/components/ui/common/ExportButton";
import { useT } from "@/contexts/I18nContext";
import { useExportMyDataMutation } from "@/domains/users/mutations";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { CARD_SX } from "@/features/users/pages/ProfilePage/constants";
import { InfoCard } from "@/features/users/pages/ProfilePage/components/InfoCard";
import { PreferencesCard } from "@/features/users/pages/ProfilePage/components/PreferencesCard";
import { DeleteAccountModal } from "@/features/users/pages/ProfilePage/components/DeleteAccountModal";
import { LegalLinks } from "@/features/legal/components/LegalLinks";

const SCROLL_AREA_SX = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  pr: "4px",
} as const;

const GDPR_ACTION_SX = { minWidth: "160px" } as const;

const VERSION_BADGE_SX = {
  position: "fixed",
  bottom: "10px",
  right: "14px",
  fontSize: "10px",
  color: "var(--muted)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.04em",
  userSelect: "none",
  pointerEvents: "none",
} as const;

export const ProfilePage: React.FC = () => {
  const t = useT();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const onExportError = useApiErrorToast("profile.gdpr.export_error");
  const exportGdpr = useExportMyDataMutation();

  const handleExportGdpr = () => {
    exportGdpr.mutate(undefined, { onError: onExportError });
  };

  const gdprRows = [
    {
      key: "export",
      label: t("profile.gdpr.export_label"),
      labelColor: "var(--text)",
      help: t("profile.gdpr.export_help"),
      action: (
        <ExportButton
          onClick={handleExportGdpr}
          exporting={exportGdpr.isPending}
          label={t("profile.gdpr.export_button")}
          showIcon={false}
          sx={GDPR_ACTION_SX}
        />
      ),
    },
    {
      key: "delete",
      label: t("profile.gdpr.delete_label"),
      labelColor: "var(--red)",
      help: t("profile.gdpr.delete_help"),
      action: (
        <Button
          variant="contained"
          color="error"
          size="small"
          sx={GDPR_ACTION_SX}
          onClick={() => setDeleteDialogOpen(true)}
        >
          {t("profile.gdpr.delete_button")}
        </Button>
      ),
    },
  ];

  return (
    <PageContainer sx={{ p: "20px 24px" }}>
      <Box sx={SCROLL_AREA_SX}>
        <InfoCard />
        <PreferencesCard />

        <Box sx={CARD_SX}>
          <CardHeader label={t("profile.section.gdpr")} />
          {gdprRows.map((row, index) => (
            <Box
              key={row.key}
              sx={{
                px: "16px",
                py: "11px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                borderBottom:
                  index < gdprRows.length - 1
                    ? "1px solid var(--border)"
                    : undefined,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: row.labelColor,
                    mb: "2px",
                  }}
                >
                  {row.label}
                </Box>
                <Box sx={{ fontSize: "11px", color: "var(--muted)" }}>
                  {row.help}
                </Box>
              </Box>
              {row.action}
            </Box>
          ))}
        </Box>

        <LegalLinks tone="app" sx={{ mt: "auto", pt: "8px", pb: "4px" }} />
      </Box>

      <DeleteAccountModal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      />

      <Box sx={VERSION_BADGE_SX}>v{version}</Box>
    </PageContainer>
  );
};
