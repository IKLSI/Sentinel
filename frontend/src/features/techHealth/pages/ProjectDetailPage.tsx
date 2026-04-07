import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StatusChip } from "../../../components/StatusChip";
import { HealthScoreCircle } from "../../../components/HealthScoreCircle";
import Skeleton from "@mui/material/Skeleton";
import { DeleteModal } from "../../../components/DeleteModal";
import Box from "@mui/material/Box";
import { useToast } from "../../../hooks/useToast";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import GppBadOutlined from "@mui/icons-material/GppBadOutlined";
import StorageOutlined from "@mui/icons-material/StorageOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import {
  getProject,
  deleteProject,
  ProjectDetailDto,
  DependencyDto,
  VulnerabilityDto,
  RuntimeDto,
} from "../api/projects";

// ─── Constants ──────────────────────────────────────────────────────────────

const DEP_STATUS: Record<string, { label: string; variant: "green" | "blue" | "orange" | "red" | "gray" }> = {
  UpToDate:    { label: "À jour",       variant: "green"  },
  MinorUpdate: { label: "MAJ mineure",  variant: "blue"   },
  MajorUpdate: { label: "MAJ majeure",  variant: "orange" },
  EOL:         { label: "Fin de vie",   variant: "red"    },
  Vulnerable:  { label: "Vulnérable",   variant: "red"    },
};

const SEV_CONFIG: Record<string, { label: string; variant: "red" | "orange" | "blue" | "gray"; color: string; bg: string }> = {
  Critical: { label: "CRITIQUE", variant: "red",    color: "var(--red)",    bg: "var(--red-subtle)"    },
  High:     { label: "HAUTE",    variant: "orange", color: "var(--orange)", bg: "var(--orange-subtle)" },
  Medium:   { label: "MOYENNE",  variant: "blue",   color: "var(--yellow)", bg: "var(--yellow-subtle)" },
  Low:      { label: "FAIBLE",   variant: "gray",   color: "var(--green)",  bg: "var(--green-subtle)"  },
};

const EOL_COLOR: Record<string, { text: string; stripe: string; border: string }> = {
  eol:    { text: "var(--red)",    stripe: "var(--red)",    border: "rgba(239,68,68,0.3)"  },
  danger: { text: "var(--orange)", stripe: "var(--orange)", border: "rgba(249,115,22,0.25)"},
  warn:   { text: "var(--yellow)", stripe: "var(--yellow)", border: "rgba(234,179,8,0.25)" },
  ok:     { text: "var(--green)",  stripe: "var(--accent)", border: "var(--border)"        },
};


// ─── Helpers ────────────────────────────────────────────────────────────────

function getRuntimeUrgency(r: RuntimeDto): keyof typeof EOL_COLOR {
  if (!r.eolDate) return r.isEol ? "eol" : "ok";
  const days = Math.round((new Date(r.eolDate).getTime() - Date.now()) / 86400000);
  if (days < 0)   return "eol";
  if (days < 90)  return "danger";
  if (days < 180) return "warn";
  return "ok";
}

