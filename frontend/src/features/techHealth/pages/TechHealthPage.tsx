import React, { useEffect, useState } from "react";
import { Topbar } from "../../../layouts/Topbar";
import { StatusChip } from "../../../components/StatusChip";
import { HealthScoreCircle } from "../../../components/HealthScoreCircle";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import type { HealthGrade } from "../../../types";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import CancelOutlined from "@mui/icons-material/CancelOutlined";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import { getProjects, getProject, scanProject } from "../api/projects";
import type {
  ProjectDto,
  ProjectDetailDto,
  DependencyDto,
  VulnerabilityDto,
  RuntimeDto,
} from "../api/projects";

type DepStatus = "ok" | "minor" | "major" | "critical" | "eol";
type SeverityLevel = "critical" | "high" | "medium" | "low";

interface Dependency {
  name: string;
  installed: string;
  latest: string;
  type: "prod" | "dev";
  status: DepStatus;
  ecosystem: string;
}

interface EnvVersion {
  env: string;
  version: string;
  runtime: string;
  deployedAt: string;
  healthy: boolean;
}

interface Vuln {
  cve: string;
  severity: SeverityLevel;
  cvss: number;
  package: string;
  version: string;
  fixedIn: string;
  title: string;
}

function mapApiStatus(status: string): DepStatus {
  switch (status) {
    case "UpToDate":
      return "ok";
    case "MinorUpdate":
      return "minor";
    case "MajorUpdate":
      return "major";
    case "EOL":
      return "eol";
    case "Vulnerable":
      return "critical";
    default:
      return "ok";
  }
}

function mapDep(d: DependencyDto): Dependency {
  return {
    name: d.name,
    installed: d.currentVersion,
    latest: d.latestVersion ?? "—",
    type: d.type.toLowerCase() === "prod" ? "prod" : "dev",
    status: mapApiStatus(d.status),
    ecosystem: d.ecosystem.toLowerCase(),
  };
}

function mapVuln(
  v: VulnerabilityDto,
  depName: string,
  depVersion: string,
): Vuln {
  return {
    cve: v.cveId,
    severity: v.severity.toLowerCase() as SeverityLevel,
    cvss: v.cvssScore,
    package: depName,
    version: depVersion,
    fixedIn: v.fixedVersion ?? "N/A",
    title: v.description,
  };
}

function mapRuntime(r: RuntimeDto): EnvVersion {
  return {
    env: r.name,
    version: r.version || "—",
    runtime: r.isEol ? "Fin de vie" : "Actif",
    deployedAt: r.eolDate
      ? new Date(r.eolDate).toLocaleDateString("fr-FR")
      : "—",
    healthy: !r.isEol,
  };
}

function extractVulns(detail: ProjectDetailDto): Vuln[] {
  return detail.dependencies.flatMap((d) =>
    d.vulnerabilities.map((v) => mapVuln(v, d.name, d.currentVersion)),
  );
}

const STATUS_CONFIG: Record<
  DepStatus,
  {
    label: string;
    variant: "green" | "yellow" | "orange" | "red" | "purple";
    Icon: React.ElementType;
    color: string;
  }
> = {
  ok: {
    label: "À jour",
    variant: "green",
    Icon: CheckCircleOutlined,
    color: "var(--green)",
  },
  minor: {
    label: "Minor",
    variant: "yellow",
    Icon: ErrorOutlined,
    color: "var(--yellow)",
  },
  major: {
    label: "Major",
    variant: "orange",
    Icon: WarningAmberOutlined,
    color: "var(--orange)",
  },
  critical: {
    label: "Critique",
    variant: "red",
    Icon: CancelOutlined,
    color: "var(--red)",
  },
  eol: {
    label: "Fin de vie",
    variant: "purple",
    Icon: CancelOutlined,
    color: "var(--purple)",
  },
};

