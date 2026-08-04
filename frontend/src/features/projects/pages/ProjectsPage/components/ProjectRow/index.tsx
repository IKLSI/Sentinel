import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useNavigate } from "@tanstack/react-router";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { RowActions } from "@/components/ui/common/RowActions";
import { AppModal } from "@/components/ui/common/AppModal";
import { useT } from "@/contexts/I18nContext";
import type { Project } from "@/domains/projects/types";
import { useUpdateProjectFrequencyMutation } from "@/domains/projects/mutations";
import type { ScanFrequency } from "@/enums";
import { ScanFrequencyPicker } from "@/components/ui/forms/ScanFrequencyPicker";

interface Props {
  project: Project;
  onDelete: (project: Project) => void;
  onScan: (id: string) => void;
  isScanning: boolean;
}

export const ProjectRow: React.FC<Props> = React.memo(
  ({ project, onDelete, onScan, isScanning }) => {
    const navigate = useNavigate();
    const t = useT();
    const ticketCount = 0;
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState<ScanFrequency>(
      project.scanFrequency as ScanFrequency,
    );
    const updateFrequencyMutation = useUpdateProjectFrequencyMutation();
    const saving = updateFrequencyMutation.isPending;

    const openModal = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelected(project.scanFrequency as ScanFrequency);
      setModalOpen(true);
    };

    const handleSave = () => {
      if (selected === project.scanFrequency) {
        setModalOpen(false);
        return;
      }
      updateFrequencyMutation.mutate(
        { id: project.id, data: { scanFrequency: selected } },
        { onSuccess: () => setModalOpen(false) },
      );
    };

    return (
      <>
        <Box
          component="tr"
          onClick={() =>
            navigate({ to: "/projects/$id", params: { id: project.id } })
          }
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                minWidth: 0,
              }}
            >
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
            sx={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--border)",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                color:
                  !project.lastScanAt ||
                  project.totalDependencies === 0 ||
                  project.totalVulnerabilities === 0
                    ? "var(--muted2)"
                    : "var(--orange)",
                fontWeight:
                  !project.lastScanAt ||
                  project.totalDependencies === 0 ||
                  project.totalVulnerabilities === 0
                    ? 500
                    : 700,
                fontSize: "13px",
                lineHeight: 1.25,
                fontFamily: "var(--font-mono)",
              }}
            >
              {!project.lastScanAt || project.totalDependencies === 0
                ? "—"
                : project.totalVulnerabilities}
            </Box>
          </Box>

          <Box
            component="td"
            sx={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--border)",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                color:
                  !project.lastScanAt ||
                  project.totalDependencies === 0 ||
                  project.criticalVulnerabilities === 0
                    ? "var(--muted2)"
                    : "var(--red)",
                fontWeight:
                  !project.lastScanAt ||
                  project.totalDependencies === 0 ||
                  project.criticalVulnerabilities === 0
                    ? 500
                    : 700,
                fontSize: "13px",
                lineHeight: 1.25,
                fontFamily: "var(--font-mono)",
              }}
            >
              {!project.lastScanAt || project.totalDependencies === 0
                ? "—"
                : project.criticalVulnerabilities}
            </Box>
          </Box>

          <Box
            component="td"
            sx={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--border)",
              textAlign: "center",
            }}
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
                        animation: isScanning
                          ? "spin 1s linear infinite"
                          : "none",
                      }}
                    />
                  ),
                  label: t("projects.action.scan"),
                  onClick: (e) => {
                    e.stopPropagation();
                    onScan(project.id);
                  },
                  color: "yellow",
                  disabled: isScanning,
                },
                {
                  icon: <DeleteOutlineOutlined sx={{ fontSize: 12 }} />,
                  label: t("projects.action.delete"),
                  onClick: (e) => {
                    e.stopPropagation();
                    onDelete(project);
                  },
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
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                {t("projects.modal.cancel")}
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? t("projects.modal.saving") : t("projects.modal.save")}
              </Button>
            </>
          }
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Box
              component="label"
              sx={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}
            >
              {t("projects.modal.frequency_label")}
            </Box>
            <ScanFrequencyPicker
              value={selected}
              onChange={setSelected}
              disabled={saving}
            />
          </Box>
        </AppModal>
      </>
    );
  },
);