function getDaysLabel(r: RuntimeDto): string {
  if (!r.eolDate) return r.isEol ? "Expiré" : "—";
  const days = Math.round((new Date(r.eolDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return `Expiré depuis ${Math.abs(days)}j`;
  return `${days}j restants`;
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

interface TabDef { icon: React.ReactNode; label: string; count: number; accentColor?: string }

const TabBar: React.FC<{ tabs: TabDef[]; active: number; onChange: (i: number) => void }> = ({ tabs, active, onChange }) => (
  <Box sx={{ display: "flex", height: "100%" }}>
    {tabs.map((tab, i) => (
      <Box
        key={i}
        component="button"
        onClick={() => onChange(i)}
        sx={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          px: "16px",
          height: "100%",
          fontSize: "13px",
          fontWeight: active === i ? 600 : 400,
          color: active === i ? "var(--text)" : "var(--muted)",
          borderBottom: active === i ? "2px solid var(--accent)" : "2px solid transparent",
          marginBottom: "-1px",
          position: "relative",
          zIndex: 1,
          transition: "color 0.12s, border-color 0.12s",
          "&:hover": { color: "var(--text)" },
        }}
      >
        <Box sx={{ display: "flex", opacity: active === i ? 1 : 0.5, transition: "opacity 0.12s" }}>
          {tab.icon}
        </Box>
        {tab.label}
      </Box>
    ))}
  </Box>
);

// ─── Table styles ────────────────────────────────────────────────────────────

const TH: React.FC<{ children: React.ReactNode; width?: string }> = ({ children, width }) => (
  <Box
    component="th"
    sx={{
      fontFamily: "var(--font-mono)",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--muted)",
      textAlign: "left",
      padding: "10px 16px",
      background: "var(--s2)",
      borderBottom: "1px solid var(--border)",
      whiteSpace: "nowrap",
      width: width ?? "auto",
      position: "sticky",
      top: 0,
      zIndex: 1,
    }}
  >
    {children}
  </Box>
);

const TD: React.FC<{ children: React.ReactNode; mono?: boolean; muted?: boolean }> = ({ children, mono, muted }) => (
  <Box
    component="td"
    sx={{
      padding: "11px 16px",
      borderBottom: "1px solid var(--border)",
      fontSize: "13px",
      fontFamily: mono ? "var(--font-mono)" : "inherit",
      color: muted ? "var(--muted2)" : "var(--text)",
      verticalAlign: "middle",
    }}
  >
    {children}
  </Box>
);

const TR: React.FC<{ children: React.ReactNode; accent?: string }> = ({ children }) => (
  <Box
    component="tr"
    sx={{
      "&:last-child td": { borderBottom: "none" },
    }}
  >
    {children}
  </Box>
);

// ─── Vuln row ────────────────────────────────────────────────────────────────

const VulnRow: React.FC<{ vuln: VulnerabilityDto }> = ({ vuln }) => {
  const cfg = SEV_CONFIG[vuln.severity] ?? SEV_CONFIG.Low;
  return (
    <TR>
      <TD>
        <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, color: cfg.color }}>
          {vuln.cvssScore.toFixed(1)}
        </Box>
      </TD>
      <TD>{vuln.description}</TD>
      <TD>
        <Box
          component="span"
          sx={{
            fontFamily: "var(--font-mono)", fontSize: "10px",
            color: "var(--cyan)", background: "var(--cyan-subtle)",
            px: "7px", py: "3px", borderRadius: "3px",
          }}
        >
          {vuln.cveId}
        </Box>
      </TD>
      <TD>
        {vuln.fixedVersion
          ? <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted2)" }}>{vuln.fixedVersion}</Box>
          : <Box component="span" sx={{ color: "var(--muted)", fontSize: "12px" }}>—</Box>}
      </TD>
    </TR>
  );
};

// ─── Runtime row ─────────────────────────────────────────────────────────────

