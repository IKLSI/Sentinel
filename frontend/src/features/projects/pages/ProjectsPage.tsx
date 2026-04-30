import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import { AppModal } from "../../../components/AppModal";
import { DeleteModal } from "../../../components/DeleteModal";
import { RowActions } from "../../../components/RowActions";
import { useToast } from "../../../hooks/useToast";
import { useT } from "../../../i18n/I18nContext";
import { useNavigate } from "react-router-dom";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  scanProject,
  exportProjectsExcel,
  ProjectDto,
} from "../../techHealth/api/projects";

type GradeKey = "F" | "E" | "D" | "C" | "B" | "A";

const GRADE_ORDER: GradeKey[] = ["F", "E", "D", "C", "B", "A"];

const GRADE_VISUAL: Record<GradeKey, { iconColor: string; Icon: SvgIconComponent }> = {
  F: { iconColor: "#dc2626", Icon: WarningAmberOutlined },
  E: { iconColor: "#ea580c", Icon: WarningAmberOutlined },
  D: { iconColor: "#d97706", Icon: ErrorOutlineOutlined },
  C: { iconColor: "#ca8a04", Icon: ErrorOutlineOutlined },
  B: { iconColor: "#4f46e5", Icon: CheckCircleOutlineOutlined },
  A: { iconColor: "#10b981", Icon: CheckCircleOutlineOutlined },
};

const getGrade = (grade: string | null | undefined): GradeKey => {
  if (grade === "A" || grade === "B" || grade === "C" || grade === "D" || grade === "E" || grade === "F") return grade;
  return "F";
};

export const ProjectsPage: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRepoUrl, setFormRepoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectDto | null>(null);
  const [editName, setEditName] = useState("");
  const [editRepoUrl, setEditRepoUrl] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<GradeKey, boolean>>({
    F: false, E: false, D: false, C: false, B: false, A: false,
  });
  const scanPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (scanPollRef.current) clearTimeout(scanPollRef.current); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
