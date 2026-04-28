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

type SortKey = "name" | "healthScore" | "totalDependencies" | "vulnerableDependencies" | "criticalVulnerabilities";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

const gradeColor = (grade: string) => {
  switch (grade) {
    case "A": return "#22c55e";
    case "B": return "#10b981";
    case "C": return "#f59e0b";
    case "D": return "#f97316";
    case "E": return "#dc6803";
    default:  return "#ef4444";
  }
};

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1, 2];
  if (page > 3) pages.push("...");
  if (page > 2 && page < totalPages) pages.push(page);
  if (page < totalPages - 1) pages.push("...");
  if (!pages.includes(totalPages)) pages.push(totalPages);
  return pages;
}

const navBtnSx = (disabled: boolean) => ({
  all: "unset" as const,
  cursor: disabled ? "default" : "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  gap: "6px", height: "32px", px: "12px",
  borderRadius: "8px", fontSize: "12px", fontWeight: 600,
  color: disabled ? "var(--muted)" : "var(--text-secondary)",
  background: "var(--s2)", border: "1px solid var(--border)",
  opacity: disabled ? 0.4 : 1,
  pointerEvents: disabled ? "none" : "auto",
  transition: "background 0.12s, border-color 0.12s, color 0.12s",
  ...(!disabled && { "&:hover": { background: "var(--s3)", borderColor: "var(--border2)", color: "var(--text)" } }),
});

const pageBtnSx = (active: boolean) => ({
  all: "unset" as const,
  cursor: active ? "default" : "pointer",
  minWidth: "32px", height: "32px",
  display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: "8px", fontSize: "12px", fontWeight: active ? 700 : 500,
  color: active ? "#fff" : "var(--text-secondary)",
  background: active ? "var(--accent)" : "transparent",
  boxShadow: active ? "0 2px 8px rgba(99,102,241,0.35)" : "none",
  transition: "background 0.12s, color 0.12s, box-shadow 0.12s",
  ...(!active && { "&:hover": { background: "var(--s2)", color: "var(--text)" } }),
});

const Pagination: React.FC<{
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}> = ({ page, totalPages, total, onChange }) => {
  const pages = getPageNumbers(page, totalPages);
  return (
    <Box sx={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      px: "16px", py: "10px",
      borderTop: "1px solid var(--border)",
      flexShrink: 0, background: "var(--s2)",
    }}>
      <Box sx={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
        {total} projet{total > 1 ? "s" : ""}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Box component="button" sx={navBtnSx(page === 1)} onClick={() => onChange(page - 1)}>
          ← Précédent
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "2px", mx: "4px" }}>
          {pages.map((p, i) =>
            p === "..." ? (
              <Box key={`e-${i}`} sx={{ minWidth: "28px", textAlign: "center", fontSize: "13px", color: "var(--muted)", pb: "2px" }}>
                ···
              </Box>
            ) : (
              <Box key={p} component="button" sx={pageBtnSx(p === page)} onClick={() => p !== page && onChange(p as number)}>
                {p}
              </Box>
            )
          )}
        </Box>
        <Box component="button" sx={navBtnSx(page === totalPages)} onClick={() => onChange(page + 1)}>
          Suivant →
        </Box>
      </Box>
    </Box>
  );
};

