import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StatusChip } from "../../../components/StatusChip";
import { HealthScoreCircle } from "../../../components/HealthScoreCircle";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import { AppModal } from "../../../components/AppModal";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import { useToast } from "../../../hooks/useToast";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import {
  getProject,
  deleteProject,
  ProjectDetailDto,
  DependencyDto,
  VulnerabilityDto,
  RuntimeDto,
} from "../api/projects";

const DEP_STATUS: Record<
  string,
  { label: string; variant: "green" | "blue" | "orange" | "red" | "gray" }
> = {
  UpToDate: { label: "À jour", variant: "green" },
  MinorUpdate: { label: "Mise à jour", variant: "blue" },
  MajorUpdate: { label: "Majeure", variant: "orange" },
  Critical: { label: "Critique", variant: "red" },
  Eol: { label: "EOL", variant: "red" },
};

const SEV_VARIANT: Record<string, "red" | "orange" | "gray" | "blue"> = {
  Critical: "red",
  High: "orange",
  Medium: "blue",
  Low: "gray",
};

const SEV_LABEL: Record<string, string> = {
  Critical: "Critique",
  High: "Haute",
  Medium: "Moyen",
  Low: "Faible",
};

const thSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "9px",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--muted)",
  textAlign: "left",
  padding: "10px 16px",
  borderBottom: "1px solid var(--border)",
  background: "var(--s2)",
  fontWeight: 500,
};
const tdBase = {
  padding: "11px 16px",
  borderBottom: "1px solid var(--border)",
};

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [project, setProject] = useState<ProjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getProject(id);
      setProject(data);
    } catch {
      showToast("Impossible de charger le projet", "error");
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  }, [id, showToast, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      showToast("Projet supprimé", "success");
      navigate("/projects");
    } catch {
      showToast("Erreur lors de la suppression", "error");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box
        className="d-flex justify-content-center align-items-center"
        sx={{ height: "100vh" }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!project) return null;

  const allVulns = project.dependencies.flatMap((d) => d.vulnerabilities);
  const criticalVulns = allVulns.filter((v) => v.severity === "Critical");
  const highVulns = allVulns.filter((v) => v.severity === "High");

  return (
    <>


      <Box className="page-enter" sx={{ p: "24px 28px" }}>
        <Paper
          sx={{
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            mb: "24px",
          }}
        >
          <Box sx={{ p: "20px 24px" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                mb: "16px",
              }}
            >
              <Box>
                <Box
                  sx={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text)",
                    letterSpacing: "-0.01em",
                    mb: "6px",
                  }}
                >
                  {project.name}
                </Box>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  {project.repositoryUrl && (
                    <Box
                      className="d-flex align-items-center"
                      sx={{ gap: "6px" }}
                    >
                      <AccountTreeOutlined
                        sx={{ fontSize: 12, color: "var(--muted)" }}
                      />
                      <Box
                        component="span"
                        sx={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--muted2)",
                        }}
                      >
                        {project.repositoryUrl}
                      </Box>
                    </Box>
                  )}
                  {project.scanFrequency && (
                    <Box
                      className="d-flex align-items-center"
                      sx={{ gap: "6px" }}
                    >
                      <RefreshOutlined
                        sx={{ fontSize: 12, color: "var(--muted)" }}
                      />
                      <Box
                        component="span"
                        sx={{ fontSize: "11px", color: "var(--muted)" }}
                      >
                        Scan{" "}
                        {project.scanFrequency === "Daily"
                          ? "quotidien"
                          : "hebdomadaire"}
                      </Box>
                    </Box>
                  )}
                  {project.lastScanAt && (
                    <Box
                      className="d-flex align-items-center"
                      sx={{ gap: "6px" }}
                    >
                      <AccessTimeOutlined
                        sx={{ fontSize: 12, color: "var(--muted)" }}
                      />
                      <Box
                        component="span"
                        sx={{ fontSize: "11px", color: "var(--muted)" }}
                      >
                        {new Date(project.lastScanAt).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <HealthScoreCircle
                  score={project.healthScore}
                  grade={project.healthGrade as "A" | "B" | "C" | "D" | "F"}
                  size={52}
                />
              </Box>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                borderTop: "1px solid var(--border)",
                pt: "16px",
              }}
            >
              <StatCell
                label="Dépendances"
                value={project.totalDependencies}
                icon={<InventoryOutlined sx={{ fontSize: 16 }} />}
              />
              <StatCell
                label="Vulnérables"
                value={project.vulnerableDependencies}
                icon={<GppBadOutlined sx={{ fontSize: 16 }} />}
                warn={project.vulnerableDependencies > 0}
              />
              <StatCell
                label="Critiques"
                value={project.criticalVulnerabilities}
                icon={<GppBadOutlined sx={{ fontSize: 16 }} />}
                warn={project.criticalVulnerabilities > 0}
                danger
              />
              <StatCell
                label="Runtimes"
                value={project.runtimes.length}
                icon={<StorageOutlined sx={{ fontSize: 16 }} />}
              />
            </Box>
          </Box>
        </Paper>

        {(criticalVulns.length > 0 || highVulns.length > 0) && (
          <Box sx={{ mb: "24px" }}>
            <SectionTitle
              icon={<GppBadOutlined sx={{ fontSize: 14 }} />}
              label="Vulnérabilités"
              count={allVulns.length}
            />
            <Box className="d-flex flex-column" sx={{ gap: "8px" }}>
              {[...criticalVulns, ...highVulns].map((v) => (
                <VulnCard key={v.id} vuln={v} />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ mb: "24px" }}>
          <SectionTitle
            icon={<InventoryOutlined sx={{ fontSize: 14 }} />}
            label="Dépendances"
            count={project.dependencies.length}
          />
          <Paper
            sx={{
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Box sx={{ p: "0" }}>
              <Box
                component="table"
                sx={{ width: "100%", borderCollapse: "collapse" }}
              >
                <Box component="thead">
                  <Box component="tr">
                    {[
                      "Paquet",
                      "Écosystème",
                      "Type",
                      "Installée",
                      "Dernière",
                      "Statut",
                      "Vulnérabilités",
                    ].map((h) => (
                      <Box component="th" key={h} sx={thSx}>
                        {h}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {project.dependencies.map((d: DependencyDto) => {
                    const s = DEP_STATUS[d.status] ?? {
                      label: d.status,
                      variant: "gray" as const,
                    };
                    return (
                      <Box
                        component="tr"
                        key={d.id}
                        sx={{
                          "& td": { background: "transparent" },
                          "&:hover td": { background: "var(--s2)" },
                        }}
                      >
                        <Box
                          component="td"
                          sx={{
                            ...tdBase,
                            fontFamily: "var(--font-mono)",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {d.name}
                        </Box>
                        <Box
                          component="td"
                          sx={{
                            ...tdBase,
                            fontSize: "11px",
                            color: "var(--muted)",
                          }}
                        >
                          {d.ecosystem}
                        </Box>
                        <Box component="td" sx={tdBase}>
                          <StatusChip
                            variant={d.type === "Prod" ? "blue" : "gray"}
                          >
                            {d.type}
                          </StatusChip>
                        </Box>
                        <Box
                          component="td"
                          sx={{
                            ...tdBase,
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                          }}
                        >
                          {d.currentVersion}
                        </Box>
                        <Box
                          component="td"
                          sx={{
                            ...tdBase,
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color:
                              d.latestVersion &&
                              d.latestVersion !== d.currentVersion
                                ? "var(--orange)"
                                : "var(--muted)",
                          }}
                        >
                          {d.latestVersion ?? "—"}
                        </Box>
                        <Box component="td" sx={tdBase}>
                          <StatusChip variant={s.variant}>{s.label}</StatusChip>
                        </Box>
                        <Box component="td" sx={tdBase}>
                          {d.vulnerabilities.length > 0 ? (
                            <StatusChip variant="red">
                              {d.vulnerabilities.length}
                            </StatusChip>
                          ) : (
                            <Box
                              component="span"
                              sx={{ color: "var(--muted)", fontSize: "12px" }}
                            >
                              —
                            </Box>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        {project.runtimes.length > 0 && (
          <Box sx={{ mb: "24px" }}>
            <SectionTitle
              icon={<StorageOutlined sx={{ fontSize: 14 }} />}
              label="Runtimes"
              count={project.runtimes.length}
            />
            <Paper
              sx={{
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                mb: 2,
              }}
            >
              <Box sx={{ p: "0" }}>
                <Box
                  component="table"
                  sx={{ width: "100%", borderCollapse: "collapse" }}
                >
                  <Box component="thead">
                    <Box component="tr">
                      {["Runtime", "Version", "Fin de support", "Statut"].map(
                        (h) => (
                          <Box component="th" key={h} sx={thSx}>
                            {h}
                          </Box>
                        ),
                      )}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {project.runtimes.map((r: RuntimeDto) => (
                      <Box
                        component="tr"
                        key={r.id}
                        sx={{
                          "& td": { background: "transparent" },
                          "&:hover td": { background: "var(--s2)" },
                        }}
                      >
                        <Box component="td" sx={{ ...tdBase, fontWeight: 600 }}>
                          {r.name}
                        </Box>
                        <Box
                          component="td"
                          sx={{
                            ...tdBase,
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                          }}
                        >
                          {r.version}
                        </Box>
                        <Box component="td" sx={tdBase}>
                          {r.eolDate
                            ? new Date(r.eolDate).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </Box>
                        <Box component="td" sx={tdBase}>
                          {r.isEol ? (
                            <StatusChip variant="red">EOL</StatusChip>
                          ) : (
                            <StatusChip variant="green">Supporté</StatusChip>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>

      <AppModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer le projet"
        actions={
          <>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none" }}
              onClick={() => setShowDeleteModal(false)}
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
          </>
        }
      >
        <Box
          component="p"
          sx={{ margin: 0, fontSize: "14px", color: "var(--text)" }}
        >
          Supprimer <strong>{project.name}</strong> ? Cette action supprimera
          aussi toutes les dépendances et vulnérabilités associées. Elle est
          irréversible.
        </Box>
      </AppModal>
    </>
  );
};

const SectionTitle: React.FC<{
  icon: React.ReactNode;
  label: string;
  count: number;
}> = ({ icon, label, count }) => (
  <Box className="d-flex align-items-center" sx={{ gap: "8px", mb: "10px" }}>
    <Box component="span" sx={{ color: "var(--muted)", display: "flex" }}>
      {icon}
    </Box>
    <Box
      component="span"
      sx={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}
    >
      {label}
    </Box>
    <Box
      component="span"
      sx={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        fontWeight: 600,
        background: "var(--s3)",
        color: "var(--muted2)",
        padding: "1px 7px",
        borderRadius: "10px",
      }}
    >
      {count}
    </Box>
  </Box>
);

const StatCell: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  warn?: boolean;
  danger?: boolean;
}> = ({ label, value, icon, warn, danger }) => (
  <Box
    sx={{
      padding: "0 20px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: "6px",
    }}
  >
    <Box
      className="d-flex align-items-center"
      sx={{ gap: "6px", color: "var(--muted)" }}
    >
      {icon}
      <Box
        component="span"
        sx={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </Box>
    </Box>
    <Box
      sx={{
        fontSize: "28px",
        fontWeight: 800,
        color:
          danger && value > 0
            ? "var(--red)"
            : warn && value > 0
              ? "var(--orange)"
              : "var(--text)",
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </Box>
  </Box>
);

const VulnCard: React.FC<{ vuln: VulnerabilityDto }> = ({ vuln }) => (
  <Paper
    sx={{
      bgcolor: "background.paper",
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1,
      mb: 2,
    }}
  >
    <Box sx={{ p: "14px 18px" }}>
      <Box className="d-flex align-items-flex-start" sx={{ gap: "12px" }}>
        <StatusChip variant={SEV_VARIANT[vuln.severity] ?? "gray"}>
          {SEV_LABEL[vuln.severity] ?? vuln.severity}
        </StatusChip>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            className="d-flex align-items-center"
            sx={{ gap: "10px", mb: "4px" }}
          >
            <Box
              component="span"
              sx={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--muted)",
                fontWeight: 600,
              }}
            >
              {vuln.cveId}
            </Box>
            <Box
              component="span"
              sx={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--orange)",
                fontWeight: 700,
              }}
            >
              CVSS {vuln.cvssScore.toFixed(1)}
            </Box>
            {vuln.fixedVersion && (
              <Box
                component="span"
                sx={{ fontSize: "10px", color: "var(--green)" }}
              >
                Fix : {vuln.fixedVersion}
              </Box>
            )}
          </Box>
          <Box sx={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.4 }}>
            {vuln.description}
          </Box>
        </Box>
      </Box>
    </Box>
  </Paper>
);
