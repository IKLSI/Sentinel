import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useNavigate } from "@tanstack/react-router";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { RowActions } from "@/components/ui/common/RowActions";
import { AppModal } from "@/components/ui/common/AppModal";
import { useT } from "@/contexts/I18nContext";
import type { ProjectSummary } from "@/domains/projects/types";
import { useUpdateProjectSettingsMutation } from "@/domains/projects/mutations";
import type { ScanFrequency } from "@/enums";
import { ScanFrequencyPicker } from "@/components/ui/forms/ScanFrequencyPicker";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { RepositoryScopeFields } from "@/features/projects/pages/ProjectsPage/components/RepositoryScopeFields";

const sectionSx = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
} as const;

const sectionTitleSx = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--text)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
} as const;

const rescanNoticeSx = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  px: "10px",
  py: "8px",
  fontSize: "12px",
  lineHeight: 1.5,
  color: "var(--text)",
  background: "var(--yellow-subtle)",
  borderRadius: "var(--r-sm)",
  "& svg": { color: "var(--yellow)" },
} as const;

interface Props {
  project: ProjectSummary;
  onDelete: (project: ProjectSummary) => void;
  onScan: (id: string) => void;
  isScanning: boolean;
}

export const ProjectRow: React.FC<Props> = React.memo(
  ({ project, onDelete, onScan, isScanning }) => {
    const navigate = useNavigate();
    const t = useT();
    const isAdmin = useIsAdmin();
    const ticketCount = project.totalTickets;
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState<ScanFrequency>(
      project.scanFrequency as ScanFrequency,
    );
    const [branch, setBranch] = useState(project.branch ?? "");
    const [rootPath, setRootPath] = useState(project.rootPath ?? "");
    const updateSettingsMutation = useUpdateProjectSettingsMutation();
    const saving = updateSettingsMutation.isPending;
    const onFrequencyError = useApiErrorToast("projects.modal.frequency_error");

    const openModal = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelected(project.scanFrequency as ScanFrequency);
      setBranch(project.branch ?? "");
      setRootPath(project.rootPath ?? "");
      setModalOpen(true);
    };

    const nextBranch = branch.trim() || null;
    const nextRootPath = rootPath.trim() || null;
    const scopeChanged =
      nextBranch !== (project.branch ?? null) ||
      nextRootPath !== (project.rootPath ?? null);

    const handleSave = () => {
      if (selected === project.scanFrequency && !scopeChanged) {
        setModalOpen(false);
        return;
      }
      updateSettingsMutation.mutate(
        {
          id: project.id,
          data: {
            scanFrequency: selected,
            branch: nextBranch,
            rootPath: nextRootPath,
          },
        },
        { onSuccess: () => setModalOpen(false), onError: onFrequencyError },
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
              padding: "8px 20px 8px 0",
              borderBottom: "1px solid var(--border)",
              whiteSpace: "nowrap",
              overflow: "visible",
              textAlign: "right",
            }}
          >
            <RowActions
              actions={[
                ...(isAdmin
                  ? [
                      {
                        icon: <EditOutlined sx={{ fontSize: 12 }} />,
                        label: t("projects.action.edit"),
                        onClick: openModal,
                        color: "accent" as const,
                      },
                    ]
                  : []),
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
                ...(isAdmin
                  ? [
                      {
                        icon: <DeleteOutlineOutlined sx={{ fontSize: 12 }} />,
                        label: t("projects.action.delete"),
                        onClick: (e: React.MouseEvent) => {
                          e.stopPropagation();
                          onDelete(project);
                        },
                        color: "red" as const,
                      },
                    ]
                  : []),
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <Box sx={sectionSx}>
              <Box component="span" sx={sectionTitleSx}>
                {t("projects.modal.frequency_label")}
              </Box>
              <Box>
                <ScanFrequencyPicker
                  value={selected}
                  onChange={setSelected}
                  disabled={saving}
                />
              </Box>
            </Box>
            <Box
              sx={{
                ...sectionSx,
                pt: "20px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <RepositoryScopeFields
                projectId={project.id}
                enabled={modalOpen}
                branch={branch}
                onBranchChange={setBranch}
                rootPath={rootPath}
                onRootPathChange={setRootPath}
                disabled={saving}
              />
              {scopeChanged && (
                <Box sx={rescanNoticeSx}>
                  <InfoOutlined sx={{ fontSize: 15, mt: "1px" }} />
                  <span>{t("projects.modal.scope_help")}</span>
                </Box>
              )}
            </Box>
          </Box>
        </AppModal>
      </>
    );
  },
);
