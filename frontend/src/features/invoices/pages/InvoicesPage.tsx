import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../../../layouts/Topbar";
import { StatusChip } from "../../../components/StatusChip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
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
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";

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
  const [statusFilter, setStatusFilter] = useState("");

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
        statusFilter ? { status: statusFilter } : undefined,
      );
      setInvoices(data);
    } catch {
      showToast("Impossible de charger les factures", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          !search ||
          inv.reference.toLowerCase().includes(search.toLowerCase()) ||
          inv.label.toLowerCase().includes(search.toLowerCase()) ||
          inv.period.toLowerCase().includes(search.toLowerCase()),
      ),
    [invoices, search],
  );

  const totalPending = invoices
    .filter((i) => i.status === "Sent" || i.isOverdue)
    .reduce((s, i) => s + i.totalWithTax, 0);
  const totalPaid = invoices
    .filter((i) => i.status === "Paid")
    .reduce((s, i) => s + i.totalWithTax, 0);
  const totalOverdue = invoices
    .filter((i) => i.isOverdue)
    .reduce((s, i) => s + i.totalWithTax, 0);

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
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
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
      <Topbar
        title="Factures"
        subtitle={`${invoices.length} facture${invoices.length !== 1 ? "s" : ""}`}
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
            onClick={openNewModal}
          >
            <AddOutlined sx={{ fontSize: 14 }} />
            Nouvelle facture
          </Button>
        }
      />
      <Box sx={{ p: "24px 28px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "14px",
            mb: "28px",
          }}
        >
          <KpiCard
            label="En attente"
            value={fmtEur(totalPending)}
            color="var(--yellow)"
          />
          <KpiCard
            label="Encaissé"
            value={fmtEur(totalPaid)}
            color="var(--green)"
          />
          <KpiCard
            label="En retard"
            value={fmtEur(totalOverdue)}
            color={totalOverdue > 0 ? "var(--red)" : undefined}
          />
        </Box>

        <Box sx={{ display: "flex", gap: "10px", mb: "20px" }}>
          <Box sx={{ position: "relative", flex: 1, maxWidth: "300px" }}>
            <SearchOutlined
              sx={{
                fontSize: 13,
                position: "absolute",
                left: "11px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
              }}
            />
            <Box
              component="input"
              type="text"
              placeholder="Référence, libellé, période..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              sx={{ ...inputSx, pl: "32px" }}
            />
          </Box>
          <Box
            component="select"
            sx={{ ...inputSx, width: "auto" }}
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="Draft">Brouillon</option>
            <option value="Sent">Envoyée</option>
            <option value="Paid">Payée</option>
          </Box>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              padding: "48px",
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : filtered.length === 0 ? (
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
                <DescriptionOutlined sx={{ fontSize: 40 }} />
              </Box>
              <Box className="empty-state-title">Aucune facture</Box>
              <Box className="empty-state-subtitle">
                {invoices.length === 0
                  ? "Générez votre première facture"
                  : "Modifiez votre recherche"}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              overflow: "hidden",
            }}
          >
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
              <Box component="thead">
                <Box component="tr">
                  {[
                    "Référence",
                    "Libellé",
                    "Période",
                    "Heures",
                    "HT",
                    "TTC",
                    "Échéance",
                    "Statut",
                    "",
                  ].map((h) => (
                    <Box
                      component="th"
                      key={h}
                      sx={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        textAlign: "left",
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--s2)",
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {filtered.map((inv) => {
                  const overdue = inv.isOverdue;
                  return (
                    <Box
                      component="tr"
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      sx={{
                        cursor: "pointer",
                        "&:hover td": { background: "var(--s2)" },
                      }}
                    >
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 14px",
                          borderBottom: "1px solid var(--border)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        {inv.reference}
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 14px",
                          borderBottom: "1px solid var(--border)",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        {inv.label}
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 14px",
                          borderBottom: "1px solid var(--border)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--muted2)",
                        }}
                      >
                        {inv.period}
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 14px",
                          borderBottom: "1px solid var(--border)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                        }}
                      >
                        {inv.totalHours}h
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 14px",
                          borderBottom: "1px solid var(--border)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {fmtEur(inv.totalAmount)}
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 14px",
                          borderBottom: "1px solid var(--border)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "var(--green)",
                        }}
                      >
                        {fmtEur(inv.totalWithTax)}
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 14px",
                          borderBottom: "1px solid var(--border)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: overdue ? "var(--red)" : "var(--muted)",
                        }}
                      >
                        {fmtDate(inv.dueAt)}
                        {overdue && (
                          <Box
                            component="span"
                            sx={{
                              ml: "6px",
                              fontSize: "9px",
                              background: "var(--red-subtle)",
                              color: "var(--red)",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              fontWeight: 700,
                            }}
                          >
                            RETARD
                          </Box>
                        )}
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 14px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <StatusChip
                          variant={
                            overdue
                              ? "red"
                              : (STATUS_VARIANT[inv.status] ?? "gray")
                          }
                        >
                          {overdue
                            ? "En retard"
                            : (STATUS_LABEL[inv.status] ?? inv.status)}
                        </StatusChip>
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          padding: "12px 14px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {inv.status === "Draft" && (
                            <>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ textTransform: "none" }}
                                onClick={(e) => handleSend(inv, e)}
                              >
                                Envoyer
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{
                                  textTransform: "none",
                                  color: "var(--red)",
                                }}
                                onClick={(e) => handleDelete(inv, e)}
                              >
                                Supprimer
                              </Button>
                            </>
                          )}
                          {inv.status === "Sent" && (
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{
                                textTransform: "none",
                                color: "var(--green)",
                              }}
                              onClick={(e) => handlePay(inv, e)}
                            >
                              Marquer payée
                            </Button>
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
      </Box>

      <Dialog
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
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
          Nouvelle facture
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Box sx={{ mb: "14px" }}>
              <Box component="label" sx={labelSx}>
                Libellé <Box component="span" sx={{ color: "var(--red)" }}>*</Box>
              </Box>
              <Box
                component="input"
                type="text"
                sx={inputSx}
                value={newLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLabel(e.target.value)}
                placeholder="Ex : Prestation TMA - Mars 2026"
              />
            </Box>
            <Box sx={{ mb: "14px" }}>
              <Box component="label" sx={labelSx}>
                Projet associé{" "}
                <Box component="span" sx={{ color: "var(--muted)", fontSize: "11px" }}>
                  (optionnel)
                </Box>
              </Box>
              <Box
                component="select"
                sx={inputSx}
                value={selectedProjectId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedProjectId(e.target.value)}
              >
                <option value="">— Aucun projet —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Box>
            </Box>
            <Box sx={{ mb: "14px" }}>
              <Box component="label" sx={labelSx}>
                Taux journalier (€){" "}
                <Box component="span" sx={{ color: "var(--red)" }}>*</Box>
              </Box>
              <Box
                component="input"
                type="number"
                sx={inputSx}
                value={newDailyRate}
                min={0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDailyRate(Number(e.target.value))}
                placeholder="500"
              />
            </Box>
            <Box sx={{ mb: "14px" }}>
              <Box component="label" sx={labelSx}>Période</Box>
              <Box
                component="input"
                type="month"
                sx={inputSx}
                value={newPeriod}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPeriod(e.target.value)}
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <Box sx={{ mb: "14px" }}>
                <Box component="label" sx={labelSx}>TVA (%)</Box>
                <Box
                  component="input"
                  type="number"
                  sx={inputSx}
                  value={newTaxRate}
                  min={0}
                  max={100}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaxRate(Number(e.target.value))}
                />
              </Box>
              <Box sx={{ mb: "14px" }}>
                <Box component="label" sx={labelSx}>Délai paiement (jours)</Box>
                <Box
                  component="input"
                  type="number"
                  sx={inputSx}
                  value={newDueDays}
                  min={0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDueDays(Number(e.target.value))}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: "16px", pt: 0 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={() => setShowNewModal(false)}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={handleGenerate}
            disabled={generating || !newLabel.trim() || !user?.organizationId}
          >
            {generating ? "Génération..." : "Générer"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const KpiCard: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color,
}) => (
  <Box
    sx={{
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r)",
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "var(--shadow)",
    }}
  >
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: color ?? "var(--border)",
      }}
    />
    <Box
      sx={{
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "var(--muted)",
        mb: "10px",
        fontWeight: 500,
      }}
    >
      {label}
    </Box>
    <Box
      sx={{
        fontSize: "24px",
        fontWeight: 800,
        color: color ?? "var(--text)",
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}
    >
      {value}
    </Box>
  </Box>
);
