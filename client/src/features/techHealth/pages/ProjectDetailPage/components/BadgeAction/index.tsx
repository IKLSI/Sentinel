import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import { ROUTES } from "@/constants/routes";
import { AppModal } from "@/components/ui/common/AppModal";
import { useT } from "@/contexts/I18nContext";
import { buildProjectBadgePath } from "@/domains/publicScan/helpers";
import { useEnableProjectBadgeMutation } from "@/domains/projects/mutations";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { BadgeSnippet } from "@/features/publicScan/components/BadgeSnippet";

interface Props {
  projectId: string;
}

export const BadgeAction: React.FC<Props> = ({ projectId }) => {
  const t = useT();
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const enableMutation = useEnableProjectBadgeMutation();
  const onEnableError = useApiErrorToast("tech_health.badge.error");

  if (!isAdmin) return null;

  const handleOpen = () => {
    setOpen(true);
    if (!enableMutation.data && !enableMutation.isPending) {
      enableMutation.mutate({ id: projectId }, { onError: onEnableError });
    }
  };

  const token = enableMutation.data?.token;

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        size="small"
        onClick={handleOpen}
        startIcon={<WorkspacePremiumOutlined sx={{ fontSize: 14 }} />}
      >
        {t("tech_health.badge.action")}
      </Button>
      <AppModal
        open={open}
        onClose={() => setOpen(false)}
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
              {enableMutation.isPending && <CircularProgress size={24} />}
            </Box>
          )}
        </Box>
      </AppModal>
    </>
  );
};
