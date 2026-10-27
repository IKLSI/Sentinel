import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemIcon from "@mui/material/ListItemIcon";
import CircularProgress from "@mui/material/CircularProgress";
import DataObjectOutlined from "@mui/icons-material/DataObjectOutlined";
import PictureAsPdfOutlined from "@mui/icons-material/PictureAsPdfOutlined";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useT } from "@/contexts/I18nContext";
import { AppModal } from "@/components/ui/common/modal/AppModal";
import { ROUTES } from "@/constants/routes";
import { buildProjectBadgePath } from "@/domains/publicScan/helpers";
import { SBOM_FORMAT, type SbomFormat } from "@/domains/projects/constants";
import {
  useDownloadComplianceReportMutation,
  useDownloadSbomMutation,
} from "@/domains/projects/downloads";
import { useEnableProjectBadgeMutation } from "@/domains/projects/mutations";
import { BadgeSnippet } from "@/features/projects/pages/ProjectDetailPage/components/ProjectActions/components/BadgeSnippet";

const groupHeaderSx = {
  typography: "monoCaption",
  color: "var(--muted)",
  lineHeight: "28px",
  background: "transparent",
} as const;

const menuIconSx = { fontSize: 17 };

const menuPaperSx = {
  minWidth: 244,
  mt: "10px",
  overflow: "visible",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    right: 16,
    width: 10,
    height: 10,
    bgcolor: "background.paper",
    transform: "translateY(-50%) rotate(45deg)",
    borderTop: "1px solid var(--border)",
    borderLeft: "1px solid var(--border)",
  },
} as const;

const SBOM_OPTIONS: { format: SbomFormat; labelKey: string }[] = [
  {
    format: SBOM_FORMAT.CycloneDx,
    labelKey: "tech_health.export.sbom_cyclonedx",
  },
  { format: SBOM_FORMAT.Spdx, labelKey: "tech_health.export.sbom_spdx" },
  { format: SBOM_FORMAT.Vex, labelKey: "tech_health.export.sbom_vex" },
];

interface Props {
  projectId: string;
}

export const ProjectActions: React.FC<Props> = ({ projectId }) => {
  const t = useT();
  const isAdmin = useIsAdmin();
  const onExportError = useApiErrorToast("tech_health.export.error");
  const onBadgeError = useApiErrorToast("tech_health.badge.error");
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const downloadSbomMutation = useDownloadSbomMutation();
  const downloadReportMutation = useDownloadComplianceReportMutation();
  const enableBadgeMutation = useEnableProjectBadgeMutation();
  const busy =
    downloadSbomMutation.isPending || downloadReportMutation.isPending;

  const open = Boolean(anchorEl);
  const badgeToken = enableBadgeMutation.data?.token;

  const handleSbom = (format: SbomFormat) => {
    setAnchorEl(null);
    downloadSbomMutation.mutate(
      { projectId, format },
      { onError: onExportError },
    );
  };

  const handleReport = () => {
    setAnchorEl(null);
    downloadReportMutation.mutate({ projectId }, { onError: onExportError });
  };

  const handleBadge = () => {
    setAnchorEl(null);
    setBadgeOpen(true);
    if (!enableBadgeMutation.data && !enableBadgeMutation.isPending) {
      enableBadgeMutation.mutate({ id: projectId }, { onError: onBadgeError });
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        disabled={busy}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        startIcon={
          busy ? (
            <CircularProgress size={13} thickness={5} color="inherit" />
          ) : undefined
        }
        endIcon={<KeyboardArrowDownOutlined sx={{ fontSize: 16 }} />}
      >
        {t("tech_health.actions.menu")}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: menuPaperSx } }}
      >
        <ListSubheader sx={groupHeaderSx}>
          {t("tech_health.export.sbom_group")}
        </ListSubheader>
        {SBOM_OPTIONS.map(({ format, labelKey }) => (
          <MenuItem key={format} onClick={() => handleSbom(format)}>
            <ListItemIcon>
              <DataObjectOutlined sx={menuIconSx} />
            </ListItemIcon>
            {t(labelKey)}
          </MenuItem>
        ))}

        <ListSubheader sx={groupHeaderSx}>
          {t("tech_health.export.report_group")}
        </ListSubheader>
        <MenuItem onClick={handleReport}>
          <ListItemIcon>
            <PictureAsPdfOutlined sx={menuIconSx} />
          </ListItemIcon>
          {t("tech_health.export.compliance_report")}
        </MenuItem>

        {isAdmin && (
          <ListSubheader sx={groupHeaderSx}>
            {t("tech_health.actions.share_group")}
          </ListSubheader>
        )}
        {isAdmin && (
          <MenuItem onClick={handleBadge}>
            <ListItemIcon>
              <WorkspacePremiumOutlined sx={menuIconSx} />
            </ListItemIcon>
            {t("tech_health.badge.action")}
          </MenuItem>
        )}
      </Menu>

      <AppModal
        open={badgeOpen}
        onClose={() => setBadgeOpen(false)}
        title={t("tech_health.badge.title")}
        maxWidth="xs"
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Box sx={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {t("public_scan.badge.subtitle")}
          </Box>
          {badgeToken ? (
            <BadgeSnippet
              badgePath={buildProjectBadgePath(badgeToken)}
              linkPath={ROUTES.SCAN}
            />
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", py: "28px" }}>
              {enableBadgeMutation.isPending && <CircularProgress size={24} />}
            </Box>
          )}
        </Box>
      </AppModal>
    </>
  );
};
