import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { RowActions } from "@/components/RowActions";
import { AppModal } from "@/components/AppModal";
import { useT } from "@/i18n/I18nContext";
import { ProjectDto, updateProjectFrequency } from "@/features/techHealth/api/projects";
import { ScanFrequency } from "@/types/enums";
import { modalSelectSx } from "@/features/tickets/pages/TicketsPage/helpers";

interface Props {
  project: ProjectDto;
  onDelete: (project: ProjectDto) => void;
  onScan: (id: string) => void;
  onFrequencyChange: (id: string, freq: ScanFrequency) => void;
  isScanning: boolean;
}

export const ProjectRow: React.FC<Props> = React.memo(({
  project,
  onDelete,
  onScan,
  onFrequencyChange,
  isScanning,
}) => {
  const navigate = useNavigate();
  const t = useT();
  const ticketCount = 0;
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<ScanFrequency>(project.scanFrequency);
  const [saving, setSaving] = useState(false);

  const freqLabel = (f: string) => {
    if (f === "Daily") return t("tech_health.scan_frequency.daily");
    if (f === "Weekly") return t("tech_health.scan_frequency.weekly");
    if (f === "Monthly") return t("tech_health.scan_frequency.monthly");
    return t("tech_health.scan_frequency.manual");
  };

  const openModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(project.scanFrequency);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (selected === project.scanFrequency) { setModalOpen(false); return; }
    setSaving(true);
    try {
      await updateProjectFrequency(project.id, selected);
      onFrequencyChange(project.id, selected);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Box
        component="tr"
        onClick={() => navigate(`/projects/${project.id}`)}
        sx={{
          cursor: "pointer",
          position: "relative",
          transition: "background 0.12s ease",
          "& td": {
            transition: "background 0.12s ease, border-color 0.12s ease",
            verticalAlign: "middle",
          },
          "&:hover td": { background: "var(--s2)" },
          "&:hover .row-actions": { opacity: "1 !important" },
        }}
      >
        <Box
          component="td"
          sx={{
            padding: "8px 12px",
            borderBottom: "1px solid var(--border)",
            fontSize: "12px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <Box sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  fontFamily: "inherit",
                  fontWeight: 700,
                  color: "var(--text)",
                  fontSize: "13px",
                  lineHeight: 1.25,
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {project.name}
              </Box>
              <Box
                sx={{
                  mt: "3px",
                  color: "var(--muted2)",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                {project.lastScanAt
                  ? `${project.totalDependencies} ${project.totalDependencies > 1 ? t("projects.dependencies_plural") : t("projects.dependency_singular")}`
                  : "—"}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          component="td"
          sx={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}
        >
          <Box
            sx={{
              color: (!project.lastScanAt || project.totalDependencies === 0 || project.totalVulnerabilities === 0) ? "var(--muted2)" : "var(--orange)",
              fontWeight: (!project.lastScanAt || project.totalDependencies === 0 || project.totalVulnerabilities === 0) ? 500 : 700,
              fontSize: "13px",
              lineHeight: 1.25,
              fontFamily: "var(--font-mono)",
            }}
          >
            {(!project.lastScanAt || project.totalDependencies === 0) ? "—" : project.totalVulnerabilities}
          </Box>
        </Box>

        <Box
          component="td"
          sx={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}
        >
          <Box
            sx={{
              color: (!project.lastScanAt || project.totalDependencies === 0 || project.criticalVulnerabilities === 0) ? "var(--muted2)" : "var(--red)",
              fontWeight: (!project.lastScanAt || project.totalDependencies === 0 || project.criticalVulnerabilities === 0) ? 500 : 700,
              fontSize: "13px",
              lineHeight: 1.25,
              fontFamily: "var(--font-mono)",
            }}
          >
            {(!project.lastScanAt || project.totalDependencies === 0) ? "—" : project.criticalVulnerabilities}
          </Box>
        </Box>

        <Box
          component="td"
          sx={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}
        >
          <Box
            sx={{
              color: ticketCount > 0 ? "var(--text)" : "var(--muted2)",
              fontWeight: ticketCount > 0 ? 700 : 500,
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              lineHeight: 1.25,
            }}
          >
            {ticketCount}
          </Box>
        </Box>

        <Box
          component="td"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={{
            padding: "8px 40px 8px 0",
            borderBottom: "1px solid var(--border)",
            whiteSpace: "nowrap",
            overflow: "visible",
            textAlign: "right",
          }}
        >
          <RowActions
            actions={[
              {
                icon: <EditOutlined sx={{ fontSize: 12 }} />,
                label: t("projects.action.edit"),
                onClick: openModal,
                color: "accent",
              },
              {
                icon: (
                  <RefreshOutlined
                    sx={{
                      fontSize: 12,
                      animation: isScanning ? "spin 1s linear infinite" : "none",
                    }}
                  />
                ),
                label: t("projects.action.scan"),
                onClick: (e) => { e.stopPropagation(); onScan(project.id); },
                color: "yellow",
                disabled: isScanning,
              },
              {
                icon: <DeleteOutlineOutlined sx={{ fontSize: 12 }} />,
                label: t("projects.action.delete"),
                onClick: (e) => { e.stopPropagation(); onDelete(project); },
                color: "red",
              },
            ]}
          />
        </Box>
      </Box>

      <AppModal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={t("projects.modal.frequency_title")}
        maxWidth="xs"
        actions={
          <>
            <Button
              variant="contained"
              size="small"
              className="btn-cancel"
              sx={{ textTransform: "none" }}
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              {t("projects.modal.cancel")}
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: "none" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t("projects.modal.saving") : t("projects.modal.save")}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Box component="label" sx={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
            {t("projects.modal.frequency_label")}
          </Box>
          <Box
            component="select"
            value={selected}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSelected(e.target.value as ScanFrequency)
            }
            sx={modalSelectSx}
          >
            {Object.values(ScanFrequency).map((freq) => (
              <option key={freq} value={freq}>
                {freqLabel(freq)}
              </option>
            ))}
          </Box>
        </Box>
      </AppModal>
    </>
  );
});
