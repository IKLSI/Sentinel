import React, { useState, useEffect, useCallback } from "react";
import { Topbar } from "../../../layouts/Topbar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import { AppModal } from "../../../components/AppModal";
import { useToast } from "../../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import ArrowUpwardOutlined from "@mui/icons-material/ArrowUpwardOutlined";
import ArrowDownwardOutlined from "@mui/icons-material/ArrowDownwardOutlined";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  ProjectDto,
} from "../../techHealth/api/projects";

type SortKey = "name" | "healthScore" | "totalDependencies" | "vulnerableDependencies" | "criticalVulnerabilities";
type SortDir = "asc" | "desc";

const gradeColor = (grade: string) => {
  switch (grade) {
    case "A": return "#22c55e";
    case "B": return "#10b981";
    case "C": return "#f59e0b";
    case "D": return "#f97316";
    default:  return "#ef4444";
  }
};

export const ProjectsPage: React.FC = () => {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>({ key: "healthScore", dir: "asc" });
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

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const totalCritical = projects.reduce((s, p) => s + p.criticalVulnerabilities, 0);
  const avgScore = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + p.healthScore, 0) / projects.length)
    : 0;

  const filtered = projects
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!sort) return 0;
      const va = a[sort.key];
      const vb = b[sort.key];
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sort.dir === "asc" ? cmp : -cmp;
    });

  return (
    <>
      <Topbar title="" />
      {loading ? (
        <Box className="d-flex justify-content-center align-items-center" sx={{ height: "calc(100vh - 56px)" }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Box sx={{ p: "24px 28px" }}>
          <Box className="d-flex gap-2 flex-wrap mb-3">
            <KpiCard label="Projets" value={projects.length} suffix="" />
            <KpiCard
              label="Vulnérabilités critiques"
              value={totalCritical}
              suffix=""
              color={totalCritical > 0 ? "var(--red)" : undefined}
            />
            <KpiCard label="Score santé moyen" value={avgScore} suffix="%" />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "16px" }}>
            <Box
              sx={{
                width: "320px",
                display: "flex", alignItems: "center", gap: "8px",
                background: "var(--s1)", border: "1px solid var(--border)",
                borderRadius: "9px", px: "10px", height: "32px",
                transition: "border-color 0.15s, box-shadow 0.15s",
                "&:focus-within": { borderColor: "var(--accent-border)", boxShadow: "0 0 0 3px rgba(99,102,241,0.08)" },
              }}
            >
              <SearchOutlined sx={{ color: "var(--muted)", fontSize: "14px", flexShrink: 0 }} />
              <Box
                component="input"
                type="text"
                placeholder="Rechercher un projet..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                sx={{
                  all: "unset", flex: 1, fontSize: "12.5px",
                  color: "var(--text)",
                  "&::placeholder": { color: "var(--muted)" },
                }}
              />
            </Box>
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: "none", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
              onClick={openModal}
            >
              <AddOutlined sx={{ fontSize: 14 }} />
              Nouveau projet
            </Button>
          </Box>

          <Box
            sx={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 110px 130px 130px 130px 72px",
                px: "20px",
                py: "10px",
                borderBottom: "1px solid var(--border)",
                background: "var(--s2)",
              }}
            >
              {(
                [
                  { key: "name", label: "Nom" },
                  { key: "healthScore", label: "Score" },
                  { key: "totalDependencies", label: "Dépendances" },
                  { key: "vulnerableDependencies", label: "Vulnérables" },
                  { key: "criticalVulnerabilities", label: "Critiques" },
                ] as { key: SortKey; label: string }[]
              ).map(({ key, label }) => (
                <Box
                  key={key}
                  onClick={() => toggleSort(key)}
                  sx={{
                    display: "flex", alignItems: "center", gap: "4px",
                    fontSize: "11px", fontWeight: 600,
                    color: sort?.key === key ? "var(--accent)" : "var(--muted)",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    cursor: "pointer", userSelect: "none",
                    "&:hover": { color: "var(--text)" },
                  }}
                >
                  {label}
                  {sort?.key === key ? (
                    sort.dir === "asc"
                      ? <ArrowUpwardOutlined sx={{ fontSize: 11 }} />
                      : <ArrowDownwardOutlined sx={{ fontSize: 11 }} />
                  ) : null}
                </Box>
              ))}
              <Box />
            </Box>

            {filtered.length === 0 ? (
              <Box sx={{ py: "56px", textAlign: "center" }}>
                <Box className="empty-state">
                  <Box className="empty-state-icon">
                    <AccountTreeOutlined sx={{ fontSize: 40 }} />
                  </Box>
                  <Box className="empty-state-title">Aucun projet trouvé</Box>
                  <Box className="empty-state-subtitle">
                    {projects.length === 0 ? "Créez votre premier projet" : "Modifiez votre recherche"}
                  </Box>
                </Box>
              </Box>
            ) : (
              filtered.map((project, i) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  last={i === filtered.length - 1}
                  onEdit={() => openEdit(project)}
                  onDelete={() => setDeleteTarget(project)}
                />
              ))
            )}
          </Box>
        </Box>
      )}

      <AppModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nouveau projet"
        actions={
          <>
            <Button variant="outlined" size="small" sx={{ textTransform: "none" }} onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button
              variant="contained" size="small" sx={{ textTransform: "none" }}
              onClick={handleSubmit} disabled={!formName.trim() || submitting}
            >
              {submitting ? "Création..." : "Créer"}
            </Button>
          </>
        }
      >
        <Box className="d-flex flex-column" sx={{ gap: "14px" }}>
          <ModalField label="Nom du projet *" placeholder="Ex : API Paiement v2" value={formName} onChange={setFormName} autoFocus />
          <ModalField label="URL dépôt (optionnel)" placeholder="https://github.com/org/repo" value={formRepoUrl} onChange={setFormRepoUrl} />
        </Box>
      </AppModal>

      <AppModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Modifier le projet"
        actions={
          <>
            <Button variant="outlined" size="small" sx={{ textTransform: "none" }} onClick={() => setEditTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="contained" size="small" sx={{ textTransform: "none" }}
              onClick={handleEdit} disabled={!editName.trim() || editSaving}
            >
              {editSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </>
        }
      >
        <Box className="d-flex flex-column" sx={{ gap: "14px" }}>
          <ModalField label="Nom du projet *" value={editName} onChange={setEditName} />
          <ModalField label="URL dépôt (optionnel)" placeholder="https://github.com/org/repo" value={editRepoUrl} onChange={setEditRepoUrl} />
        </Box>
      </AppModal>

      <AppModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le projet"
        actions={
          <>
            <Button variant="outlined" size="small" sx={{ textTransform: "none" }} onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="contained" color="error" size="small" sx={{ textTransform: "none" }}
              onClick={handleDelete} disabled={deleting}
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </>
        }
      >
        <Box component="p" sx={{ margin: 0, fontSize: "14px", color: "var(--text)" }}>
          Supprimer <strong>{deleteTarget?.name}</strong> ? Cette action supprimera aussi toutes les
          dépendances et vulnérabilités associées. Elle est irréversible.
        </Box>
      </AppModal>
    </>
  );
};

