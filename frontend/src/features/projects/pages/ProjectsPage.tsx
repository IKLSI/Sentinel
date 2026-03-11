import React, { useState, useEffect, useCallback } from "react";
import { Topbar } from "../../../layouts/Topbar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { HealthScoreCircle } from "../../../components/HealthScoreCircle";
import { useToast } from "../../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  ProjectDto,
} from "../../techHealth/api/projects";

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

  useEffect(() => {
    load();
  }, [load]);

  const openModal = () => {
    setFormName("");
    setFormRepoUrl("");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    setSubmitting(true);
    try {
      await createProject({
        name: formName.trim(),
        repositoryUrl: formRepoUrl || undefined,
      });
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
      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
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

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalCritical = projects.reduce(
    (s, p) => s + p.criticalVulnerabilities,
    0,
  );
  const avgScore =
    projects.length > 0
      ? Math.round(
          projects.reduce((s, p) => s + p.healthScore, 0) / projects.length,
        )
      : 0;

  return (
    <>
      <Topbar
        title="Projets"
        subtitle={`${projects.length} projet${projects.length !== 1 ? "s" : ""}`}
        actions={
          <Button
            variant="contained"
            size="small"
            sx={{
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
            onClick={openModal}
          >
            <AddOutlined sx={{ fontSize: 14 }} />
            Nouveau projet
          </Button>
        }
      />
      {loading ? (
        <Box
          className="d-flex justify-content-center align-items-center"
          sx={{ height: "calc(100vh - 56px)" }}
        >
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

          <Box className="d-flex align-items-center gap-2" sx={{ mb: "20px" }}>
            <Box sx={{ position: "relative", flex: 1, maxWidth: "320px" }}>
              <SearchOutlined
                sx={{
                  fontSize: 14,
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted)",
                }}
              />
              <Box
                component="input"
                type="text"
                placeholder="Rechercher un projet..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                sx={{
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  px: "12px",
                  py: "8px",
                  pl: "36px",
                  fontSize: "13px",
                  color: "var(--text)",
                  width: "100%",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </Box>
          </Box>

          {filtered.length === 0 ? (
            <Box
              sx={{
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                padding: "48px",
                textAlign: "center",
              }}
            >
              <Box className="empty-state">
                <Box className="empty-state-icon">
                  <AccountTreeOutlined sx={{ fontSize: 40 }} />
                </Box>
                <Box className="empty-state-title">Aucun projet trouvé</Box>
                <Box className="empty-state-subtitle">
                  {projects.length === 0
                    ? "Créez votre premier projet"
                    : "Modifiez votre recherche"}
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "14px",
              }}
            >
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => openEdit(project)}
                  onDelete={() => setDeleteTarget(project)}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <DialogTitle sx={{ fontSize: "15px", fontWeight: 700, pb: 1 }}>
          Nouveau projet
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Box className="d-flex flex-column" sx={{ gap: "14px" }}>
            <Box>
              <Box
                component="label"
                sx={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  mb: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Nom du projet *
              </Box>
              <Box
                component="input"
                sx={{
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  px: "12px",
                  py: "8px",
                  fontSize: "13px",
                  color: "var(--text)",
                  width: "100%",
                  outline: "none",
                  fontFamily: "inherit",
                }}
                type="text"
                placeholder="Ex : API Paiement v2"
                value={formName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
              />
            </Box>
            <Box>
              <Box
                component="label"
                sx={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  mb: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                URL dépôt (optionnel)
              </Box>
              <Box
                component="input"
                sx={{
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  px: "12px",
                  py: "8px",
                  fontSize: "13px",
                  color: "var(--text)",
                  width: "100%",
                  outline: "none",
                  fontFamily: "inherit",
                }}
                type="text"
                placeholder="https://github.com/org/repo"
                value={formRepoUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormRepoUrl(e.target.value)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: "16px", pt: 0 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={() => setShowModal(false)}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={handleSubmit}
            disabled={!formName.trim() || submitting}
          >
            {submitting ? "Création..." : "Créer"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <DialogTitle sx={{ fontSize: "15px", fontWeight: 700, pb: 1 }}>
          Modifier le projet
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Box className="d-flex flex-column" sx={{ gap: "14px" }}>
            <Box>
              <Box
                component="label"
                sx={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  mb: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Nom du projet *
              </Box>
              <Box
                component="input"
                sx={{
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  px: "12px",
                  py: "8px",
                  fontSize: "13px",
                  color: "var(--text)",
                  width: "100%",
                  outline: "none",
                  fontFamily: "inherit",
                }}
                type="text"
                value={editName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
              />
            </Box>
            <Box>
              <Box
                component="label"
                sx={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  mb: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                URL dépôt (optionnel)
              </Box>
              <Box
                component="input"
                sx={{
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  px: "12px",
                  py: "8px",
                  fontSize: "13px",
                  color: "var(--text)",
                  width: "100%",
                  outline: "none",
                  fontFamily: "inherit",
                }}
                type="text"
                placeholder="https://github.com/org/repo"
                value={editRepoUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditRepoUrl(e.target.value)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: "16px", pt: 0 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={() => setEditTarget(null)}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={handleEdit}
            disabled={!editName.trim() || editSaving}
          >
            {editSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <DialogTitle sx={{ fontSize: "15px", fontWeight: 700, pb: 1 }}>
          Supprimer le projet
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Box component="p" sx={{ margin: 0, fontSize: "14px", color: "var(--text)" }}>
            Supprimer <strong>{deleteTarget?.name}</strong> ? Cette action
            supprimera aussi toutes les dépendances et vulnérabilités associées.
            Elle est irréversible.
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: "16px", pt: 0 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={() => setDeleteTarget(null)}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const ProjectCard: React.FC<{
  project: ProjectDto;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ project, onEdit, onDelete }) => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        "&:hover": {
          borderColor: "var(--accent-border)",
          boxShadow: "var(--shadow-md)",
        },
      }}
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <Box sx={{ p: "20px" }}>
        <Box
          className="d-flex align-items-start justify-content-between"
          sx={{ mb: "12px" }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-0.01em",
                mb: "4px",
              }}
            >
              {project.name}
            </Box>
          </Box>
          <Box className="d-flex align-items-center gap-2">
            <HealthScoreCircle
              score={project.healthScore}
              grade={project.healthGrade as "A" | "B" | "C" | "D" | "F"}
              size={44}
            />
            <Box
              component="button"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Modifier"
              sx={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                p: "4px",
                borderRadius: "var(--r-sm)",
                display: "flex",
                alignItems: "center",
                "&:hover": { color: "var(--accent)" },
              }}
            >
              <EditOutlined sx={{ fontSize: 14 }} />
            </Box>
            <Box
              component="button"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Supprimer"
              sx={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                p: "4px",
                borderRadius: "var(--r-sm)",
                display: "flex",
                alignItems: "center",
                "&:hover": { color: "var(--red)" },
              }}
            >
              <DeleteOutlineOutlined sx={{ fontSize: 14 }} />
            </Box>
          </Box>
        </Box>

        {project.repositoryUrl && (
          <Box
            sx={{
              fontSize: "11px",
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              mb: "12px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {project.repositoryUrl}
          </Box>
        )}

        <Box
          className="d-flex"
          sx={{
            gap: "16px",
            pt: "14px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <Stat label="Dépendances" value={project.totalDependencies} />
          <Stat
            label="Vulnérables"
            value={project.vulnerableDependencies}
            warn={project.vulnerableDependencies > 0}
          />
          <Stat
            label="Critiques"
            value={project.criticalVulnerabilities}
            warn={project.criticalVulnerabilities > 0}
          />
        </Box>
      </Box>
    </Box>
  );
};

const Stat: React.FC<{ label: string; value: number; warn?: boolean }> = ({
  label,
  value,
  warn,
}) => (
  <Box>
    <Box
      sx={{
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        mb: "3px",
      }}
    >
      {label}
    </Box>
    <Box
      sx={{
        fontSize: "18px",
        fontWeight: 700,
        color: warn ? "var(--orange)" : "var(--text)",
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </Box>
  </Box>
);

const KpiCard: React.FC<{
  label: string;
  value: number;
  suffix: string;
  color?: string;
}> = ({ label, value, suffix, color }) => (
  <Box
    sx={{
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r)",
      padding: "20px 22px",
      boxShadow: "var(--shadow)",
      flex: 1,
    }}
  >
    <Box
      sx={{
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "var(--muted)",
        mb: "12px",
      }}
    >
      {label}
    </Box>
    <Box
      sx={{
        fontSize: "30px",
        fontWeight: 800,
        color: color ?? "var(--text)",
        letterSpacing: "-0.03em",
      }}
    >
      {value}
      <Box
        component="span"
        sx={{ fontSize: "16px", color: "var(--muted)", fontWeight: 400 }}
      >
        {suffix}
      </Box>
    </Box>
  </Box>
);
