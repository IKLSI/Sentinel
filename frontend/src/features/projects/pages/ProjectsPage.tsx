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

const inputStyle: React.CSSProperties = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
  padding: "8px 12px",
  fontSize: "13px",
  color: "var(--text)",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "calc(100vh - 56px)",
          }}
        >
          <CircularProgress size={28} />
        </div>
      ) : (
        <Box sx={{ p: "24px 28px" }}>
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <KpiCard label="Projets" value={projects.length} suffix="" />
            <KpiCard
              label="Vulnérabilités critiques"
              value={totalCritical}
              suffix=""
              color={totalCritical > 0 ? "var(--red)" : undefined}
            />
            <KpiCard label="Score santé moyen" value={avgScore} suffix="%" />
          </Box>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
              <SearchOutlined
                sx={{ fontSize: 14 }}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted)",
                }}
              />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: "36px" }}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div
              style={{
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                padding: "48px",
                textAlign: "center",
              }}
            >
              <div className="empty-state">
                <div className="empty-state-icon">
                  <AccountTreeOutlined sx={{ fontSize: 40 }} />
                </div>
                <div className="empty-state-title">Aucun projet trouvé</div>
                <div className="empty-state-subtitle">
                  {projects.length === 0
                    ? "Créez votre premier projet"
                    : "Modifiez votre recherche"}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
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
            </div>
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Nom du projet *
              </label>
              <input
                style={inputStyle}
                type="text"
                placeholder="Ex : API Paiement v2"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                URL dépôt (optionnel)
              </label>
              <input
                style={inputStyle}
                type="text"
                placeholder="https://github.com/org/repo"
                value={formRepoUrl}
                onChange={(e) => setFormRepoUrl(e.target.value)}
              />
            </div>
          </div>
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Nom du projet *
              </label>
              <input
                style={inputStyle}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                URL dépôt (optionnel)
              </label>
              <input
                style={inputStyle}
                type="text"
                placeholder="https://github.com/org/repo"
                value={editRepoUrl}
                onChange={(e) => setEditRepoUrl(e.target.value)}
              />
            </div>
          </div>
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
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text)" }}>
            Supprimer <strong>{deleteTarget?.name}</strong> ? Cette action
            supprimera aussi toutes les dépendances et vulnérabilités associées.
            Elle est irréversible.
          </p>
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
    <div
      style={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onClick={() => navigate(`/projects/${project.id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent-border)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-0.01em",
                marginBottom: "4px",
              }}
            >
              {project.name}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HealthScoreCircle
              score={project.healthScore}
              grade={project.healthGrade as "A" | "B" | "C" | "D" | "F"}
              size={44}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Modifier"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                padding: "4px",
                borderRadius: "var(--r-sm)",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              <EditOutlined sx={{ fontSize: 14 }} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Supprimer"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                padding: "4px",
                borderRadius: "var(--r-sm)",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              <DeleteOutlineOutlined sx={{ fontSize: 14 }} />
            </button>
          </div>
        </div>

        {project.repositoryUrl && (
          <div
            style={{
              fontSize: "11px",
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              marginBottom: "12px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {project.repositoryUrl}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "16px",
            paddingTop: "14px",
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
        </div>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; warn?: boolean }> = ({
  label,
  value,
  warn,
}) => (
  <div>
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: "3px",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "18px",
        fontWeight: 700,
        color: warn ? "var(--orange)" : "var(--text)",
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </div>
  </div>
);

const KpiCard: React.FC<{
  label: string;
  value: number;
  suffix: string;
  color?: string;
}> = ({ label, value, suffix, color }) => (
  <div
    style={{
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r)",
      padding: "20px 22px",
      boxShadow: "var(--shadow)",
      flex: 1,
    }}
  >
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "var(--muted)",
        marginBottom: "12px",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "30px",
        fontWeight: 800,
        color: color ?? "var(--text)",
        letterSpacing: "-0.03em",
      }}
    >
      {value}
      <span
        style={{ fontSize: "16px", color: "var(--muted)", fontWeight: 400 }}
      >
        {suffix}
      </span>
    </div>
  </div>
);
