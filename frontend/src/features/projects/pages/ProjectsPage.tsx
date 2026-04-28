import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import { AppModal } from "../../../components/AppModal";
import { DeleteModal } from "../../../components/DeleteModal";
import { RowActions } from "../../../components/RowActions";
import { useToast } from "../../../hooks/useToast";
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

const GRADE_CONFIG: Record<GradeKey, {
  label: string;
  subtitle: string;
  iconColor: string;
  Icon: SvgIconComponent;
}> = {
  F: {
    label: "Risque critique",
    subtitle: "Intervention immédiate requise",
    iconColor: "#dc2626",
    Icon: WarningAmberOutlined,
  },
  E: {
    label: "Risque sévère",
    subtitle: "Exposition critique confirmée",
    iconColor: "#ea580c",
    Icon: WarningAmberOutlined,
  },
  D: {
    label: "Risque modéré",
    subtitle: "Correctifs recommandés",
    iconColor: "#d97706",
    Icon: ErrorOutlineOutlined,
  },
  C: {
    label: "Risque faible",
    subtitle: "Anomalies mineures détectées",
    iconColor: "#ca8a04",
    Icon: ErrorOutlineOutlined,
  },
  B: {
    label: "Satisfaisant",
    subtitle: "Légères améliorations possibles",
    iconColor: "#4f46e5",
    Icon: CheckCircleOutlineOutlined,
  },
  A: {
    label: "Conforme",
    subtitle: "Aucune vulnérabilité détectée",
    iconColor: "#10b981",
    Icon: CheckCircleOutlineOutlined,
  },
};

const getGrade = (grade: string | null | undefined): GradeKey => {
  if (grade === "A" || grade === "B" || grade === "C" || grade === "D" || grade === "E" || grade === "F") return grade;
  return "F";
};

