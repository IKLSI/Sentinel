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
  downloadSbom,
  downloadComplianceReport,
} from "@/features/techHealth/api/projects";

interface Props {
  projectId: string;
  projectName: string;
}

export const ExportActions: React.FC<Props> = ({ projectId, projectName }) => {
  const t = useT();
  const { showToast } = useToast();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);

  const open = Boolean(anchorEl);

  const run = async (task: () => Promise<void>) => {
    setAnchorEl(null);
    setBusy(true);
    try {
      await task();
    } catch {
      showToast(t("tech_health.export.error"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleSbom = (format: SbomFormat) =>
    run(() => downloadSbom(projectId, projectName, format));

  const handleReport = () =>
    run(() => downloadComplianceReport(projectId, projectName));

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
        slotProps={{ paper: { sx: { minWidth: 244, mt: "4px" } } }}
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