const ProjectRow: React.FC<{
  project: ProjectDto;
  last: boolean;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ project, last, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const color = gradeColor(project.healthGrade);

  return (
    <Box
      onClick={() => navigate(`/projects/${project.id}`)}
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 110px 130px 130px 130px 72px",
        px: "20px",
        py: "14px",
        alignItems: "center",
        cursor: "pointer",
        borderBottom: last ? "none" : "1px solid var(--border)",
        transition: "background 0.1s",
        "&:hover": { background: "var(--s2)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.name}
          </Box>
          {project.repositoryUrl && (
            <Box sx={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", mt: "1px" }}>
              {project.repositoryUrl}
            </Box>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          px: "6px", py: "2px",
          background: `${color}18`,
          border: `1px solid ${color}40`,
          borderRadius: "5px",
          fontSize: "12px", fontWeight: 700,
          color,
          letterSpacing: "0.02em",
          display: "inline-flex",
          width: "fit-content",
          alignSelf: "center",
        }}
      >
        {project.healthGrade}
      </Box>

      <Box sx={{ fontSize: "13px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
        {project.totalDependencies}
      </Box>

      <Box sx={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: project.vulnerableDependencies > 0 ? 600 : 400, color: project.vulnerableDependencies > 0 ? "var(--orange)" : "var(--text-secondary)" }}>
        {project.vulnerableDependencies > 0 ? `${project.vulnerableDependencies} ⚠` : project.vulnerableDependencies}
      </Box>

      <Box sx={{ fontSize: "13px", fontFamily: "var(--font-mono)", fontWeight: project.criticalVulnerabilities > 0 ? 600 : 400, color: project.criticalVulnerabilities > 0 ? "var(--red)" : "var(--text-secondary)" }}>
        {project.criticalVulnerabilities > 0 ? `${project.criticalVulnerabilities} ⚠` : project.criticalVulnerabilities}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <Box
          component="button"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(); }}
          title="Modifier"
          sx={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", p: "4px", borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", "&:hover": { color: "var(--accent)" } }}
        >
          <EditOutlined sx={{ fontSize: 14 }} />
        </Box>
        <Box
          component="button"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(); }}
          title="Supprimer"
          sx={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", p: "4px", borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", "&:hover": { color: "var(--red)" } }}
        >
          <DeleteOutlineOutlined sx={{ fontSize: 14 }} />
        </Box>
      </Box>
    </Box>
  );
};

const ModalField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }> = ({
  label, value, onChange, placeholder, autoFocus,
}) => (
  <Box>
    <Box component="label" sx={{ display: "block", fontSize: "11px", fontWeight: 600, mb: "5px", color: "var(--muted2)", letterSpacing: "0.04em" }}>
      {label}
    </Box>
    <Box
      component="input"
      autoFocus={autoFocus}
      type="text"
      placeholder={placeholder}
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

const KpiCard: React.FC<{ label: string; value: number; suffix: string; color?: string }> = ({ label, value, suffix, color }) => (
  <Box sx={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "20px 22px", boxShadow: "var(--shadow)", flex: 1 }}>
    <Box sx={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", mb: "12px" }}>
      {label}
    </Box>
    <Box sx={{ fontSize: "30px", fontWeight: 800, color: color ?? "var(--text)", letterSpacing: "-0.03em" }}>
      {value}
      <Box component="span" sx={{ fontSize: "16px", color: "var(--muted)", fontWeight: 400 }}>{suffix}</Box>
    </Box>
  </Box>
);