const RuntimeRow: React.FC<{ runtime: RuntimeDto }> = ({ runtime: r }) => {
  const urgency = getRuntimeUrgency(r);
  const uc = EOL_COLOR[urgency];
  const daysLabel = getDaysLabel(r);

  return (
    <TR accent={uc.stripe}>
      <TD>
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <StorageOutlined sx={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }} />
          <Box component="span" sx={{ fontSize: "13px", fontWeight: 600 }}>{r.name}</Box>
        </Box>
      </TD>
      <TD mono muted>{r.version}</TD>
      <TD>
        <Box component="span" sx={{ fontSize: "12px", color: uc.text, fontWeight: urgency !== "ok" ? 600 : 400 }}>
          {daysLabel}
        </Box>
      </TD>
    </TR>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [project, setProject] = useState<ProjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [depSearch, setDepSearch] = useState("");

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

  useEffect(() => { load(); }, [load]);

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

  const allVulns = useMemo(
    () => project?.dependencies.flatMap((d) => d.vulnerabilities) ?? [],
    [project]
  );

  const sortedVulns = useMemo(
    () => allVulns.slice().sort((a, b) => b.cvssScore - a.cvssScore),
    [allVulns]
  );

  const filteredDeps = useMemo(() => {
    if (!project) return [];
    if (!depSearch) return project.dependencies;
    return project.dependencies.filter((d) =>
      d.name.toLowerCase().includes(depSearch.toLowerCase())
    );
  }, [project, depSearch]);

  const depsToUpdate = useMemo(
    () => project?.dependencies.filter((d) => d.status === "MinorUpdate" || d.status === "MajorUpdate").length ?? 0,
    [project]
  );

  const eolRuntimes = useMemo(
    () => project?.runtimes.filter((r) => r.isEol).length ?? 0,
    [project]
  );

  if (loading) {
    return (
      <Box sx={{ p: "36px 28px 24px" }}>
        <Box sx={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: "var(--r)", mb: "16px", p: "20px 24px" }}>
          <Skeleton variant="text" width={200} height={28} sx={{ mb: "8px" }} />
          <Skeleton variant="text" width={320} height={16} sx={{ mb: "16px" }} />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--border)", pt: "16px" }}>
            {[0, 1, 2, 3].map((i) => (
              <Box key={i} sx={{ px: "20px" }}>
                <Skeleton variant="text" width={80} height={14} />
                <Skeleton variant="text" width={50} height={36} />
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
          <Skeleton variant="rectangular" height={48} sx={{ mb: 0 }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" height={52} sx={{ mt: "1px" }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (!project) return null;

  const vulnAccent = allVulns.some((v) => v.severity === "Critical")
    ? "var(--red)" : allVulns.some((v) => v.severity === "High")
    ? "var(--orange)" : undefined;

  const runtimeAccent = project.runtimes.some((r) => r.isEol) ? "var(--red)" : undefined;

  const tabDefs: TabDef[] = [
    { icon: <GppBadOutlined sx={{ fontSize: 14 }} />,   label: "Vulnérabilités", count: allVulns.length,            accentColor: vulnAccent },
    { icon: <InventoryOutlined sx={{ fontSize: 14 }} />, label: "Dépendances",   count: project.dependencies.length },
    { icon: <StorageOutlined sx={{ fontSize: 14 }} />,   label: "Runtimes",      count: project.runtimes.length,    accentColor: runtimeAccent },
  ];

  return (
    <>
      <Box className="page-enter" sx={{ p: "36px 28px 24px", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Header card ─────────────────────────────────────────── */}
        <Box
          sx={{
            flexShrink: 0,
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            mb: "16px",
            overflow: "hidden",
          }}
        >
          {/* Contenu principal */}
          <Box sx={{ display: "flex", alignItems: "center", gap: "20px", p: "20px 24px 20px 28px" }}>
            {/* Nom + méta */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", mb: "10px", lineHeight: 1.2 }}>
                {project.name}
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {project.repositoryUrl && (
                  <Box sx={{
                    display: "flex", alignItems: "center", gap: "5px",
                    background: "var(--s2)", border: "1px solid var(--border)",
                    borderRadius: "5px", px: "8px", py: "3px",
                    maxWidth: "320px",
                  }}>
                    <AccountTreeOutlined sx={{ fontSize: 11, color: "var(--accent)", flexShrink: 0 }} />
                    <Box component="span" sx={{
                      fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted2)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {project.repositoryUrl}
                    </Box>
                  </Box>
                )}
                {project.scanFrequency && (
                  <Box sx={{
                    display: "flex", alignItems: "center", gap: "5px",
                    background: "var(--s2)", border: "1px solid var(--border)",
                    borderRadius: "5px", px: "8px", py: "3px",
                  }}>
                    <RefreshOutlined sx={{ fontSize: 11, color: "var(--muted)" }} />
                    <Box component="span" sx={{ fontSize: "11px", color: "var(--muted)" }}>
                      {project.scanFrequency === "Daily" ? "Quotidien" : "Hebdomadaire"}
                    </Box>
                  </Box>
                )}
                {project.lastScanAt && (
                  <Box sx={{
                    display: "flex", alignItems: "center", gap: "5px",
                    background: "var(--s2)", border: "1px solid var(--border)",
                    borderRadius: "5px", px: "8px", py: "3px",
                  }}>
                    <AccessTimeOutlined sx={{ fontSize: 11, color: "var(--muted)" }} />
                    <Box component="span" sx={{ fontSize: "11px", color: "var(--muted)" }}>
                      {new Date(project.lastScanAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Score à droite */}
            <HealthScoreCircle
              score={project.healthScore}
              grade={project.healthGrade as "A" | "B" | "C" | "D" | "F"}
              size={64}
            />
          </Box>

          {/* Stats bar */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--border)" }}>
            {([
              { label: "Dépendances",   value: project.totalDependencies,       icon: <InventoryOutlined sx={{ fontSize: 13 }} />, alert: null },
              { label: "À mettre à jour", value: depsToUpdate,                  icon: <RefreshOutlined sx={{ fontSize: 13 }} />,   alert: depsToUpdate > 0 ? "orange" : null },
              { label: "Critiques",     value: project.criticalVulnerabilities, icon: <GppBadOutlined sx={{ fontSize: 13 }} />,   alert: project.criticalVulnerabilities > 0 ? "red" : null },
              { label: "Fin de support",  value: eolRuntimes,                     icon: <StorageOutlined sx={{ fontSize: 13 }} />,  alert: eolRuntimes > 0 ? "red" : null },
            ] as const).map((s, i) => (
              <Box key={i} sx={{
                p: "14px 20px",
                borderRight: i < 3 ? "1px solid var(--border)" : "none",
                background: "transparent",
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--muted)", mb: "6px" }}>
                  {s.icon}
                  <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {s.label}
                  </Box>
                </Box>
                <Box sx={{
                  fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1,
                  color: s.alert === "red" ? "var(--red)" : s.alert === "orange" ? "var(--orange)" : "var(--text)",
                }}>
                  {s.value}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Tab panel ───────────────────────────────────────────── */}
        <Box
          sx={{
            flex: "0 1 auto",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            overflow: "hidden",
          }}
        >
          {/* Tab header */}
          <Box
            sx={{
              flexShrink: 0,
              height: "44px",
              display: "flex",
              alignItems: "stretch",
              borderBottom: "1px solid var(--border)",
              background: "var(--s2)",
              px: "4px",
            }}
          >
            <TabBar
              tabs={tabDefs}
              active={activeTab}
              onChange={(i) => { setActiveTab(i); setDepSearch(""); }}
            />
          </Box>

          {/* Tab content */}
          <Box
            key={activeTab}
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              p: "20px",
              animation: "tabIn 0.18s cubic-bezier(0.4,0,0.2,1) both",
              "@keyframes tabIn": {
                from: { opacity: 0, transform: "translateY(6px)" },
                to:   { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >

            {/* ── Vulnérabilités ────────────────────────────────── */}
            {activeTab === 0 && (
              allVulns.length === 0 ? (
                <Box sx={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: "10px", p: "24px", borderRadius: "var(--r)",
                }}>
                  <CheckCircleOutlined sx={{ fontSize: 32, color: "var(--green)" }} />
                  <Box sx={{ fontSize: "14px", color: "var(--green)", textAlign: "center" }}>
                    Aucune vulnérabilité détectée
                  </Box>
                </Box>
              ) : (
                <Box sx={{ maxHeight: "100%", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <Box sx={{ overflowY: "auto" }}>
                    <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                      <Box component="thead">
                        <Box component="tr">
                          <TH width="160px">Score</TH>
                          <TH>Vulnérabilité</TH>
                          <TH width="160px">Référence CVE</TH>
                          <TH width="140px">Version corrigée</TH>
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {sortedVulns.map((v) => <VulnRow key={v.id} vuln={v} />)}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )
            )}

            {/* ── Dépendances ───────────────────────────────────── */}
            {activeTab === 1 && (
              <Box sx={{ maxHeight: "100%", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Search bar */}
                <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "12px", px: "16px", py: "14px", borderBottom: "1px solid var(--border)", background: "var(--s2)" }}>
                  <Box sx={{
                    display: "flex", alignItems: "center", gap: "7px",
                    background: "var(--s1)", border: "1px solid var(--border)",
                    borderRadius: "7px", px: "9px", height: "28px", width: "340px",
                    transition: "border-color 0.15s",
                    "&:focus-within": { borderColor: "var(--accent-border)", boxShadow: "0 0 0 3px rgba(99,102,241,0.08)" },
                  }}>
                    <SearchOutlined sx={{ color: "var(--muted)", fontSize: "13px", flexShrink: 0 }} />
                    <Box
                      component="input"
                      placeholder="Rechercher..."
                      value={depSearch}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepSearch(e.target.value)}
                      sx={{ all: "unset", flex: 1, fontSize: "12px", color: "var(--text)", "&::placeholder": { color: "var(--muted)" }, "&:focus": { outline: "none", boxShadow: "none !important" } }}
                    />
                  </Box>
                  {depSearch && (
                    <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)" }}>
                      {filteredDeps.length} / {project.dependencies.length}
                    </Box>
                  )}
                </Box>
                <Box sx={{ overflowY: "auto" }}>
                  <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                    <Box component="thead">
                      <Box component="tr">
                        <TH>Librairie</TH>
                        <TH width="90px">Écosystème</TH>
                        <TH width="60px">Type</TH>
                        <TH width="180px">Version</TH>
                        <TH width="110px">Statut</TH>
                        <TH width="70px">Vulnérabilités</TH>
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {filteredDeps.length === 0 ? (
                        <Box component="tr">
                          <Box component="td" colSpan={6} sx={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: "13px", borderBottom: "none" }}>
                            Aucun résultat
                          </Box>
                        </Box>
                      ) : (
                        filteredDeps.map((d: DependencyDto) => {
                          const s = DEP_STATUS[d.status] ?? { label: d.status, variant: "gray" as const };
                          return (
                            <TR key={d.id}>
                              <TD>
                                <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <InventoryOutlined sx={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }} />
                                  <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600 }}>{d.name}</Box>
                                </Box>
                              </TD>
                              <TD>
                                <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", background: "var(--s3)", px: "7px", py: "2px", borderRadius: "3px" }}>
                                  {d.ecosystem}
                                </Box>
                              </TD>
                              <TD>
                                <StatusChip variant="gray">{d.type === "Prod" ? "Prod" : "Dev"}</StatusChip>
                              </TD>
                              <TD mono muted>
                                <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span>{d.currentVersion}</span>
                                  {d.latestVersion && d.latestVersion !== d.currentVersion && (
                                    <>
                                      <Box component="span" sx={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>→</Box>
                                      <Box component="span" sx={{ color: "var(--orange)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{d.latestVersion}</Box>
                                    </>
                                  )}
                                </Box>
                              </TD>
                              <TD><StatusChip variant={s.variant}>{s.label}</StatusChip></TD>
                              <TD>
                                {d.vulnerabilities.length > 0
                                  ? <StatusChip variant="red">{d.vulnerabilities.length}</StatusChip>
                                  : <Box component="span" sx={{ color: "var(--muted)", fontSize: "12px" }}>—</Box>}
                              </TD>
                            </TR>
                          );
                        })
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {/* ── Runtimes ──────────────────────────────────────── */}
            {activeTab === 2 && (
              project.runtimes.length === 0 ? (
                <Box className="empty-state">
                  <StorageOutlined className="empty-state-icon" sx={{ fontSize: 40 }} />
                  <Box className="empty-state-title">Aucun runtime détecté</Box>
                  <Box className="empty-state-subtitle">Lancez un scan pour détecter les runtimes du projet.</Box>
                </Box>
              ) : (
                <Box sx={{ maxHeight: "100%", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <Box sx={{ overflowY: "auto" }}>
                    <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                      <Box component="thead">
                        <Box component="tr">
                          <TH>Runtime</TH>
                          <TH width="120px">Version</TH>
                          <TH width="160px">Fin de support</TH>
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {project.runtimes.map((r: RuntimeDto) => <RuntimeRow key={r.id} runtime={r} />)}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )
            )}
          </Box>
        </Box>
      </Box>

      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Supprimer ce projet ?"
      >
        Supprimer <strong>{project.name}</strong> supprimera aussi toutes les dépendances et vulnérabilités associées. Cette action est irréversible.
      </DeleteModal>
    </>
  );
};

// ─── StatCell ────────────────────────────────────────────────────────────────

const StatCell: React.FC<{
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}> = ({ label, value, color, icon }) => (
  <Box sx={{ padding: "0 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "4px" }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--muted)" }}>
      {icon}
      <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </Box>
    </Box>
    <Box sx={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color }}>
      {value}
    </Box>
  </Box>
);