const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { label: string; color: string; bg: string }
> = {
  critical: { label: "CRITIQUE", color: "var(--red)", bg: "var(--red-subtle)" },
  high: { label: "HAUTE", color: "var(--orange)", bg: "var(--orange-subtle)" },
  medium: {
    label: "MOYENNE",
    color: "var(--yellow)",
    bg: "var(--yellow-subtle)",
  },
  low: { label: "FAIBLE", color: "var(--green)", bg: "var(--green-subtle)" },
};

const ProjectSummaryCard: React.FC<{
  project: ProjectDto;
  selected: boolean;
  onClick: () => void;
}> = ({ project, selected, onClick }) => {
  const criticalVulns = project.criticalVulnerabilities;
  const vulnerable = project.vulnerableDependencies;

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: selected ? "var(--accent-subtle)" : "var(--s1)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "var(--r)",
        padding: "14px 16px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontFamily: "var(--font-ui)",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "var(--border2)";
          e.currentTarget.style.background = "var(--s2)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "var(--s1)";
        }
      }}
    >
      <HealthScoreCircle
        score={project.healthScore}
        grade={project.healthGrade as HealthGrade}
        size={40}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {project.name}
        </div>
        <div
          style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}
        >
          {project.repositoryType}
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
          {criticalVulns > 0 && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 600,
                color: "var(--red)",
                background: "var(--red-subtle)",
                padding: "1px 5px",
                borderRadius: "3px",
              }}
            >
              {criticalVulns} CVE critique{criticalVulns > 1 ? "s" : ""}
            </span>
          )}
          {vulnerable > 0 && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                fontWeight: 600,
                color: "var(--muted2)",
                background: "var(--s3)",
                padding: "1px 5px",
                borderRadius: "3px",
              }}
            >
              {vulnerable} vulnérable{vulnerable > 1 ? "s" : ""}
            </span>
          )}
          {vulnerable === 0 && criticalVulns === 0 && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "var(--green)",
                background: "var(--green-subtle)",
                padding: "1px 5px",
                borderRadius: "3px",
              }}
            >
              ✓ Sain
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const DependenciesTable: React.FC<{ deps: Dependency[] }> = ({ deps }) => {
  const sorted = [...deps].sort((a, b) => {
    const order: DepStatus[] = ["critical", "eol", "major", "minor", "ok"];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });

  return (
    <div
      style={{
        borderRadius: "var(--r)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--s2)" }}>
            {[
              "Package",
              "Version installée",
              "Dernière version",
              "Écosystème",
              "Type",
              "État",
            ].map((h) => (
              <th
                key={h}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  textAlign: "left",
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--border)",
                  fontWeight: 500,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((dep, i) => {
            const cfg = STATUS_CONFIG[dep.status];
            const isCritical =
              dep.status === "critical" || dep.status === "eol";
            return (
              <tr
                key={`${dep.name}-${i}`}
                style={{
                  background: isCritical
                    ? `rgba(${dep.status === "critical" ? "239,68,68" : "168,85,247"},0.04)`
                    : "transparent",
                }}
              >
                <td
                  style={{
                    padding: "11px 16px",
                    borderBottom: "1px solid var(--border)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <InventoryOutlined
                      sx={{ fontSize: 13 }}
                      style={{ color: "var(--muted)", flexShrink: 0 }}
                    />
                    {dep.name}
                  </div>
                </td>
                <td
                  style={{
                    padding: "11px 16px",
                    borderBottom: "1px solid var(--border)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--muted2)",
                  }}
                >
                  {dep.installed}
                </td>
                <td
                  style={{
                    padding: "11px 16px",
                    borderBottom: "1px solid var(--border)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {dep.status !== "ok" && (
                      <cfg.Icon
                        sx={{ fontSize: 13 }}
                        style={{ color: cfg.color, flexShrink: 0 }}
                      />
                    )}
                    <span
                      style={{
                        color: dep.status === "ok" ? "var(--green)" : cfg.color,
                        fontWeight: dep.status !== "ok" ? 600 : 400,
                      }}
                    >
                      {dep.latest}
                    </span>
                  </div>
                </td>
                <td
                  style={{
                    padding: "11px 16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--muted)",
                      background: "var(--s3)",
                      padding: "2px 7px",
                      borderRadius: "3px",
                    }}
                  >
                    {dep.ecosystem}
                  </span>
                </td>
                <td
                  style={{
                    padding: "11px 16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <StatusChip variant={dep.type === "prod" ? "blue" : "gray"}>
                    {dep.type === "prod" ? "Production" : "Dev"}
                  </StatusChip>
                </td>
                <td
                  style={{
                    padding: "11px 16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <StatusChip variant={cfg.variant}>{cfg.label}</StatusChip>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const VersionsGrid: React.FC<{ envs: EnvVersion[] }> = ({ envs }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${Math.min(envs.length, 3)}, 1fr)`,
      gap: "12px",
    }}
  >
    {envs.map((env) => (
      <div
        key={env.env}
        style={{
          background: "var(--s1)",
          border: `1px solid ${env.healthy ? "var(--border)" : "rgba(239,68,68,0.3)"}`,
          borderRadius: "var(--r)",
          padding: "16px 18px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: env.healthy ? "var(--accent)" : "var(--red)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <StorageOutlined sx={{ fontSize: 14 }} style={{ color: "var(--muted)" }} />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {env.env}
          </span>
          <div
            style={{
              marginLeft: "auto",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: env.healthy ? "var(--green)" : "var(--red)",
              boxShadow: `0 0 6px ${env.healthy ? "var(--green)" : "var(--red)"}`,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "22px",
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            marginBottom: "8px",
          }}
        >
          {env.version}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
            <span
              style={{
                color: "var(--muted2)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
              }}
            >
              {env.runtime}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              color: "var(--muted)",
            }}
          >
            <AccessTimeOutlined sx={{ fontSize: 10 }} />
            {env.deployedAt}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const VulnsSection: React.FC<{ vulns: Vuln[] }> = ({ vulns }) => {
  if (vulns.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "16px 18px",
          background: "var(--green-subtle)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: "var(--r)",
        }}
      >
        <CheckCircleOutlined
          sx={{ fontSize: 16 }}
          style={{ color: "var(--green)", flexShrink: 0 }}
        />
        <span
          style={{ fontSize: "13px", color: "var(--green)", fontWeight: 500 }}
        >
          Aucune vulnérabilité CVE détectée sur ce projet.
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {vulns.map((vuln, i) => {
        const cfg = SEVERITY_CONFIG[vuln.severity] ?? SEVERITY_CONFIG.medium;
        return (
          <div
            key={`${vuln.cve}-${i}`}
            style={{
              background: "var(--s1)",
              border: `1px solid var(--border)`,
              borderLeft: `3px solid ${cfg.color}`,
              borderRadius: "var(--r)",
              padding: "14px 16px",
              display: "flex",
              gap: "14px",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                minWidth: "64px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "var(--r-sm)",
                  background: cfg.bg,
                  color: cfg.color,
                  letterSpacing: "0.05em",
                }}
              >
                {cfg.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: cfg.color,
                }}
              >
                {vuln.cvss.toFixed(1)}
              </span>
              <span style={{ fontSize: "9px", color: "var(--muted)" }}>
                CVSS
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "5px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {vuln.title}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--cyan)",
                    background: "var(--cyan-subtle)",
                    padding: "2px 6px",
                    borderRadius: "3px",
                  }}
                >
                  {vuln.cve}
                </span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--muted)",
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  Package :{" "}
                  <code
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-secondary)",
                      fontSize: "11px",
                    }}
                  >
                    {vuln.package}@{vuln.version}
                  </code>
                </span>
                <span>
                  Correction :{" "}
                  <code
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--green)",
                      fontSize: "11px",
                    }}
                  >
                    {vuln.fixedIn}
                  </code>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const TechHealthPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] =
    useState<ProjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProjects()
      .then(async (list) => {
        if (cancelled) return;
        setProjects(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
          const detail = await getProject(list[0].id);
          if (!cancelled) {
            setSelectedProject(detail);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectProject = async (id: string) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setSelectedProject(null);
    try {
      const detail = await getProject(id);
      setSelectedProject(detail);
    } catch {}
  };

  const handleScan = async () => {
    if (!selectedId || scanning) return;
    setScanning(true);
    try {
      const updated = await scanProject(selectedId);
      setSelectedProject(updated);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedId
            ? {
                ...p,
                healthScore: updated.healthScore,
                healthGrade: updated.healthGrade,
                criticalVulnerabilities: updated.criticalVulnerabilities,
                vulnerableDependencies: updated.vulnerableDependencies,
                totalDependencies: updated.totalDependencies,
              }
            : p,
        ),
      );
    } catch {}
    setScanning(false);
  };

  const deps = selectedProject ? selectedProject.dependencies.map(mapDep) : [];
  const vulns = selectedProject ? extractVulns(selectedProject) : [];
  const runtimes = selectedProject
    ? selectedProject.runtimes.map(mapRuntime)
    : [];

  const criticalDeps = deps.filter(
    (d) => d.status === "critical" || d.status === "eol",
  ).length;
  const outdatedDeps = deps.filter((d) => d.status !== "ok").length;
  const upToDateDeps = deps.filter((d) => d.status === "ok").length;
  const criticalVulns = vulns.filter((v) => v.severity === "critical").length;

  if (loading) {
    return (
      <>
        <Topbar title="Santé technique" subtitle="Chargement…" />
        <Box
          sx={{
            p: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
          }}
        >
          <span style={{ color: "var(--muted)", fontSize: "14px" }}>
            Chargement des projets…
          </span>
        </Box>
      </>
    );
  }

  if (projects.length === 0) {
    return (
      <>
        <Topbar title="Santé technique" subtitle="0 projets" />
        <Box sx={{ p: "24px 28px" }}>
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
                <InventoryOutlined sx={{ fontSize: 40 }} />
              </div>
              <div className="empty-state-title">
                Aucun projet technique configuré
              </div>
              <div className="empty-state-subtitle">
                Ajoutez un projet pour lancer l'analyse
              </div>
            </div>
          </div>
        </Box>
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Santé technique"
        subtitle={`${projects.length} projet${projects.length > 1 ? "s" : ""} analysé${projects.length > 1 ? "s" : ""}`}
      />
      <Box sx={{ p: "24px 28px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              position: "sticky",
              top: "24px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "4px",
              }}
            >
              Projets
            </div>
            {projects.map((p) => (
              <ProjectSummaryCard
                key={p.id}
                project={p}
                selected={p.id === selectedId}
                onClick={() => handleSelectProject(p.id)}
              />
            ))}
          </div>

          {selectedProject == null ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "300px",
              }}
            >
              <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                Chargement…
              </span>
            </div>
          ) : (
            <div>
              <div
                style={{
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  padding: "20px 24px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                <HealthScoreCircle
                  score={selectedProject.healthScore}
                  grade={selectedProject.healthGrade as HealthGrade}
                  size={60}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "4px",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        margin: 0,
                      }}
                    >
                      {selectedProject.name}
                    </h2>
                    {selectedProject.repositoryUrl && (
                      <a
                        href={selectedProject.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "11px",
                          color: "var(--muted)",
                          textDecoration: "none",
                        }}
                      >
                        ↗ {selectedProject.repositoryType}
                      </a>
                    )}
                  </div>
                  <div
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    {runtimes.map((r) => (
                      <span
                        key={r.env}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          color: "var(--muted2)",
                          background: "var(--s3)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {r.env} {r.version}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    alignItems: "flex-end",
                  }}
                >
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      textTransform: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      opacity: scanning ? 0.7 : 1,
                    }}
                    onClick={handleScan}
                    disabled={scanning}
                  >
                    <RefreshOutlined
                      sx={{ fontSize: 13 }}
                      style={{
                        animation: scanning
                          ? "spin 1s linear infinite"
                          : "none",
                      }}
                    />
                    {scanning ? "Scan en cours…" : "Lancer un scan"}
                  </Button>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "12px",
                      textAlign: "center",
                    }}
                  >
                    <StatCell
                      label="À jour"
                      value={upToDateDeps}
                      color="var(--green)"
                    />
                    <StatCell
                      label="Obsolètes"
                      value={outdatedDeps - criticalDeps}
                      color="var(--orange)"
                    />
                    <StatCell
                      label="Critiques"
                      value={criticalDeps}
                      color="var(--red)"
                    />
                    <StatCell
                      label="CVE"
                      value={vulns.length}
                      color={criticalVulns > 0 ? "var(--red)" : "var(--muted2)"}
                    />
                  </div>
                </div>
              </div>

              {criticalVulns > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    background: "var(--red-subtle)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: "var(--r)",
                  }}
                >
                  <CancelOutlined
                    sx={{ fontSize: 15 }}
                    style={{ color: "var(--red)", flexShrink: 0 }}
                  />
                  <span
                    style={{ fontSize: "13px", color: "var(--text-secondary)" }}
                  >
                    <strong style={{ color: "var(--red)" }}>
                      {criticalVulns} vulnérabilité
                      {criticalVulns > 1 ? "s" : ""} critique
                      {criticalVulns > 1 ? "s" : ""}
                    </strong>{" "}
                    — signaler à l'équipe de développement du client.
                  </span>
                </div>
              )}

              <Section
                title="Librairies & Dépendances"
                count={deps.length}
                icon={<InventoryOutlined sx={{ fontSize: 14 }} />}
              >
                {deps.length > 0 ? (
                  <DependenciesTable deps={deps} />
                ) : (
                  <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                    Aucune dépendance — lancez un scan pour analyser le dépôt.
                  </span>
                )}
              </Section>

              {runtimes.length > 0 && (
                <Section
                  title="Runtimes détectés"
                  count={runtimes.length}
                  icon={<StorageOutlined sx={{ fontSize: 14 }} />}
                  style={{ marginTop: "16px" }}
                >
                  <VersionsGrid envs={runtimes} />
                </Section>
              )}

              <Section
                title="Vulnérabilités CVE"
                count={vulns.length}
                countColor={vulns.length > 0 ? "var(--red)" : "var(--green)"}
                icon={<WarningAmberOutlined sx={{ fontSize: 14 }} />}
                style={{ marginTop: "16px", marginBottom: "0" }}
              >
                <VulnsSection vulns={vulns} />
              </Section>
            </div>
          )}
        </div>
      </Box>
    </>
  );
};

const Section: React.FC<{
  title: string;
  count: number;
  icon: React.ReactNode;
  countColor?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ title, count, icon, countColor, style, children }) => (
  <div
    style={{
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r)",
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "var(--s2)",
      }}
    >
      <span style={{ color: "var(--muted)" }}>{icon}</span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
        {title}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          fontWeight: 600,
          color: countColor ?? "var(--muted)",
          marginLeft: "4px",
          background: "var(--s3)",
          padding: "1px 7px",
          borderRadius: "10px",
        }}
      >
        {count}
      </span>
    </div>
    <div style={{ padding: "16px 20px" }}>{children}</div>
  </div>
);

const StatCell: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div>
    <div
      style={{
        fontSize: "22px",
        fontWeight: 800,
        color,
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: "10px",
        color: "var(--muted)",
        marginTop: "3px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  </div>
);
