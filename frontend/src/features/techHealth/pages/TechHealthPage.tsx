import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../../../hooks/useToast";
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

const thSx = { fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", textAlign: "left", padding: "10px 10px", borderBottom: "1px solid var(--border)", fontWeight: 500 }
const tdBase = { padding: "10px 10px", borderBottom: "1px solid var(--border)" }

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
    <Box
      component="button"
      onClick={onClick}
      sx={{
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
        "&:hover": !selected ? {
          borderColor: "var(--border2)",
          background: "var(--s2)",
        } : {},
      }}
    >
      <HealthScoreCircle
        score={project.healthScore}
        grade={project.healthGrade as HealthGrade}
        size={40}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          className="text-truncate"
          sx={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}
        >
          {project.name}
        </Box>
        <Box sx={{ fontSize: "11px", color: "var(--muted)", mt: "2px" }}>
          {project.repositoryType}
        </Box>
        <Box className="d-flex" sx={{ gap: "8px", mt: "6px" }}>
          {criticalVulns > 0 && (
            <Box
              component="span"
              sx={{
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
            </Box>
          )}
          {vulnerable > 0 && (
            <Box
              component="span"
              sx={{
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
            </Box>
          )}
          {vulnerable === 0 && criticalVulns === 0 && (
            <Box
              component="span"
              sx={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "var(--green)",
                background: "var(--green-subtle)",
                padding: "1px 5px",
                borderRadius: "3px",
              }}
            >
              ✓ Sain
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const DependenciesTable: React.FC<{ deps: Dependency[] }> = ({ deps }) => {
  const sorted = [...deps].sort((a, b) => {
    const order: DepStatus[] = ["critical", "eol", "major", "minor", "ok"];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });

  return (
    <Box
      sx={{
        borderRadius: "var(--r)",
        border: "1px solid var(--border)",
        overflowX: "auto",
      }}
    >
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <Box component="colgroup">
          <Box component="col" sx={{ width: "auto" }} />
          <Box component="col" sx={{ width: "120px" }} />
          <Box component="col" sx={{ width: "130px" }} />
          <Box component="col" sx={{ width: "90px" }} />
          <Box component="col" sx={{ width: "85px" }} />
          <Box component="col" sx={{ width: "80px" }} />
        </Box>
        <Box component="thead">
          <Box component="tr" sx={{ background: "var(--s2)" }}>
            {[
              "Package",
              "Installée",
              "Dernière",
              "Éco.",
              "Type",
              "État",
            ].map((h) => (
              <Box component="th" key={h} sx={thSx}>
                {h}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {sorted.map((dep, i) => {
            const cfg = STATUS_CONFIG[dep.status];
            const isCritical =
              dep.status === "critical" || dep.status === "eol";
            return (
              <Box
                component="tr"
                key={`${dep.name}-${i}`}
                sx={{
                  background: isCritical
                    ? `rgba(${dep.status === "critical" ? "239,68,68" : "168,85,247"},0.04)`
                    : "transparent",
                }}
              >
                <Box component="td" sx={{ ...tdBase, fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                  <Box className="d-flex align-items-center" sx={{ gap: "6px" }}>
                    <InventoryOutlined
                      sx={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}
                    />
                    {dep.name}
                  </Box>
                </Box>
                <Box component="td" sx={{ ...tdBase, fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted2)" }}>
                  {dep.installed}
                </Box>
                <Box component="td" sx={{ ...tdBase, fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                  <Box className="d-flex align-items-center" sx={{ gap: "6px" }}>
                    {dep.status !== "ok" && (
                      <cfg.Icon
                        sx={{ fontSize: 13, color: cfg.color, flexShrink: 0 }}
                      />
                    )}
                    <Box component="span" sx={{ color: dep.status === "ok" ? "var(--green)" : cfg.color, fontWeight: dep.status !== "ok" ? 600 : 400 }}>
                      {dep.latest}
                    </Box>
                  </Box>
                </Box>
                <Box component="td" sx={tdBase}>
                  <Box
                    component="span"
                    sx={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--muted)",
                      background: "var(--s3)",
                      padding: "2px 7px",
                      borderRadius: "3px",
                    }}
                  >
                    {dep.ecosystem}
                  </Box>
                </Box>
                <Box component="td" sx={tdBase}>
                  <StatusChip variant={dep.type === "prod" ? "blue" : "gray"}>
                    {dep.type === "prod" ? "Production" : "Dev"}
                  </StatusChip>
                </Box>
                <Box component="td" sx={tdBase}>
                  <StatusChip variant={cfg.variant}>{cfg.label}</StatusChip>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

const VersionsGrid: React.FC<{ envs: EnvVersion[] }> = ({ envs }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: `repeat(${Math.min(envs.length, 3)}, 1fr)`,
      gap: "12px",
    }}
  >
    {envs.map((env) => (
      <Box
        key={env.env}
        sx={{
          background: "var(--s1)",
          border: `1px solid ${env.healthy ? "var(--border)" : "rgba(239,68,68,0.3)"}`,
          borderRadius: "var(--r)",
          padding: "16px 18px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: env.healthy ? "var(--accent)" : "var(--red)",
          }}
        />
        <Box className="d-flex align-items-center" sx={{ gap: "8px", mb: "12px" }}>
          <StorageOutlined sx={{ fontSize: 14, color: "var(--muted)" }} />
          <Box
            component="span"
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {env.env}
          </Box>
          <Box
            sx={{
              ml: "auto",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: env.healthy ? "var(--green)" : "var(--red)",
              boxShadow: `0 0 6px ${env.healthy ? "var(--green)" : "var(--red)"}`,
            }}
          />
        </Box>
        <Box
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "22px",
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            mb: "8px",
          }}
        >
          {env.version}
        </Box>
        <Box className="d-flex flex-column" sx={{ gap: "4px" }}>
          <Box sx={{ fontSize: "12px", color: "var(--muted)" }}>
            <Box
              component="span"
              sx={{
                color: "var(--muted2)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
              }}
            >
              {env.runtime}
            </Box>
          </Box>
          <Box className="d-flex align-items-center" sx={{ gap: "4px", fontSize: "11px", color: "var(--muted)" }}>
            <AccessTimeOutlined sx={{ fontSize: 10 }} />
            {env.deployedAt}
          </Box>
        </Box>
      </Box>
    ))}
  </Box>
);

const VulnsSection: React.FC<{ vulns: Vuln[] }> = ({ vulns }) => {
  if (vulns.length === 0) {
    return (
      <Box
        className="d-flex align-items-center"
        sx={{
          gap: "10px",
          padding: "16px 18px",
          background: "var(--green-subtle)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: "var(--r)",
        }}
      >
        <CheckCircleOutlined
          sx={{ fontSize: 16, color: "var(--green)", flexShrink: 0 }}
        />
        <Box
          component="span"
          sx={{ fontSize: "13px", color: "var(--green)", fontWeight: 500 }}
        >
          Aucune vulnérabilité CVE détectée sur ce projet.
        </Box>
      </Box>
    );
  }

  return (
    <Box className="d-flex flex-column" sx={{ gap: "8px" }}>
      {vulns.map((vuln, i) => {
        const cfg = SEVERITY_CONFIG[vuln.severity] ?? SEVERITY_CONFIG.medium;
        return (
          <Box
            key={`${vuln.cve}-${i}`}
            sx={{
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
            <Box
              className="d-flex flex-column align-items-center flex-shrink-0"
              sx={{ gap: "4px", minWidth: "64px" }}
            >
              <Box
                component="span"
                sx={{
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
              </Box>
              <Box
                component="span"
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: cfg.color,
                }}
              >
                {vuln.cvss.toFixed(1)}
              </Box>
              <Box component="span" sx={{ fontSize: "9px", color: "var(--muted)" }}>
                CVSS
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                className="d-flex align-items-center flex-wrap"
                sx={{ gap: "8px", mb: "5px" }}
              >
                <Box
                  component="span"
                  sx={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}
                >
                  {vuln.title}
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--cyan)",
                    background: "var(--cyan-subtle)",
                    padding: "2px 6px",
                    borderRadius: "3px",
                  }}
                >
                  {vuln.cve}
                </Box>
              </Box>
              <Box
                className="d-flex flex-wrap"
                sx={{ fontSize: "12px", color: "var(--muted)", gap: "16px" }}
              >
                <Box component="span">
                  Package :{" "}
                  <Box component="code" sx={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontSize: "11px" }}>
                    {vuln.package}@{vuln.version}
                  </Box>
                </Box>
                <Box component="span">
                  Correction :{" "}
                  <Box component="code" sx={{ fontFamily: "var(--font-mono)", color: "var(--green)", fontSize: "11px" }}>
                    {vuln.fixedIn}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export const TechHealthPage: React.FC = () => {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] =
    useState<ProjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const scanPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scanPollRef.current) clearTimeout(scanPollRef.current);
    };
  }, []);

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
    const scannedId = selectedId;
    const previousLastScanAt = selectedProject?.lastScanAt;
    const deadline = Date.now() + 10 * 60 * 1000;

    try {
      await scanProject(scannedId);
      showToast("Scan lancé, analyse en cours…", "info");

      const poll = async () => {
        if (Date.now() > deadline) {
          setScanning(false);
          showToast("Timeout : le scan prend plus de temps que prévu", "warning");
          return;
        }
        try {
          const updated = await getProject(scannedId);
          if (updated.lastScanAt !== previousLastScanAt) {
            setSelectedProject(updated);
            setProjects((prev) =>
              prev.map((p) =>
                p.id === scannedId
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
            setScanning(false);
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
      setScanning(false);
    }
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

        <Box
          className="d-flex align-items-center justify-content-center"
          sx={{ p: "24px 28px", minHeight: "300px" }}
        >
          <Box component="span" sx={{ color: "var(--muted)", fontSize: "14px" }}>
            Chargement des projets…
          </Box>
        </Box>
      </>
    );
  }

  if (projects.length === 0) {
    return (
      <>

        <Box sx={{ p: "36px 28px 24px" }}>
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
                <InventoryOutlined sx={{ fontSize: 40 }} />
              </Box>
              <Box className="empty-state-title">
                Aucun projet technique configuré
              </Box>
              <Box className="empty-state-subtitle">
                Ajoutez un projet pour lancer l'analyse
              </Box>
            </Box>
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>

      <Box className="page-enter" sx={{ p: "36px 28px 24px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: "20px",
            alignItems: "start",
            minWidth: 0,
          }}
        >
          <Box
            className="d-flex flex-column"
            sx={{ gap: "8px", position: "sticky", top: "24px" }}
          >
            {projects.map((p) => (
              <ProjectSummaryCard
                key={p.id}
                project={p}
                selected={p.id === selectedId}
                onClick={() => handleSelectProject(p.id)}
              />
            ))}
          </Box>

          {selectedProject == null ? (
            <Box
              className="d-flex align-items-center justify-content-center"
              sx={{ minHeight: "300px" }}
            >

              <Box component="span" sx={{ color: "var(--muted)", fontSize: "14px" }}>
                Chargement…
              </Box>
            </Box>
          ) : (
            <Box sx={{ minWidth: 0, overflow: "hidden" }}>

              <Box
                className="d-flex align-items-center"
                sx={{
                  background: "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  padding: "20px 24px",
                  mb: "16px",
                  gap: "20px",
                }}
              >
                <HealthScoreCircle
                  score={selectedProject.healthScore}
                  grade={selectedProject.healthGrade as HealthGrade}
                  size={60}
                />
                <Box sx={{ flex: 1 }}>
                  <Box className="d-flex align-items-center" sx={{ gap: "10px", mb: "4px" }}>
                    <Box component="h2" sx={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", m: 0 }}>
                      {selectedProject.name}
                    </Box>
                    {selectedProject.repositoryUrl && (
                      <Box
                        component="a"
                        href={selectedProject.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          fontSize: "11px",
                          color: "var(--muted)",
                          textDecoration: "none",
                        }}
                      >
                        ↗ {selectedProject.repositoryType}
                      </Box>
                    )}
                  </Box>
                  <Box className="d-flex flex-wrap" sx={{ gap: "8px" }}>
                    {runtimes.map((r) => (
                      <Box
                        key={r.env}
                        component="span"
                        sx={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          color: "var(--muted2)",
                          background: "var(--s3)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {r.env} {r.version}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box className="d-flex flex-column align-items-end" sx={{ gap: "12px" }}>
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
                      sx={{
                        fontSize: 13,
                        animation: scanning ? "spin 1s linear infinite" : "none",
                      }}
                    />
                    {scanning ? "Scan en cours…" : "Lancer un scan"}
                  </Button>
                  <Box
                    sx={{
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
                  </Box>
                </Box>
              </Box>

              {criticalVulns > 0 && (
                <Box
                  className="d-flex align-items-center"
                  sx={{
                    gap: "10px",
                    padding: "12px 16px",
                    mb: "16px",
                    background: "var(--red-subtle)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: "var(--r)",
                  }}
                >
                  <CancelOutlined
                    sx={{ fontSize: 15, color: "var(--red)", flexShrink: 0 }}
                  />
                  <Box component="span" sx={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    <Box component="strong" sx={{ color: "var(--red)" }}>
                      {criticalVulns} vulnérabilité
                      {criticalVulns > 1 ? "s" : ""} critique
                      {criticalVulns > 1 ? "s" : ""}
                    </Box>
                  </Box>
                </Box>
              )}

              <Section
                title="Librairies & Dépendances"
                count={deps.length}
                icon={<InventoryOutlined sx={{ fontSize: 14 }} />}
              >
                {deps.length > 0 ? (
                  <DependenciesTable deps={deps} />
                ) : (
                  <Box component="span" sx={{ fontSize: "13px", color: "var(--muted)" }}>
                    Aucune dépendance — lancez un scan pour analyser le dépôt.
                  </Box>
                )}
              </Section>

              {runtimes.length > 0 && (
                <Section
                  title="Runtimes détectés"
                  count={runtimes.length}
                  icon={<StorageOutlined sx={{ fontSize: 14 }} />}
                  sx={{ mt: "16px" }}
                >
                  <VersionsGrid envs={runtimes} />
                </Section>
              )}

              <Section
                title="Vulnérabilités CVE"
                count={vulns.length}
                countColor={vulns.length > 0 ? "var(--red)" : "var(--green)"}
                icon={<WarningAmberOutlined sx={{ fontSize: 14 }} />}
                sx={{ mt: "16px", mb: 0 }}
              >
                <VulnsSection vulns={vulns} />
              </Section>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

const Section: React.FC<{
  title: string;
  count: number;
  icon: React.ReactNode;
  countColor?: string;
  sx?: object;
  children: React.ReactNode;
}> = ({ title, count, icon, countColor, sx: sxProp, children }) => (
  <Box
    sx={{
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r)",
      overflow: "hidden",
      ...sxProp,
    }}
  >
    <Box
      className="d-flex align-items-center"
      sx={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        gap: "8px",
        background: "var(--s2)",
      }}
    >
      <Box component="span" sx={{ color: "var(--muted)" }}>{icon}</Box>
      <Box component="span" sx={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
        {title}
      </Box>
      <Box
        component="span"
        sx={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          fontWeight: 600,
          color: countColor ?? "var(--muted)",
          ml: "4px",
          background: "var(--s3)",
          padding: "1px 7px",
          borderRadius: "10px",
        }}
      >
        {count}
      </Box>
    </Box>
    <Box sx={{ padding: "16px 20px" }}>{children}</Box>
  </Box>
);

const StatCell: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <Box>
    <Box
      sx={{
        fontSize: "22px",
        fontWeight: 800,
        color,
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}
    >
      {value}
    </Box>
    <Box
      sx={{
        fontSize: "10px",
        color: "var(--muted)",
        mt: "3px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
  </Box>
);
