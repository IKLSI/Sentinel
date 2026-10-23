import type React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { ROUTES } from "@/constants/routes";
import { AppModal } from "@/components/ui/common/AppModal";
import { useT } from "@/contexts/I18nContext";
import { buildProjectBadgePath } from "@/domains/publicScan/helpers";
import { BadgeSnippet } from "@/features/publicScan/components/BadgeSnippet";

interface Props {
  open: boolean;
  onClose: () => void;
  token?: string;
  loading: boolean;
}

export const BadgeModal: React.FC<Props> = ({
  open,
  onClose,
  token,
  loading,
}) => {
  const t = useT();

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t("tech_health.badge.title")}
      maxWidth="xs"
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Box sx={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {t("public_scan.badge.subtitle")}
        </Box>
        {token ? (
          <BadgeSnippet
            badgePath={buildProjectBadgePath(token)}
            linkPath={ROUTES.SCAN}
          />
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", py: "28px" }}>
            {loading && <CircularProgress size={24} />}
          </Box>
        )}
      </Box>
    </AppModal>
  );
};