export const ProjectsPage: React.FC = () => {
  const { showToast } = useToast();
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
      showToast("Impossible de charger les projets", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try { await exportProjectsExcel(); }
    catch { showToast("Erreur lors de l'export Excel", "error"); }
    finally { setExporting(false); }
  };

  const openModal = () => { setFormName(""); setFormRepoUrl(""); setShowModal(true); };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    setSubmitting(true);
    try {
      await createProject({ name: formName.trim(), repositoryUrl: formRepoUrl || undefined });
      setShowModal(false);
      showToast("Projet créé avec succès", "success");
      await load();
    } catch {
      showToast("Erreur lors de la création du projet", "error");
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
      showToast("Projet mis à jour", "success");
    } catch {
      showToast("Erreur lors de la mise à jour", "error");
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
      showToast("Projet supprimé", "success");
      await load();
    } catch {
      showToast("Erreur lors de la suppression", "error");
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
      showToast("Scan lancé, analyse en cours…", "info");
      const poll = async () => {
        if (Date.now() > deadline) {
          setScanningId(null);
          showToast("Timeout : le scan prend plus de temps que prévu", "warning");
          return;
        }
        try {
          const updated = await getProject(id);
          if (updated.lastScanAt !== previousLastScanAt) {
            setProjects((prev) => prev.map((p) => p.id === id ? { ...p, healthScore: updated.healthScore, healthGrade: updated.healthGrade, totalDependencies: updated.totalDependencies, vulnerableDependencies: updated.vulnerableDependencies, criticalVulnerabilities: updated.criticalVulnerabilities } : p));
            setScanningId(null);
            showToast("Scan terminé", "success");
          } else {
            scanPollRef.current = setTimeout(poll, 3000);
          }
        } catch {
          scanPollRef.current = setTimeout(poll, 5000);
        }
      };
      scanPollRef.current = setTimeout(poll, 2000);
    } catch {
      showToast("Impossible de lancer le scan", "error");
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
                component="input" type="text" placeholder="Rechercher..."
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
                "&.MuiButton-root": { background: "#4f46e5", boxShadow: "none", height: "32px", px: "14px" },
                "&.MuiButton-root:hover": { background: "#4338ca", boxShadow: "none", transform: "none" },
              }}
              onClick={openModal}
            >
              <AddOutlined sx={{ fontSize: 14 }} />
              Nouveau projet
            </Button>
            <Button
              variant="outlined" size="small" disabled={exporting}
              sx={{
                display: "flex", alignItems: "center", gap: "6px", flexShrink: 0,
                textTransform: "none",
                background: "#8b84e3", borderColor: "#8b84e3", color: "#fff",
                height: "32px", px: "14px",
                "&:hover": { background: "#786fd8", borderColor: "#786fd8", color: "#fff" },
              }}
              onClick={handleExport}
            >
              {exporting ? <CircularProgress size={12} sx={{ color: "var(--text-secondary)" }} /> : <FileDownloadOutlined sx={{ fontSize: 14 }} />}
              Exporter
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
                  <Box className="empty-state-title">Aucun projet trouvé</Box>
                  <Box className="empty-state-subtitle">
                    {projects.length === 0 ? "Créez votre premier projet" : "Modifiez votre recherche"}
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{ minWidth: "1060px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {visibleSections.map((grade) => {
                  const items = grouped[grade];
                  const cfg = GRADE_CONFIG[grade];

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
                              {cfg.label}
                            </Box>
                            <Box sx={{ fontSize: "11px", color: "var(--muted2)", mt: "2px", lineHeight: 1.2 }}>
                              {cfg.subtitle}
                            </Box>
                          </Box>
                        </Box>
                        <Box
                          component="button"
                          aria-label={isCollapsed ? "Déplier la section" : "Replier la section"}
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
                                <HeadCell>Projet</HeadCell>
                                <HeadCell align="center">Vulnérabilités</HeadCell>
                                <HeadCell align="center">Critiques</HeadCell>
                                <HeadCell align="center">Tickets</HeadCell>
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
        title="Nouveau projet"
        actions={
          <>
            <Button variant="outlined" size="small" className="btn-cancel" sx={{ textTransform: "none" }} onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button variant="contained" size="small" sx={{ textTransform: "none" }} onClick={handleSubmit} disabled={!formName.trim() || submitting}>
              {submitting ? "Création..." : "Créer"}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <ModalField label={<>Nom du projet <Box component="span" sx={{ color: "var(--red)" }}>*</Box></>} placeholder="Ex : API Paiement v2" value={formName} onChange={setFormName} autoFocus />
          <ModalField label="URL dépôt" placeholder="https://github.com/org/repo" value={formRepoUrl} onChange={setFormRepoUrl} />
        </Box>
      </AppModal>

      <AppModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Modifier le projet"
        actions={
          <>
            <Button variant="outlined" size="small" className="btn-cancel" sx={{ textTransform: "none" }} onClick={() => setEditTarget(null)}>
              Annuler
            </Button>
            <Button variant="contained" size="small" sx={{ textTransform: "none" }} onClick={handleEdit} disabled={!editName.trim() || editSaving}>
              {editSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <ModalField label={<>Nom du projet <Box component="span" sx={{ color: "var(--red)" }}>*</Box></>} value={editName} onChange={setEditName} />
          <ModalField label="URL dépôt" placeholder="https://github.com/org/repo" value={editRepoUrl} onChange={setEditRepoUrl} />
        </Box>
      </AppModal>

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Supprimer ce projet ?"
      >
        Supprimer <strong>{deleteTarget?.name}</strong> supprimera aussi toutes les dépendances et vulnérabilités associées. Cette action est irréversible.
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
              {project.totalDependencies} dépendance{project.totalDependencies > 1 ? "s" : ""}
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
          { icon: <RefreshOutlined sx={{ fontSize: 12, animation: isScanning ? "spin 1s linear infinite" : "none" }} />, label: "Lancer un scan", onClick: (e) => { e.stopPropagation(); onScan(); }, color: "yellow", disabled: isScanning },
          { icon: <EditOutlined sx={{ fontSize: 12 }} />, label: "Modifier", onClick: (e) => { e.stopPropagation(); onEdit(); }, color: "accent" },
          { icon: <DeleteOutlineOutlined sx={{ fontSize: 12 }} />, label: "Supprimer", onClick: (e) => { e.stopPropagation(); onDelete(); }, color: "red" },
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
