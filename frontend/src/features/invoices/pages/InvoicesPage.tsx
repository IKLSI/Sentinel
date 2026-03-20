import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { StatusChip } from "../../../components/StatusChip";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import { AppModal } from "../../../components/AppModal";
import Box from "@mui/material/Box";
import { useToast } from "../../../hooks/useToast";
import {
  getInvoices,
  updateInvoiceStatus,
  deleteInvoice,
  generateInvoice,
  InvoiceDto,
} from "../api/invoices";
import { getProjects, ProjectDto } from "../../techHealth/api/projects";
import { useAuth } from "../../auth/hooks/useAuth";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import SendOutlined from "@mui/icons-material/SendOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PAGE_SIZE = 30;

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

const InvoicesPagination: React.FC<{
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
        {total} facture{total > 1 ? "s" : ""}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Box component="button" sx={navBtnSx(page === 1)} onClick={() => onChange(page - 1)}>
          ← Précédent
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "2px", mx: "4px" }}>
          {pages.map((p, i) =>
            p === "..." ? (
              <Box key={`e-${i}`} sx={{ minWidth: "28px", textAlign: "center", fontSize: "13px", color: "var(--muted)", pb: "2px" }}>···</Box>
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

const STATUS_LABEL: Record<string, string> = {
  Draft: "Brouillon",
  Sent: "Envoyée",
  Paid: "Payée",
};

const STATUS_VARIANT: Record<string, "gray" | "yellow" | "green" | "red"> = {
  Draft: "gray",
  Sent: "yellow",
  Paid: "green",
};

const fmtEur = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const fmtDate = (d?: string) =>
  d ? format(new Date(d), "dd MMM yyyy", { locale: fr }) : "—";

const inputSx = {
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
};

const selectSx = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
  px: "12px",
  py: "8px",
  fontSize: "13px",
  color: "var(--text)",
  width: "auto",
  outline: "none",
  fontFamily: "inherit",
};

const labelSx = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  mb: "5px",
  color: "var(--muted2)",
  letterSpacing: "0.04em",
};

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", overdue: "" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);

  const [showNewModal, setShowNewModal] = useState(false);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newDailyRate, setNewDailyRate] = useState(500);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [newPeriod, setNewPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [newTaxRate, setNewTaxRate] = useState(20);
  const [newDueDays, setNewDueDays] = useState(30);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInvoices(
        filters.status ? { status: filters.status } : undefined,
      );
      setInvoices(data);
    } catch {
      showToast("Impossible de charger les factures", "error");
    } finally {
      setLoading(false);
    }
  }, [filters.status, showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!filtersOpen) return;
    const handler = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filtersOpen]);

  const filtered = useMemo(
    () =>
      invoices.filter((inv) => {
        if (search && !inv.reference.toLowerCase().includes(search.toLowerCase()) &&
          !inv.label.toLowerCase().includes(search.toLowerCase()) &&
          !inv.period.toLowerCase().includes(search.toLowerCase())) return false;
        if (filters.overdue === "yes" && !inv.isOverdue) return false;
        if (filters.overdue === "no" && inv.isOverdue) return false;
        return true;
      }),
    [invoices, search, filters.overdue],
  );

  const hasActiveFilters = !!(filters.status || filters.overdue);

  useEffect(() => { setPage(1); }, [search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openNewModal = async () => {
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
      setNewLabel("");
      setNewDailyRate(500);
      setSelectedProjectId("");
    } catch {
      showToast("Impossible de charger les projets", "error");
      return;
    }
    setShowNewModal(true);
  };

  const handleGenerate = async () => {
    if (!newLabel.trim() || !user?.organizationId) return;
    setGenerating(true);
    try {
      const invoice = await generateInvoice({
        organizationId: user.organizationId,
        label: newLabel.trim(),
        dailyRate: newDailyRate,
        period: newPeriod,
        taxRate: newTaxRate,
        dueDays: newDueDays,
        techProjectId: selectedProjectId || undefined,
      });
      showToast(`Facture ${invoice.reference} générée`, "success");
      setShowNewModal(false);
      navigate(`/invoices/${invoice.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg ?? "Erreur lors de la génération", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async (inv: InvoiceDto, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateInvoiceStatus(inv.id, "Sent");
      showToast("Facture marquée comme envoyée", "success");
      load();
    } catch {
      showToast("Erreur", "error");
    }
  };

  const handlePay = async (inv: InvoiceDto, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateInvoiceStatus(inv.id, "Paid");
      showToast("Facture marquée comme payée", "success");
      load();
    } catch {
      showToast("Erreur", "error");
    }
  };

  const handleDelete = async (inv: InvoiceDto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Supprimer ${inv.reference} ?`)) return;
    try {
      await deleteInvoice(inv.id);
      showToast("Facture supprimée", "success");
      load();
    } catch {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  return (
    <>

      <Box sx={{ p: "36px 28px 24px", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Barre recherche + filtres + bouton ── */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: "16px", flexShrink: 0 }}>
          {/* Recherche */}
          <Box sx={{
            width: "280px", display: "flex", alignItems: "center", gap: "8px",
            background: "var(--s1)", border: "1px solid var(--border)",
            borderRadius: "9px", px: "10px", height: "32px",
            transition: "border-color 0.15s, box-shadow 0.15s",
            "&:focus-within": { borderColor: "var(--accent-border)", boxShadow: "0 0 0 3px rgba(99,102,241,0.08)" },
          }}>
            <SearchOutlined sx={{ color: "var(--muted)", fontSize: "14px", flexShrink: 0 }} />
            <Box
              component="input"
              placeholder="Rechercher..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              sx={{
                all: "unset", flex: 1, fontSize: "12.5px",
                color: "var(--text)",
                "&::placeholder": { color: "var(--muted)" },
                "&:focus": { outline: "none", boxShadow: "none !important" },
              }}
            />
          </Box>

          {/* Filtres */}
          <Box ref={filtersRef} sx={{ position: "relative" }}>
            {hasActiveFilters && (
              <Box sx={{
                position: "absolute", top: -5, right: -5,
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--accent)", zIndex: 1,
                border: "2px solid var(--bg)",
              }} />
            )}
            <Box
              component="button"
              onClick={() => setFiltersOpen((v) => !v)}
              sx={{
                all: "unset", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "7px",
                px: "14px", height: "32px",
                background: filtersOpen ? "var(--accent-subtle)" : "var(--s1)",
                border: `1px solid ${filtersOpen ? "var(--accent-border)" : "var(--border)"}`,
                borderRadius: "9px", fontSize: "13px", fontWeight: 500,
                color: filtersOpen ? "var(--accent)" : "var(--text-secondary)",
                transition: "all 0.12s",
                "&:hover": { background: "var(--s2)", borderColor: "var(--border2)" },
              }}
            >
              <TuneOutlined sx={{ fontSize: 15 }} />
              Filtres
            </Box>

            {filtersOpen && (
              <Box sx={{
                position: "absolute", top: "calc(100% + 8px)", left: 0,
                background: "var(--s1)", border: "1px solid var(--border)",
                borderRadius: "12px", p: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                zIndex: 50, minWidth: "200px",
                display: "flex", flexDirection: "column", gap: "10px",
                animation: "fadeInUp 0.12s ease forwards",
              }}>
                <Box>
                  <Box sx={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", mb: "5px" }}>
                    Statut
                  </Box>
                  <Box component="select" value={filters.status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters((f) => ({ ...f, status: e.target.value }))}
                    sx={{ ...selectSx, width: "100%", boxSizing: "border-box" }}
                  >
                    <option value="">Tous</option>
                    <option value="Draft">Brouillon</option>
                    <option value="Sent">Envoyée</option>
                    <option value="Paid">Payée</option>
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", mb: "5px" }}>
                    Échéance
                  </Box>
                  <Box component="select" value={filters.overdue}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters((f) => ({ ...f, overdue: e.target.value }))}
                    sx={{ ...selectSx, width: "100%", boxSizing: "border-box" }}
                  >
                    <option value="">Toutes</option>
                    <option value="yes">En retard</option>
                    <option value="no">Dans les délais</option>
                  </Box>
                </Box>

                {hasActiveFilters && (
                  <Box
                    component="button"
                    onClick={() => { setFilters({ status: "", overdue: "" }); setFiltersOpen(false); }}
                    sx={{
                      all: "unset", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: "6px", mt: "4px",
                      fontSize: "12px", fontWeight: 600,
                      color: "var(--red)",
                      background: "var(--red-subtle)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "7px",
                      py: "8px",
                      transition: "background 0.12s, border-color 0.12s",
                      "&:hover": { background: "rgba(239,68,68,0.14)", borderColor: "rgba(239,68,68,0.35)" },
                    }}
                  >
                    Réinitialiser
                  </Box>
                )}
              </Box>
            )}
          </Box>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="contained"
            size="small"
            sx={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, textTransform: "none" }}
            onClick={openNewModal}
          >
            <AddOutlined sx={{ fontSize: 14 }} />
            Nouvelle facture
          </Button>
        </Box>

        {/* ── Tableau ── */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: "48px" }}>
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
                  <Box className="empty-state-icon"><DescriptionOutlined sx={{ fontSize: 40 }} /></Box>
                  <Box className="empty-state-title">Aucune facture</Box>
                  <Box className="empty-state-subtitle">
                    {invoices.length === 0 ? "Générez votre première facture" : "Modifiez votre recherche"}
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{ flex: 1, overflowY: "auto" }}>
                <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                  <Box component="thead" sx={{ position: "sticky", top: 0, zIndex: 1 }}>
                    <Box component="tr">
                      {["Référence", "Libellé", "Période", "Heures", "HT", "TTC", "Échéance", "Statut", ""].map((h) => (
                        <Box component="th" key={h} sx={{
                          fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.1em",
                          textTransform: "uppercase", color: "var(--muted)", textAlign: "left",
                          padding: "10px 14px", borderBottom: "1px solid var(--border)",
                          background: "var(--s2)", fontWeight: 500, whiteSpace: "nowrap",
                        }}>
                          {h}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {paged.map((inv) => {
                      const overdue = inv.isOverdue;
                      return (
                        <Box
                          component="tr" key={inv.id}
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          sx={{ cursor: "pointer", "&:hover td": { background: "var(--s2)" } }}
                        >
                          <Box component="td" sx={{
                            padding: "12px 14px", borderBottom: "1px solid var(--border)",
                            fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--text)",
                          }}>
                            {inv.reference}
                          </Box>
                          <Box component="td" sx={{
                            padding: "12px 14px", borderBottom: "1px solid var(--border)",
                            fontSize: "13px", fontWeight: 600,
                          }}>
                            {inv.label}
                          </Box>
                          <Box component="td" sx={{
                            padding: "12px 14px", borderBottom: "1px solid var(--border)",
                            fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted2)",
                          }}>
                            {inv.period}
                          </Box>
                          <Box component="td" sx={{
                            padding: "12px 14px", borderBottom: "1px solid var(--border)",
                            fontFamily: "var(--font-mono)", fontSize: "12px",
                          }}>
                            {inv.totalHours}h
                          </Box>
                          <Box component="td" sx={{
                            padding: "12px 14px", borderBottom: "1px solid var(--border)",
                            fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)",
                          }}>
                            {fmtEur(inv.totalAmount)}
                          </Box>
                          <Box component="td" sx={{
                            padding: "12px 14px", borderBottom: "1px solid var(--border)",
                            fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 800, color: "var(--green)",
                          }}>
                            {fmtEur(inv.totalWithTax)}
                          </Box>
                          <Box component="td" sx={{
                            padding: "12px 14px", borderBottom: "1px solid var(--border)",
                            fontFamily: "var(--font-mono)", fontSize: "11px",
                            color: overdue ? "var(--red)" : "var(--muted)",
                            whiteSpace: "nowrap",
                          }}>
                            {fmtDate(inv.dueAt)}
                            {overdue && (
                              <Box component="span" sx={{
                                ml: "6px", fontSize: "9px",
                                background: "var(--red-subtle)", color: "var(--red)",
                                padding: "1px 5px", borderRadius: "4px", fontWeight: 700,
                              }}>
                                RETARD
                              </Box>
                            )}
                          </Box>
                          <Box component="td" sx={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                            <StatusChip variant={overdue ? "red" : (STATUS_VARIANT[inv.status] ?? "gray")}>
                              {overdue ? "En retard" : (STATUS_LABEL[inv.status] ?? inv.status)}
                            </StatusChip>
                          </Box>
                          <Box component="td" sx={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                            <Box sx={{ display: "flex", gap: "2px", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                              {inv.status === "Draft" && (
                                <>
                                  <Tooltip title="Marquer comme envoyée" placement="top">
                                    <IconButton size="small" onClick={(e) => handleSend(inv, e)} sx={{ color: "var(--accent)", "&:hover": { background: "var(--accent-subtle)" } }}>
                                      <SendOutlined sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Supprimer" placement="top">
                                    <IconButton size="small" onClick={(e) => handleDelete(inv, e)} sx={{ color: "var(--red)", "&:hover": { background: "var(--red-subtle)" } }}>
                                      <DeleteOutlineOutlined sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              {inv.status === "Sent" && (
                                <Tooltip title="Marquer comme payée" placement="top">
                                  <IconButton size="small" onClick={(e) => handlePay(inv, e)} sx={{ color: "var(--green)", "&:hover": { background: "rgba(34,197,94,0.1)" } }}>
                                    <CheckCircleOutlineOutlined sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            )}
            <InvoicesPagination page={page} totalPages={totalPages} total={filtered.length} onChange={setPage} />
          </Box>
        )}
      </Box>

      {/* ── Modal nouvelle facture ── */}
      <AppModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nouvelle facture"
        actions={
          <>
            <Button variant="outlined" size="small" sx={{ textTransform: "none" }} onClick={() => setShowNewModal(false)}>
              Annuler
            </Button>
            <Button
              variant="contained" size="small" sx={{ textTransform: "none" }}
              onClick={handleGenerate}
              disabled={generating || !newLabel.trim() || !user?.organizationId}
            >
              {generating ? "Génération..." : "Générer"}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Box>
            <Box component="label" sx={labelSx}>
              Libellé <Box component="span" sx={{ color: "var(--red)" }}>*</Box>
            </Box>
            <Box component="input" type="text" sx={inputSx}
              value={newLabel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLabel(e.target.value)}
              placeholder="Ex : Prestation TMA - Mars 2026"
            />
          </Box>
          <Box>
            <Box component="label" sx={labelSx}>
              Projet associé{" "}
              <Box component="span" sx={{ color: "var(--muted)", fontSize: "11px" }}>(optionnel)</Box>
            </Box>
            <Box component="select" sx={inputSx}
              value={selectedProjectId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedProjectId(e.target.value)}
            >
              <option value="">— Aucun projet —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Box>
          </Box>
          <Box>
            <Box component="label" sx={labelSx}>
              Taux journalier (€) <Box component="span" sx={{ color: "var(--red)" }}>*</Box>
            </Box>
            <Box component="input" type="number" sx={inputSx}
              value={newDailyRate} min={0}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDailyRate(Number(e.target.value))}
              placeholder="500"
            />
          </Box>
          <Box>
            <Box component="label" sx={labelSx}>Période</Box>
            <Box component="input" type="month" sx={inputSx}
              value={newPeriod}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPeriod(e.target.value)}
            />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Box>
              <Box component="label" sx={labelSx}>TVA (%)</Box>
              <Box component="input" type="number" sx={inputSx}
                value={newTaxRate} min={0} max={100}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaxRate(Number(e.target.value))}
              />
            </Box>
            <Box>
              <Box component="label" sx={labelSx}>Délai paiement (jours)</Box>
              <Box component="input" type="number" sx={inputSx}
                value={newDueDays} min={0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDueDays(Number(e.target.value))}
              />
            </Box>
          </Box>
        </Box>
      </AppModal>
    </>
  );
};
