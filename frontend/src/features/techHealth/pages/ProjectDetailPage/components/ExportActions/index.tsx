import type React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemIcon from "@mui/material/ListItemIcon";
import CircularProgress from "@mui/material/CircularProgress";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import DataObjectOutlined from "@mui/icons-material/DataObjectOutlined";
import PictureAsPdfOutlined from "@mui/icons-material/PictureAsPdfOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import {
  SBOM_FORMAT,
  type SbomFormat,
} from "@/features/techHealth/api/projects";
import {
  useDownloadSbom,
  useDownloadComplianceReport,
} from "@/features/techHealth/hooks/useProject";

interface Props {
  projectId: string;
  projectName: string;
}

export const ExportActions: React.FC<Props> = ({ projectId, projectName }) => {
  const t = useT();
  const { showToast } = useToast();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const downloadSbomMutation = useDownloadSbom();
  const downloadReportMutation = useDownloadComplianceReport();
  const busy =
    downloadSbomMutation.isPending || downloadReportMutation.isPending;

  const open = Boolean(anchorEl);

  const handleSbom = (format: SbomFormat) => {
    setAnchorEl(null);
    downloadSbomMutation.mutate(
      { projectId, projectName, format },
      { onError: () => showToast(t("tech_health.export.error"), "error") },
    );
  };

  const handleReport = () => {
    setAnchorEl(null);
    downloadReportMutation.mutate(
      { projectId, projectName },
      { onError: () => showToast(t("tech_health.export.error"), "error") },
    );
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
          ) : (
            <FileDownloadOutlined sx={{ fontSize: 14 }} />
          )
        }
        endIcon={<KeyboardArrowDownOutlined sx={{ fontSize: 16 }} />}
        sx={{
          textTransform: "none",
          background:
            "linear-gradient(135deg, var(--cta) 0%, color-mix(in srgb, var(--cta) 92%, white) 100%)",
          borderColor: "transparent",
          color: "#fff",
          "&:hover": {
            background:
              "linear-gradient(135deg, var(--cta-2) 0%, var(--cta) 100%)",
            borderColor: "transparent",
            color: "#fff",
          },
          "&.MuiButton-root:hover": { transform: "none" },
          "&.Mui-disabled": { color: "#fff", opacity: 0.7 },
        }}
      >
        {t("tech_health.export.menu")}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
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
            },
          },
        }}
      >
        <ListSubheader
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--muted)",
            lineHeight: "28px",
            background: "transparent",
          }}
        >
          {t("tech_health.export.sbom_group")}
        </ListSubheader>
        <MenuItem onClick={() => handleSbom(SBOM_FORMAT.CycloneDx)}>
          <ListItemIcon>
            <DataObjectOutlined sx={{ fontSize: 17 }} />
          </ListItemIcon>
          {t("tech_health.export.sbom_cyclonedx")}
        </MenuItem>
        <MenuItem onClick={() => handleSbom(SBOM_FORMAT.Spdx)}>
          <ListItemIcon>
            <DataObjectOutlined sx={{ fontSize: 17 }} />
          </ListItemIcon>
          {t("tech_health.export.sbom_spdx")}
        </MenuItem>

        <ListSubheader
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--muted)",
            lineHeight: "28px",
            background: "transparent",
          }}
        >
          {t("tech_health.export.report_group")}
        </ListSubheader>
        <MenuItem onClick={handleReport}>
          <ListItemIcon>
            <PictureAsPdfOutlined sx={{ fontSize: 17 }} />
          </ListItemIcon>
          {t("tech_health.export.compliance_report")}
        </MenuItem>
      </Menu>
    </>
  );
};