const data = await getProjects();
      setProjects(data);
    } catch {
      showToast(t("projects.toast.load_error"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try { await exportProjectsExcel(); }
    catch { showToast(t("projects.toast.export_error"), "error"); }
    finally { setExporting(false); }
  };

  const openModal = () => { setFormName(""); setFormRepoUrl(""); setShowModal(true); };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    setSubmitting(true);
    try {
      await createProject({ name: formName.trim(), repositoryUrl: formRepoUrl || undefined });
      setShowModal(false);
      showToast(t("projects.toast.create_success"), "success");
      await load();
    } catch {
      showToast(t("projects.toast.create_error"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (project: ProjectDto) => {
    setEditTarget(project);
    setEditName(project.name);
    setEditRepoUrl(project.repositoryUrl ?? "");
  };

  const handleEdit = async () => {
    if (!editTarget || !editName.trim()) return;
    setEditSaving(true);
    try {
      const updated = await updateProject(editTarget.id, {
        name: editName.trim(),
        repositoryUrl: editRepoUrl || undefined,
      });
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditTarget(null);
      showToast(t("projects.toast.update_success"), "success");
    } catch {
      showToast(t("projects.toast.update_error"), "error");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      showToast(t("projects.toast.delete_success"), "success");
      await load();
    } catch {
      showToast(t("projects.toast.delete_error"), "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleScan = async (id: string) => {
    if (scanningId) return;
    setScanningId(id);
    const previousLastScanAt = projects.find((p) => p.id === id)?.lastScanAt;
    const deadline = Date.now() + 10 * 60 * 1000;
    try {
      await scanProject(id);
      showToast(t("projects.toast.scan_started"), "info");
      const poll = async () => {
        if (Date.now() > deadline) {
          setScanningId(null);
          showToast(t("projects.toast.scan_timeout"), "warning");
          return;
        }
        try {
          const updated = await getProject(id);
          if (updated.lastScanAt !== previousLastScanAt) {
            setProjects((prev) => prev.map((p) => p.id === id ? { ...p, healthScore: updated.healthScore, healthGrade: updated.healthGrade, totalDependencies: updated.totalDependencies, vulnerableDependencies: updated.vulnerableDependencies, criticalVulnerabilities: updated.criticalVulnerabilities } : p));
            setScanningId(null);
            showToast(t("projects.toast.scan_done"), "success");
          } else {
            scanPollRef.current = setTimeout(poll, 3000);
          }
        } catch {
          scanPollRef.current = setTimeout(poll, 5000);
        }
      };
      scanPollRef.current = setTimeout(poll, 2000);
    } catch {
      showToast(t("projects.toast.scan_start_error"), "error");
      setScanningId(null);
    }
  };

  const filtered = useMemo(() =>
    projects
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [projects, search],
  );

  const grouped = useMemo(() => {
    const map: Record<GradeKey, ProjectDto[]> = { F: [], E: [], D: [], C: [], B: [], A: [] };
    filtered.forEach((project) => { map[getGrade(project.healthGrade)].push(project); });
    return map;
  }, [filtered]);

  const visibleSections = useMemo(
    () => GRADE_ORDER.filter((grade) => grouped[grade].length > 0),
    [grouped],
  );

  return (
    <>

      <Box
        className="page-enter"
        sx={{
          p: "36px 28px 24px",
          height: "100vh",
          maxHeight: "100vh",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Barre haut */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "16px", flexShrink: 0, gap: "10px", flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Box sx={{
              width: "280px", maxWidth: "52vw", display: "flex", alignItems: "center", gap: "8px",
              background: "var(--s1)", border: "1px solid var(--border)",
              borderRadius: "9px", px: "10px", height: "32px",
              transition: "border-color 0.15s, box-shadow 0.15s",
              "&:focus-within": { borderColor: "var(--accent-border)", boxShadow: "0 0 0 3px rgba(99,102,241,0.08)" },
            }}>
              <SearchOutlined sx={{ color: "var(--muted)", fontSize: "14px", flexShrink: 0 }} />
              <Box
                component="input" type="text" placeholder={t("projects.search_placeholder")}
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                sx={{
                  all: "unset", flex: 1, fontSize: "14px", color: "var(--text)",
                  fontFamily: "var(--font-ui)",
                  "&::placeholder": { color: "var(--muted)" },
                  "&:focus": { outline: "none", boxShadow: "none !important" },
                }}
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Button
              variant="contained" size="small"
              sx={{
                textTransform: "none", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0,
                "&.MuiButton-root": { background: "#1e3d9c", boxShadow: "none", height: "32px", px: "14px" },
                "&.MuiButton-root:hover": { background: "#1e3a8a", boxShadow: "none", transform: "none" },
              }}
              onClick={openModal}
            >
              <AddOutlined sx={{ fontSize: 14 }} />
              {t("projects.new_project")}
            </Button>
            <Button
              variant="outlined" size="small" disabled={exporting}
              sx={{
                display: "flex", alignItems: "center", gap: "6px", flexShrink: 0,
                textTransform: "none",
                background: "#6366f1", borderColor: "#6366f1", color: "#fff",
                "&:hover": { background: "#5254cc", borderColor: "#5254cc", color: "#fff" },
              }}
              onClick={handleExport}
            >
              {exporting ? <CircularProgress size={12} sx={{ color: "var(--text-secondary)" }} /> : <FileDownloadOutlined sx={{ fontSize: 14 }} />}
              {t("projects.export")}
            </Button>
          </Box>
        </Box>

        {/* Sections */}
        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              pr: "4px",
              pb: "2px",
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": { background: "var(--border2)", borderRadius: "99px" },
              "&::-webkit-scrollbar-track": { background: "transparent" },
            }}
          >
            {filtered.length === 0 ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--s1)", border: "1px solid var(--border)", borderRadius: "var(--r)" }}>
                <Box className="empty-state">
                  <Box className="empty-state-icon"><AccountTreeOutlined sx={{ fontSize: 40 }} /></Box>
                  <Box className="empty-state-title">{t("projects.empty.title")}</Box>
                  <Box className="empty-state-subtitle">
                    {projects.length === 0 ? t("projects.empty.create_first") : t("projects.empty.adjust_search")}
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{ minWidth: "1060px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {visibleSections.map((grade) => {
                  const items = grouped[grade];
                  const cfg = GRADE_VISUAL[grade];

                  return (
                    <Box
                      key={grade}
                      sx={{
                        background: "var(--s1)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r)",
                        overflow: "hidden",
                      }}
                    >
                      {(() => {
                        const isCollapsed = collapsedSections[grade];
                        const { Icon } = cfg;
                        return (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          p: "11px 14px",
                          background: "var(--s2)",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                          <Box
                            sx={{
                              width: "34px",
                              height: "34px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: cfg.iconColor,
                              flexShrink: 0,
                            }}
                          >
                            <Icon sx={{ fontSize: 22 }} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Box sx={{ fontSize: "13px", fontWeight: 700, color: cfg.iconColor, lineHeight: 1.2, letterSpacing: "-0.01em", fontFamily: "var(--font-ui)" }}>
                              {t(`projects.grade.${grade}.label`)}
                            </Box>
                            <Box sx={{ fontSize: "11px", color: "var(--muted2)", mt: "2px", lineHeight: 1.2 }}>
                              {t(`projects.grade.${grade}.subtitle`)}
                            </Box>
                          </Box>
                        </Box>
                        <Box
                          component="button"
                          aria-label={isCollapsed ? t("projects.section.expand") : t("projects.section.collapse")}
                          onClick={() => setCollapsedSections((prev) => ({ ...prev, [grade]: !prev[grade] }))}
                          sx={{
                            all: "unset",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--muted2)",
                            transition: "color 0.12s",
                            "&:hover": { color: "var(--text-secondary)" },
                          }}
                        >
                          <KeyboardArrowDownOutlined
                            sx={{
                              fontSize: 20,
                              transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
                              transition: "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)",
                              transformOrigin: "center",
                              willChange: "transform",
                            }}
                          />
                        </Box>
                      </Box>
                        );
                      })()}

                      {!collapsedSections[grade] && (
                        <Box sx={{ overflowX: "auto" }}>
                          <Box component="table" sx={{ width: "100%", minWidth: "1060px", borderCollapse: "collapse", tableLayout: "fixed" }}>
                            <Box component="colgroup">
                              {(["56%","12%","10%","12%","10%"] as const).map((w, i) => (
                                <Box key={i} component="col" sx={{ width: w }} />
                              ))}
                            </Box>
                            <Box component="thead">
                              <Box component="tr">
                                <HeadCell>{t("projects.table.project")}</HeadCell>
                                <HeadCell align="center">{t("projects.table.vulnerabilities")}</HeadCell>
                                <HeadCell align="center">{t("projects.table.critical")}</HeadCell>
                                <HeadCell align="center">{t("projects.table.tickets")}</HeadCell>
                                <HeadCell />
                              </Box>
                            </Box>
                            <Box component="tbody">
                              {items.map((project) => (
                                <ProjectRow
                                  key={project.id}
                                  project={project}
                                  onEdit={() => openEdit(project)}
                                  onDelete={() => setDeleteTarget(project)}
                                  onScan={() => handleScan(project.id)}
                                  isScanning={scanningId === project.id}
                                />
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </Box>

      <AppModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={t("projects.modal.create_title")}
        actions={
          <>
            <Button variant="outlined" size="small" className="btn-cancel" sx={{ textTransform: "none" }} onClick={() => setShowModal(false)}>
              {t("projects.modal.cancel")}
            </Button>
            <Button variant="contained" size="small" sx={{ textTransform: "none" }} onClick={handleSubmit} disabled={!formName.trim() || submitting}>
              {submitting ? t("projects.modal.creating") : t("projects.modal.create")}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <ModalField label={<>{t("projects.field.name_label")} <Box component="span" sx={{ color: "var(--red)" }}>*</Box></>} placeholder={t("projects.field.name_placeholder")} value={formName} onChange={setFormName} autoFocus />
          <ModalField label={t("projects.field.repo_url_label")} placeholder={t("projects.field.repo_url_placeholder")} value={formRepoUrl} onChange={setFormRepoUrl} />
        </Box>
      </AppModal>

      <AppModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={t("projects.modal.edit_title")}
        actions={
          <>
            <Button variant="outlined" size="small" className="btn-cancel" sx={{ textTransform: "none" }} onClick={() => setEditTarget(null)}>
              {t("projects.modal.cancel")}
            </Button>
            <Button variant="contained" size="small" sx={{ textTransform: "none" }} onClick={handleEdit} disabled={!editName.trim() || editSaving}>
              {editSaving ? t("projects.modal.saving") : t("projects.modal.save")}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <ModalField label={<>{t("projects.field.name_label")} <Box component="span" sx={{ color: "var(--red)" }}>*</Box></>} value={editName} onChange={setEditName} />
          <ModalField label={t("projects.field.repo_url_label")} placeholder={t("projects.field.repo_url_placeholder")} value={editRepoUrl} onChange={setEditRepoUrl} />
        </Box>
      </AppModal>

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t("projects.delete.title")}
      >
        {t("projects.delete.prefix")} <strong>{deleteTarget?.name}</strong>{t("projects.delete.suffix")}
      </DeleteModal>
    </>
  );
};

const HeadCell: React.FC<{ children?: React.ReactNode; align?: "left" | "center" | "right" }> = ({ children, align = "left" }) => (
  <Box
    component="th"
    sx={{
      padding: "9px 12px",
      borderBottom: "1px solid var(--border)",
      background: "var(--s2)",
      fontFamily: "var(--font-mono)",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--muted2)",
      textAlign: align,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </Box>
);


const ProjectRow: React.FC<{
  project: ProjectDto;
  onEdit: () => void;
  onDelete: () => void;
  onScan: () => void;
  isScanning: boolean;
}> = ({ project, onEdit, onDelete, onScan, isScanning }) => {
  const navigate = useNavigate();
  const t = useT();
  const ticketCount = 0;

  return (
    <Box
      component="tr"
      onClick={() => navigate(`/projects/${project.id}`)}
      sx={{
        cursor: "pointer",
        position: "relative",
        transition: "background 0.12s ease",
        "& td": { transition: "background 0.12s ease, border-color 0.12s ease", verticalAlign: "middle" },
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
              {project.totalDependencies} {project.totalDependencies > 1 ? t("projects.dependencies_plural") : t("projects.dependency_singular")}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box component="td" sx={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
        <Box sx={{
          color: project.vulnerableDependencies > 0 ? "var(--orange)" : "var(--muted2)",
          fontWeight: project.vulnerableDependencies > 0 ? 700 : 500,
          fontSize: "13px",
          lineHeight: 1.25,
          fontFamily: "var(--font-mono)",
        }}>
          {project.vulnerableDependencies}
        </Box>
      </Box>

      <Box component="td" sx={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
        <Box sx={{
          color: project.criticalVulnerabilities > 0 ? "var(--red)" : "var(--muted2)",
          fontWeight: project.criticalVulnerabilities > 0 ? 700 : 500,
          fontSize: "13px",
          lineHeight: 1.25,
          fontFamily: "var(--font-mono)",
        }}>
          {project.criticalVulnerabilities}
        </Box>
      </Box>

      <Box component="td" sx={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
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

      <Box component="td" onClick={(e: React.MouseEvent) => e.stopPropagation()} sx={{ padding: "8px 4px 8px 0", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", overflow: "visible", textAlign: "right" }}>
        <RowActions actions={[
          { icon: <RefreshOutlined sx={{ fontSize: 12, animation: isScanning ? "spin 1s linear infinite" : "none" }} />, label: t("projects.action.scan"), onClick: (e) => { e.stopPropagation(); onScan(); }, color: "yellow", disabled: isScanning },
          { icon: <EditOutlined sx={{ fontSize: 12 }} />, label: t("projects.action.edit"), onClick: (e) => { e.stopPropagation(); onEdit(); }, color: "accent" },
          { icon: <DeleteOutlineOutlined sx={{ fontSize: 12 }} />, label: t("projects.action.delete"), onClick: (e) => { e.stopPropagation(); onDelete(); }, color: "red" },
        ]} />
      </Box>
    </Box>
  );
};

const ModalField: React.FC<{ label: React.ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }> = ({
  label, value, onChange, placeholder, autoFocus,
}) => (
  <Box>
    <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>
      {label}
    </Box>
    <Box
      component="input" autoFocus={autoFocus} type="text" placeholder={placeholder}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      sx={{
        background: "var(--s1)", border: "1px solid var(--border)", borderRadius: "var(--r)",
        px: "12px", py: "8px", fontSize: "13px", color: "var(--text)",
        width: "100%", outline: "none", fontFamily: "inherit",
      }}
    />
  </Box>
);