export const ProjectsPage: React.FC = () => {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>({ key: "healthScore", dir: "asc" });
  const [page, setPage] = useState(1);
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
  useEffect(() => { setPage(1); }, [search]);

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

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const filtered = useMemo(() =>
    projects
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (!sort) return 0;
        const va = a[sort.key];
        const vb = b[sort.key];
        const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
        return sort.dir === "asc" ? cmp : -cmp;
      }),
    [projects, search, sort],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const COLS: { key: SortKey; label: string; numeric?: boolean }[] = [
    { key: "name", label: "Nom" },
    { key: "healthScore", label: "Score", numeric: true },
    { key: "totalDependencies", label: "Dépendances", numeric: true },
    { key: "vulnerableDependencies", label: "Vulnérables", numeric: true },
    { key: "criticalVulnerabilities", label: "Critiques", numeric: true },
  ];

  return (
    <>

      <Box className="page-enter" sx={{ p: "36px 28px 24px", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Barre haut */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "16px", flexShrink: 0 }}>
          <Box sx={{
            width: "280px", display: "flex", alignItems: "center", gap: "8px",
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
                all: "unset", flex: 1, fontSize: "12.5px", color: "var(--text)",
                "&::placeholder": { color: "var(--muted)" },
                "&:focus": { outline: "none", boxShadow: "none !important" },
              }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Button
              variant="contained" size="small"
              sx={{
                textTransform: "none", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0,
                "&.MuiButton-root": { background: "#1e3d9c", boxShadow: "none" },
                "&.MuiButton-root:hover": { background: "#1e3a8a", boxShadow: "none", transform: "none" },
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
                background: "#6366f1", borderColor: "#6366f1", color: "#fff",
                "&:hover": { background: "#5254cc", borderColor: "#5254cc", color: "#fff" },
              }}
              onClick={handleExport}
            >
              {exporting ? <CircularProgress size={12} sx={{ color: "var(--text-secondary)" }} /> : <FileDownloadOutlined sx={{ fontSize: 14 }} />}
              Exporter
            </Button>
          </Box>
        </Box>

        {/* Tableau */}
        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box sx={{
            background: "var(--s1)", border: "1px solid var(--border)",
            borderRadius: "var(--r)", overflow: "hidden",
            flex: 1, display: "flex", flexDirection: "column",
          }}>
            {filtered.length === 0 ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box className="empty-state">
                  <Box className="empty-state-icon"><AccountTreeOutlined sx={{ fontSize: 40 }} /></Box>
                  <Box className="empty-state-title">Aucun projet trouvé</Box>
                  <Box className="empty-state-subtitle">
                    {projects.length === 0 ? "Créez votre premier projet" : "Modifiez votre recherche"}
                  </Box>
                </Box>
              </Box>
            ) : (
              <>
              <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", flexShrink: 0 }}>
                <Box component="colgroup">
                  {(["37%","11%","15%","15%","13%","9%"] as const).map((w, i) => (
                    <Box key={i} component="col" sx={{ width: w }} />
                  ))}
                </Box>
                <Box component="thead">
                  <Box component="tr">
                    {COLS.map(({ key, label, numeric }) => {
                      const isActive = sort?.key === key;
                      return (
                        <Box
                          component="th" key={key}
                          onClick={() => toggleSort(key)}
                          sx={{
                            fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: isActive ? "var(--accent)" : "var(--muted)",
                            textAlign: numeric ? "center" : "left", padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                            background: "var(--s2)", whiteSpace: "nowrap",
                            cursor: "pointer", userSelect: "none",
                            transition: "color 0.12s",
                            "&:hover": { color: "var(--text-secondary)" },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: "5px", justifyContent: numeric ? "center" : "flex-start" }}>
                            {label}
                            {isActive && (
                              <Box sx={{ fontSize: "12px", color: "var(--accent)", lineHeight: 1 }}>
                                {sort?.dir === "asc" ? "↑" : "↓"}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                    <Box component="th" sx={{
                      padding: "10px 14px", borderBottom: "1px solid var(--border)",
                      background: "var(--s2)",
                    }} />
                  </Box>
                </Box>
              </Box>
              <Box sx={{ flex: 1, overflowY: "auto" }}>
                <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <Box component="colgroup">
                    {(["37%","11%","15%","15%","13%","9%"] as const).map((w, i) => (
                      <Box key={i} component="col" sx={{ width: w }} />
                    ))}
                  </Box>
                  <Box component="tbody">
                    {paged.map((project) => (
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
              </>
            )}
            <Pagination page={page} totalPages={totalPages} total={filtered.length} onChange={setPage} />
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


const ProjectRow: React.FC<{
  project: ProjectDto;
  onEdit: () => void;
  onDelete: () => void;
  onScan: () => void;
  isScanning: boolean;
}> = ({ project, onEdit, onDelete, onScan, isScanning }) => {
  const navigate = useNavigate();
  const color = gradeColor(project.healthGrade);

  return (
    <Box
      component="tr"
      onClick={() => navigate(`/projects/${project.id}`)}
      sx={{
        cursor: "pointer",
        position: "relative",
        transition: "background 0.1s",
        "& td": { transition: "background 0.1s" },
        "&:hover td": { background: "var(--s2)" },
        "&:hover .row-actions": { opacity: "1 !important" },
      }}
    >
      {/* Nom */}
      <Box
        component="td"
        sx={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          fontSize: "12.5px",
          maxWidth: "260px",
        }}
      >
        <Box sx={{
          fontFamily: "inherit",
          fontWeight: 500,
          color: "var(--text)",
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {project.name}
        </Box>
      </Box>

      {/* Grade */}
      <Box component="td" sx={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
        <Box sx={{
          px: "6px", py: "2px",
          background: `${color}18`, border: `1px solid ${color}35`,
          borderRadius: "5px", fontSize: "11px", fontWeight: 800, color,
          letterSpacing: "0.04em", display: "inline-flex", width: "fit-content",
          fontFamily: "var(--font-mono)",
        }}>
          {project.healthGrade}
        </Box>
      </Box>

      {/* Total dépendances */}
      <Box component="td" sx={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text)", fontWeight: 400 }}>
        {project.totalDependencies}
      </Box>

      {/* Vulnérables */}
      <Box component="td" sx={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: project.vulnerableDependencies > 0 ? 600 : 400, color: project.vulnerableDependencies > 0 ? "var(--orange)" : "var(--muted)" }}>
        {project.vulnerableDependencies > 0 ? project.vulnerableDependencies : "—"}
      </Box>

      {/* Critiques */}
      <Box component="td" sx={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: project.criticalVulnerabilities > 0 ? 600 : 400, color: project.criticalVulnerabilities > 0 ? "var(--red)" : "var(--muted)" }}>
        {project.criticalVulnerabilities > 0 ? project.criticalVulnerabilities : "—"}
      </Box>

      {/* Actions */}
      <Box component="td" onClick={(e: React.MouseEvent) => e.stopPropagation()} sx={{ padding: "10px 2px 10px 0", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", overflow: "hidden", textAlign: "center" }}>
        <RowActions actions={[
          { icon: <RefreshOutlined sx={{ fontSize: 13, animation: isScanning ? "spin 1s linear infinite" : "none" }} />, label: "Lancer un scan", onClick: (e) => { e.stopPropagation(); onScan(); }, color: "yellow", disabled: isScanning },
          { icon: <EditOutlined sx={{ fontSize: 13 }} />, label: "Modifier", onClick: (e) => { e.stopPropagation(); onEdit(); }, color: "accent" },
          { icon: <DeleteOutlineOutlined sx={{ fontSize: 13 }} />, label: "Supprimer", onClick: (e) => { e.stopPropagation(); onDelete(); }, color: "red" },
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
