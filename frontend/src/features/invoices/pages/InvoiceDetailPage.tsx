import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import { AppModal } from "../../../components/AppModal";
import Box from "@mui/material/Box";
import { useToast } from "../../../hooks/useToast";
import {
  getInvoice,
  downloadInvoicePdf,
  openInvoicePdf,
  InvoiceDto,
} from "../api/invoices";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";

import { format } from "date-fns";
import { fr } from "date-fns/locale";

const fmtEur = (n: number) =>
  n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";

const fmtDate = (d?: string) =>
  d ? format(new Date(d), "dd MMM yyyy", { locale: fr }) : "—";

const fmtDateShort = (d?: string) =>
  d ? format(new Date(d), "dd/MM/yy", { locale: fr }) : "—";

const STEPS = [
  { key: "Draft", label: "Brouillon" },
  { key: "Sent", label: "Envoyée" },
  { key: "Paid", label: "Payée" },
];

const HR = () => <Box sx={{ height: "1px", background: "var(--border)" }} />;

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setInvoice(await getInvoice(id));
    } catch {
      showToast("Facture introuvable", "error");
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  }, [id, showToast, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!invoice) return null;

  const currentStep = STEPS.findIndex((s) => s.key === invoice.status);
  const overdue = invoice.isOverdue;
  const hourlyRate = invoice.dailyRate > 0 ? invoice.dailyRate / 8 : 0;
  return (
    <>

      <Box
        className="page-enter"
        sx={{
          p: "36px 28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* ── Actions PDF ── */}
        {invoice.hasPdf && (
          <Box sx={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <Box
              component="button"
              onClick={() => openInvoicePdf(invoice.id)}
              sx={{
                all: "unset",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--muted2)",
                px: "10px",
                height: "28px",
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                transition: "background 0.1s, color 0.1s",
                "&:hover": { background: "var(--s2)", color: "var(--text)" },
              }}
            >
              <VisibilityOutlined sx={{ fontSize: 13 }} />
              Visualiser
            </Box>
            <Box
              component="button"
              onClick={() => {
                setDownloadFilename(invoice.reference);
                setShowDownloadModal(true);
              }}
              sx={{
                all: "unset",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--muted2)",
                px: "10px",
                height: "28px",
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                transition: "background 0.1s, color 0.1s",
                "&:hover": { background: "var(--s2)", color: "var(--text)" },
              }}
            >
              <FileDownloadOutlined sx={{ fontSize: 13 }} />
              Télécharger
            </Box>
          </Box>
        )}

        {/* ══ Card 1 — Stepper ══ */}
        <Box
          sx={{
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            px: "40px",
            py: "22px",
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          {STEPS.map((step, idx) => {
            const done = idx < currentStep;
            const active = idx === currentStep;
            const isOverdueStep = active && overdue && step.key === "Sent";

            const dotBg = done
              ? "var(--green)"
              : active
                ? isOverdueStep
                  ? "var(--red)"
                  : "var(--accent)"
                : "var(--s3)";
            const dotBorder = done
              ? "var(--green)"
              : active
                ? isOverdueStep
                  ? "var(--red)"
                  : "var(--accent)"
                : "var(--border)";
            const labelFg = done
              ? "var(--green)"
              : active
                ? isOverdueStep
                  ? "var(--red)"
                  : "var(--accent)"
                : "var(--muted)";
            const lineFg = done ? "var(--green)" : "var(--border)";

            let dateLine: string | undefined;
            let dateFg = "var(--muted)";
            if (done && step.key === "Draft" && invoice.issuedAt) {
              dateLine = fmtDateShort(invoice.issuedAt);
            } else if (
              step.key === "Sent" &&
              invoice.dueAt &&
              (active || done)
            ) {
              dateLine = fmtDateShort(invoice.dueAt);
              dateFg = active && overdue ? "var(--red)" : "var(--muted)";
            } else if (step.key === "Paid" && invoice.paidAt) {
              dateLine = fmtDateShort(invoice.paidAt);
              dateFg = "var(--green)";
            }

            return (
              <React.Fragment key={step.key}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    flex: 1,
                  }}
                >
                  {/* Dot */}
                  <Box
                    sx={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: dotBg,
                      border: `2px solid ${dotBorder}`,
                      color: done || active ? "#fff" : "var(--muted)",
                      fontSize: "11px",
                      fontWeight: 700,
                      transition: "all 0.2s",
                      flexShrink: 0,
                      ...(active
                        ? {
                            boxShadow: `0 0 0 4px ${isOverdueStep ? "rgba(239,68,68,0.14)" : "rgba(99,102,241,0.14)"}`,
                          }
                        : {}),
                    }}
                  >
                    {isOverdueStep ? (
                      <WarningAmberOutlined sx={{ fontSize: 15 }} />
                    ) : (done || active) ? (
                      <CheckCircleOutlined sx={{ fontSize: 15 }} />
                    ) : (
                      idx + 1
                    )}
                  </Box>

                  {/* Label */}
                  <Box sx={{ textAlign: "center" }}>
                    <Box
                      sx={{
                        fontSize: "11px",
                        fontWeight: active ? 700 : done ? 600 : 400,
                        color: labelFg,
                        letterSpacing: "-0.01em",
                        lineHeight: 1.3,
                      }}
                    >
                      {isOverdueStep ? "En retard" : step.label}
                    </Box>
                    {dateLine && (
                      <Box
                        sx={{
                          fontSize: "10px",
                          color: dateFg,
                          mt: "3px",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {dateLine}
                      </Box>
                    )}
                  </Box>
                </Box>

                {idx < STEPS.length - 1 && (
                  <Box
                    sx={{
                      flex: 2,
                      height: "1.5px",
                      background: lineFg,
                      mx: "8px",
                      mt: "14px",
                      borderRadius: "1px",
                      transition: "background 0.3s",
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Box>

        {/* ══ Card 2 — Document ══ */}
        <Box
          sx={{
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          {/* ─ En-tête : référence + montant ─ */}
          <Box
            sx={{
              px: "32px",
              pt: "26px",
              pb: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "32px",
            }}
          >
            {/* Gauche */}
            <Box>
              <Box
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "20px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  color: "var(--text)",
                }}
              >
                {invoice.reference}
              </Box>
              <Box
                sx={{
                  fontSize: "13px",
                  color: "var(--muted2)",
                  mt: "6px",
                  fontWeight: 400,
                  lineHeight: 1.5,
                }}
              >
                {invoice.label}
                {invoice.techProjectName && (
                  <Box
                    component="span"
                    sx={{ color: "var(--border2)", mx: "6px" }}
                  >
                    ·
                  </Box>
                )}
                {invoice.techProjectName}
                <Box
                  component="span"
                  sx={{ color: "var(--border2)", mx: "6px" }}
                >
                  ·
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--muted)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {invoice.period}
                </Box>
              </Box>
            </Box>
          </Box>

          <HR />

          {/* ─ Dates & Tarification ─ */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {/* Dates */}
            <Box
              sx={{
                px: "32px",
                py: "20px",
                borderRight: "1px solid var(--border)",
              }}
            >
              <Box
                sx={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--muted)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  mb: "16px",
                }}
              >
                Dates
              </Box>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "11px" }}
              >
                {(
                  [
                    { label: "Émission", value: fmtDate(invoice.issuedAt) },
                    {
                      label: "Échéance",
                      value: fmtDate(invoice.dueAt),
                      alert: overdue,
                    },
                    ...(invoice.paidAt
                      ? [
                          {
                            label: "Paiement",
                            value: fmtDate(invoice.paidAt),
                            success: true,
                          },
                        ]
                      : []),
                  ] as {
                    label: string;
                    value: string;
                    alert?: boolean;
                    success?: boolean;
                    badge?: string;
                  }[]
                ).map(({ label, value, alert, success, badge }) => (
                  <Box
                    key={label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        fontSize: "12px",
                        color: "var(--muted)",
                        fontWeight: 500,
                      }}
                    >
                      {label}
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: "12px",
                          fontWeight: 600,
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "-0.02em",
                          color: alert
                            ? "var(--red)"
                            : success
                              ? "var(--green)"
                              : "var(--text)",
                        }}
                      >
                        {value}
                      </Box>
                      {badge && (
                        <Box
                          component="span"
                          sx={{
                            fontSize: "9px",
                            fontWeight: 700,
                            px: "5px",
                            py: "1px",
                            borderRadius: "4px",
                            background: "rgba(239,68,68,0.1)",
                            color: "var(--red)",
                            fontFamily: "var(--font-mono)",
                            border: "1px solid rgba(239,68,68,0.18)",
                          }}
                        >
                          {badge}
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Tarification */}
            <Box sx={{ px: "32px", py: "20px" }}>
              <Box
                sx={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--muted)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  mb: "16px",
                }}
              >
                Tarification
              </Box>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "11px" }}
              >
                {[
                  {
                    label: "Taux journalier",
                    value: fmtEur(invoice.dailyRate),
                  },
                  {
                    label: "Taux horaire",
                    value: hourlyRate > 0 ? fmtEur(hourlyRate) : "—",
                  },

                ].map(({ label, value }) => (
                  <Box
                    key={label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        fontSize: "12px",
                        color: "var(--muted)",
                        fontWeight: 500,
                      }}
                    >
                      {label}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "-0.02em",
                        color: "var(--text)",
                      }}
                    >
                      {value}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          <HR />

          {/* ─ Ligne de prestation ─ */}
          <Box
            component="table"
            sx={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}
          >
            <Box component="thead">
              <Box component="tr" sx={{ background: "var(--s2)" }}>
                {(
                  [
                    { label: "Description", width: "auto" },
                    { label: "Heures", width: "100px" },
                    { label: "TVA", width: "100px" },
                    { label: "Montant HT", width: "150px" },
                    { label: "Montant TTC", width: "160px" },
                  ] as const
                ).map(({ label, width }, i) => (
                  <Box
                    component="th"
                    key={label}
                    sx={{
                      width,
                      pl: i === 0 ? "32px" : "20px",
                      pr: i === 0 ? undefined : i === 4 ? "32px" : "12px",
                      py: "10px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      textAlign: i === 0 ? "left" : "right",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {label}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              <Box component="tr">
                <Box component="td" sx={{ px: "32px", py: "18px" }}>
                  <Box
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {invoice.techProjectName ?? invoice.label}
                  </Box>
                  <Box
                    sx={{
                      fontSize: "11px",
                      color: "var(--muted)",
                      mt: "3px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {invoice.period}
                  </Box>
                </Box>
                <Box
                  component="td"
                  sx={{
                    pl: "20px",
                    pr: "12px",
                    py: "18px",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {invoice.totalHours}
                  <Box component="span" sx={{ fontSize: "11px", color: "var(--muted)", ml: "2px" }}>h</Box>
                </Box>
                <Box
                  component="td"
                  sx={{
                    pl: "20px",
                    pr: "12px",
                    py: "18px",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--muted2)",
                  }}
                >
                  {invoice.taxRate} %
                </Box>
                <Box
                  component="td"
                  sx={{
                    pl: "20px",
                    pr: "12px",
                    py: "18px",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {fmtEur(invoice.totalAmount)}
                </Box>
                <Box
                  component="td"
                  sx={{
                    px: "20px",
                    pr: "32px",
                    py: "18px",
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontSize: "14px",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color:
                      invoice.status === "Paid"
                        ? "var(--green)"
                        : overdue
                          ? "var(--red)"
                          : "var(--text)",
                  }}
                >
                  {fmtEur(invoice.totalWithTax)}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Modales ── */}
      <AppModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        title="Télécharger le PDF"
        actions={
          <>
            <Button
              variant="outlined"
              size="small"
              className="btn-cancel"
              sx={{ textTransform: "none" }}
              onClick={() => setShowDownloadModal(false)}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: "none" }}
              disabled={!downloadFilename.trim()}
              onClick={() => {
                downloadInvoicePdf(invoice.id, downloadFilename.trim());
                setShowDownloadModal(false);
              }}
            >
              Télécharger
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <Box
            component="label"
            sx={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--muted2)",
              letterSpacing: "0.04em",
            }}
          >
            Nom du fichier
          </Box>
          <Box sx={{ display: "flex", alignItems: "stretch" }}>
            <Box
              component="input"
              autoFocus
              type="text"
              value={downloadFilename}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDownloadFilename(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" && downloadFilename.trim()) {
                  downloadInvoicePdf(invoice.id, downloadFilename.trim());
                  setShowDownloadModal(false);
                }
              }}
              sx={{
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r) 0 0 var(--r)",
                px: "12px",
                py: "8px",
                fontSize: "13px",
                color: "var(--text)",
                flex: 1,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <Box
              sx={{
                background: "var(--s2)",
                border: "1px solid var(--border)",
                borderLeft: "none",
                borderRadius: "0 var(--r) var(--r) 0",
                display: "flex",
                alignItems: "center",
                px: "10px",
                fontSize: "12px",
                color: "var(--muted)",
                fontFamily: "var(--font-mono)",
                whiteSpace: "nowrap",
              }}
            >
              .pdf
            </Box>
          </Box>
        </Box>
      </AppModal>

    </>
  );
};
