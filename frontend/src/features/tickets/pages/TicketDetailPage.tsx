import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { AppModal } from "../../../components/AppModal";
import { DeleteModal } from "../../../components/DeleteModal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import AddOutlined from "@mui/icons-material/AddOutlined";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import AutoFixHighOutlined from "@mui/icons-material/AutoFixHighOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import SpeedOutlined from "@mui/icons-material/SpeedOutlined";
import BuildOutlined from "@mui/icons-material/BuildOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import { getTicket, addComment, updateComment, deleteComment } from "../api/tickets";
import { Ticket, TicketStatus } from "../../../types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "../../../hooks/useToast";
import { useAuth } from "../../auth/hooks/useAuth";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";

const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  new:         { label: "Nouveau",  color: "#818cf8", bg: "rgba(99,102,241,0.10)"   },
  in_progress: { label: "En cours", color: "#f97316", bg: "rgba(249,115,22,0.10)"   },
  testing:     { label: "En test",  color: "#06b6d4", bg: "rgba(6,182,212,0.10)"    },
  resolved:    { label: "Résolu",   color: "#22c55e", bg: "rgba(34,197,94,0.10)"    },
  closed:      { label: "Fermé",    color: "#7488aa", bg: "rgba(116,136,170,0.10)"  },
};

const priorityConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  critical: { label: "Critique", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  high: { label: "Haute", color: "#f97316", bg: "rgba(249,115,22,0.08)" },
  medium: { label: "Moyenne", color: "#eab308", bg: "rgba(234,179,8,0.08)" },
  low: { label: "Basse", color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
};

const typeLabels: Record<string, string> = {
  bug: "Bug",
  feature: "Évolution",
  security: "Sécurité",
  performance: "Performance",
  maintenance: "Maintenance",
  question: "Question",
};

const typeIcons: Record<string, React.ReactElement> = {
  bug:         <BugReportOutlined sx={{ fontSize: 11 }} />,
  feature:     <AutoFixHighOutlined sx={{ fontSize: 11 }} />,
  security:    <SecurityOutlined sx={{ fontSize: 11 }} />,
  performance: <SpeedOutlined sx={{ fontSize: 11 }} />,
  maintenance: <BuildOutlined sx={{ fontSize: 11 }} />,
  question:    <HelpOutlineOutlined sx={{ fontSize: 11 }} />,
};

const priorityLevels: Record<string, number> = {
  critical: 4,
  high:     3,
  medium:   2,
  low:      1,
};

const Card: React.FC<{ title: string; action?: React.ReactNode; noPadding?: boolean; children: React.ReactNode }> = ({ title, action, noPadding, children }) => (
  <Box sx={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: "16px", py: "11px", borderBottom: "1px solid var(--border)" }}>
      <Box sx={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>{title}</Box>
      {action}
    </Box>
    <Box sx={noPadding ? {} : { p: "16px 18px" }}>{children}</Box>
  </Box>
);

const fieldSx = {
  background: "var(--s2)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  px: "12px",
  py: "9px",
  fontSize: "13px",
  color: "var(--text)",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  transition: "border-color 0.12s",
  "&:focus": { borderColor: "var(--accent)" },
} as const;

const mdSx = {
  fontSize: "13px",
  color: "var(--text-secondary)",
  lineHeight: 1.8,
  "& p": { m: 0, mb: "10px" },
  "& p:last-child": { mb: 0 },
  "& code": {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    background: "var(--s2)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    px: "4px",
    py: "1px",
  },
  "& pre": {
    background: "var(--s2)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    p: "14px",
    overflow: "auto",
    fontSize: "12px",
  },
  "& ul, & ol": { pl: "20px", mb: "10px" },
  "& li": { mb: "3px" },
  "& h1, & h2, & h3": {
    fontWeight: 700,
    lineHeight: 1.3,
    mt: "16px",
    mb: "8px",
    color: "var(--text)",
  },
  "& strong": { color: "var(--text)", fontWeight: 700 },
  "& blockquote": {
    borderLeft: "3px solid var(--border2)",
    pl: "14px",
    m: 0,
    color: "var(--muted)",
  },
} as const;

const actionBtnSx = {
  all: "unset" as const,
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--accent)",
  px: "10px",
  py: "5px",
  borderRadius: "6px",
  background: "var(--accent-subtle)",
  border: "1px solid var(--accent-border)",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  transition: "background 0.12s, border-color 0.12s",
  "&:hover": {
    background: "color-mix(in srgb, var(--accent-subtle) 180%, transparent)",
    borderColor: "var(--accent)",
  },
};


function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function fmtDuration(
  hours: number | null | undefined,
  minutes: number | null | undefined,
) {
  if (hours != null) {
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return m > 0 ? `${h}h${m}` : `${h}h`;
  }
  if (minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
  }
  return "—";
}

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [commentModal, setCommentModal] = useState(false);
  const [comment, setComment] = useState("");
  const [commentPreview, setCommentPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editCommentTarget, setEditCommentTarget] = useState<{ id: string; content: string } | null>(null);
  const [editCommentValue, setEditCommentValue] = useState("");
  const [editCommentPreview, setEditCommentPreview] = useState(false);
  const [editCommentSaving, setEditCommentSaving] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<string | null>(null);
  const [deleteCommentLoading, setDeleteCommentLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    getTicket(id)
      .then((t) => {
        setTicket(t);
      })
      .catch(() => {
        setNotFound(true);
        showToast("Ticket introuvable", "error");
      })
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const handleEditComment = async () => {
    if (!ticket || !editCommentTarget || !editCommentValue.trim()) return;
    setEditCommentSaving(true);
    try {
      const updated = await updateComment(ticket.id, editCommentTarget.id, editCommentValue);
      setTicket((prev) => prev ? { ...prev, comments: prev.comments.map((c) => c.id === updated.id ? updated : c) } : prev);
      setEditCommentTarget(null);
      showToast("Commentaire modifié", "success");
    } catch {
      showToast("Erreur lors de la modification", "error");
    } finally {
      setEditCommentSaving(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!ticket || !deleteCommentTarget) return;
    setDeleteCommentLoading(true);
    try {
      await deleteComment(ticket.id, deleteCommentTarget);
      setTicket((prev) => prev ? { ...prev, comments: prev.comments.filter((c) => c.id !== deleteCommentTarget) } : prev);
      setDeleteCommentTarget(null);
      showToast("Commentaire supprimé", "success");
    } catch {
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setDeleteCommentLoading(false);
    }
  };

  const openCommentModal = () => {
    setComment("");
    setCommentPreview(false);
    setCommentModal(true);
  };

  const handleAddComment = async () => {
    if (!ticket || !comment.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(ticket.id, comment, false);
      setTicket((prev) =>
        prev ? { ...prev, comments: [...prev.comments, newComment] } : prev,
      );
      setComment("");
      setCommentModal(false);
      showToast("Commentaire ajouté", "success");
    } catch {
      showToast("Erreur lors de l'ajout du commentaire", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <>

        <Box sx={{ display: "flex", justifyContent: "center", p: "80px" }}>
          <CircularProgress size={28} />
        </Box>
      </>
    );

  if (notFound || !ticket)
    return (
      <>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            p: "80px",
            gap: "8px",
          }}
        >
          <Box
            sx={{
              fontSize: "40px",
              fontWeight: 800,
              color: "var(--border2)",
              fontFamily: "var(--font-mono)",
            }}
          >
            404
          </Box>
          <Box sx={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
            Ticket introuvable
          </Box>
          <Box sx={{ fontSize: "12px", color: "var(--muted)" }}>
            Ce ticket n'existe pas ou vous n'y avez pas accès.
          </Box>
        </Box>
      </>
    );

  const pc = priorityConfig[ticket.priority] ?? priorityConfig.medium;
  const sc = statusConfig[ticket.status];

  const rowSx = {
    display: "flex", alignItems: "flex-start", gap: "12px",
    py: "10px", borderBottom: "1px solid var(--border)",
    "&:last-child": { borderBottom: "none" },
  };
  const rowLabelSx = { fontSize: "12px", color: "var(--muted)", fontWeight: 500, flexShrink: 0, width: "100px", pt: "1px" };
  const rowValueSx = { fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500, flex: 1, minWidth: 0 };

  return (
    <>


      <Box className="page-enter" sx={{ p: { xs: "36px 16px 20px", md: "36px 32px 28px" }, display: "flex", gap: "24px", alignItems: "flex-start", flexDirection: { xs: "column", lg: "row" } }}>

        {/* ── COLONNE GAUCHE ── */}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Card en-tête */}
          <Box sx={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: "12px", p: "20px 22px" }}>
            <Box sx={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--muted2)", letterSpacing: "0.06em", mb: "10px" }}>
              {ticket.reference}
            </Box>
            <Box component="h1" sx={{ m: 0, mb: "14px", fontSize: { xs: "20px", md: "22px" }, fontWeight: 700, lineHeight: 1.3, color: "var(--text)", letterSpacing: "-0.025em" }}>
              {ticket.title}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
              {/* Priorité — barres de niveau */}
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: "5px", px: "8px", py: "3px", borderRadius: "5px", background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.15)", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1.5px', height: '10px' }}>
                  {[1,2,3,4].map(i => (
                    <Box key={i} sx={{ width: '3px', height: `${4 + i * 1.5}px`, borderRadius: '1px', background: "currentColor", opacity: i <= (priorityLevels[ticket.priority] ?? 1) ? 1 : 0.2 }} />
                  ))}
                </Box>
                {pc.label}
              </Box>
              {/* Type — icône */}
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: "5px", px: "8px", py: "3px", borderRadius: "5px", background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.15)", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
                {typeIcons[ticket.type]}
                {typeLabels[ticket.type] ?? ticket.type}
              </Box>
              {/* Statut */}
              <Box sx={{ display: "inline-flex", alignItems: "center", px: "8px", py: "3px", borderRadius: "5px", background: sc.bg, border: `1px solid ${sc.color}38`, fontSize: "11px", fontWeight: 700, color: sc.color }}>
                {sc.label}
              </Box>
            </Box>
          </Box>

          {/* Card Description */}
          <Card title="Description">
            <Box sx={{ ...mdSx }}>
              {ticket.description
                ? <ReactMarkdown>{ticket.description}</ReactMarkdown>
                : <Box sx={{ fontSize: "13px", color: "var(--muted)", fontWeight: 400 }}>Aucune description fournie.</Box>
              }
            </Box>
          </Card>

          {/* Card Activité */}
          <Card
            title="Activité"
            action={
              <Box component="button" sx={actionBtnSx} onClick={openCommentModal}>
                <AddOutlined sx={{ fontSize: 12 }} />
                Ajouter
              </Box>
            }
            noPadding
          >
            {ticket.comments.length === 0 ? (
              <Box sx={{ p: "18px", fontSize: "13px", color: "var(--muted)", fontWeight: 400 }}>
                Aucun commentaire pour l'instant.
              </Box>
            ) : (
              <Box sx={{ p: "12px 16px" }}>
                {ticket.comments.map((c, idx) => (
                  <Box key={c.id} sx={{ display: "flex", gap: "10px", position: "relative", pb: idx < ticket.comments.length - 1 ? "14px" : "0" }}>
                    {idx < ticket.comments.length - 1 && (
                      <Box sx={{ position: "absolute", left: "12px", top: "26px", bottom: "0", width: "1px", background: "var(--border)" }} />
                    )}
                    <Box sx={{ flexShrink: 0, width: 26, height: 26, borderRadius: "6px", background: "linear-gradient(135deg, var(--accent), #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#fff", fontFamily: "var(--font-mono)", zIndex: 1 }}>
                      {getInitials(c.author.firstName, c.author.lastName)}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: "6px", mb: "4px" }}>
                        <Box sx={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>{c.author.firstName} {c.author.lastName}</Box>
                        <Box sx={{ fontSize: "10px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                          {format(new Date(c.createdAt), "dd MMM yyyy · HH:mm", { locale: fr })}
                        </Box>
                        {user?.id === c.authorId && (
                          <Box sx={{ display: "flex", gap: "2px", ml: "auto" }}>
                            <Box component="button" onClick={() => { setEditCommentTarget({ id: c.id, content: c.content }); setEditCommentValue(c.content); setEditCommentPreview(false); }}
                              sx={{ all: "unset", cursor: "pointer", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "5px", color: "var(--muted)", transition: "background 0.12s, color 0.12s", "&:hover": { background: "var(--accent-subtle)", color: "var(--accent)" } }}>
                              <EditOutlined sx={{ fontSize: 12 }} />
                            </Box>

                            <Box component="button" onClick={() => setDeleteCommentTarget(c.id)}
                              sx={{ all: "unset", cursor: "pointer", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "5px", color: "var(--muted)", transition: "background 0.12s, color 0.12s", "&:hover": { background: "var(--red-subtle)", color: "var(--red)" } }}>
                              <DeleteOutlineOutlined sx={{ fontSize: 12 }} />
                            </Box>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: "0 8px 8px 8px", p: "8px 12px", ...mdSx, fontSize: "12px" }}>
                        <ReactMarkdown>{c.content}</ReactMarkdown>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        </Box>

        {/* ── COLONNE DROITE ── */}
        <Box sx={{ width: { lg: "268px" }, flexShrink: 0, display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Card Détails (statut en première ligne) */}
          <Card title="Détails">
            <Box sx={{ mx: "-18px", px: "18px" }}>

              <Box sx={rowSx}>
                <Box sx={rowLabelSx}>Assigné à</Box>
                <Box sx={rowValueSx}>
                  {ticket.assignee
                    ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                    : <Box component="span" sx={{ color: "var(--muted)" }}>Non assigné</Box>
                  }
                </Box>
              </Box>

              <Box sx={rowSx}>
                <Box sx={rowLabelSx}>Projet</Box>
                <Box sx={rowValueSx}>{ticket.projectName ?? <Box component="span" sx={{ color: "var(--muted)" }}>—</Box>}</Box>
              </Box>

              <Box sx={rowSx}>
                <Box sx={rowLabelSx}>Estimation</Box>
                <Box sx={{ ...rowValueSx, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--cyan)" }}>
                  {fmtDuration(ticket.estimatedHours, null)}
                </Box>
              </Box>

              <Box sx={rowSx}>
                <Box sx={rowLabelSx}>Temps passé</Box>
                <Box sx={{ ...rowValueSx, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  {fmtDuration(null, ticket.timeSpentMinutes)}
                </Box>
              </Box>

              <Box sx={rowSx}>
                <Box sx={rowLabelSx}>Créé le</Box>
                <Box sx={{ ...rowValueSx, fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                  {format(new Date(ticket.createdAt), "dd MMM yyyy", { locale: fr })}
                </Box>
              </Box>

            </Box>
          </Card>

        </Box>
      </Box>

      {/* Modale commentaire */}
      <AppModal
        open={commentModal}
        onClose={() => !submitting && setCommentModal(false)}
        title="Nouveau commentaire"
        actions={
          <>
            <Button
              variant="outlined"
              size="small"
              className="btn-cancel"
              sx={{ textTransform: "none" }}
              onClick={() => setCommentModal(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{ textTransform: "none" }}
              onClick={handleAddComment}
              disabled={!comment.trim() || submitting}
            >
              {submitting ? (
                <CircularProgress size={14} sx={{ color: "#fff" }} />
              ) : (
                "Publier"
              )}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: "4px",
                background: "var(--s2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                p: "3px",
              }}
            >
              {(["Éditer", "Aperçu"] as const).map((tab) => {
                const active =
                  tab === "Éditer" ? !commentPreview : commentPreview;
                return (
                  <Box
                    key={tab}
                    component="button"
                    onClick={() => setCommentPreview(tab === "Aperçu")}
                    sx={{
                      all: "unset",
                      cursor: "pointer",
                      px: "12px",
                      height: "26px",
                      fontSize: "11px",
                      fontWeight: 600,
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      background: active ? "var(--s1)" : "transparent",
                      color: active ? "var(--text)" : "var(--muted)",
                      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                      transition: "all 0.12s",
                    }}
                  >
                    {tab}
                  </Box>
                );
              })}
            </Box>
            <Box
              sx={{
                fontSize: "10px",
                color: "var(--muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Markdown supporté
            </Box>
          </Box>
          {commentPreview ? (
            <Box
              sx={{
                background: "var(--s2)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                p: "14px 16px",
                minHeight: "150px",
                ...mdSx,
              }}
            >
              {comment ? <ReactMarkdown>{comment}</ReactMarkdown> : <Box sx={{ fontSize: "12px", color: "var(--muted)" }}>Aperçu vide</Box>}
            </Box>
          ) : (
            <Box
              component="textarea"
              autoFocus
              value={comment}
              rows={7}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setComment(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent) => {
                if (
                  e.key === "Enter" &&
                  (e.metaKey || e.ctrlKey) &&
                  comment.trim()
                )
                  handleAddComment();
              }}
              placeholder="Partagez une mise à jour, une information ou une question..."
              sx={{ ...fieldSx, resize: "none", lineHeight: 1.65 }}
            />
          )}
        </Box>
      </AppModal>

      <AppModal
        open={!!editCommentTarget}
        onClose={() => !editCommentSaving && setEditCommentTarget(null)}
        title="Modifier le commentaire"
        actions={
          <>
            <Button variant="outlined" size="small" className="btn-cancel" sx={{ textTransform: "none" }} onClick={() => setEditCommentTarget(null)} disabled={editCommentSaving}>Annuler</Button>
            <Button variant="contained" size="small" sx={{ textTransform: "none" }} onClick={handleEditComment} disabled={!editCommentValue.trim() || editCommentSaving}>
              {editCommentSaving ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : "Enregistrer"}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", gap: "4px", background: "var(--s2)", border: "1px solid var(--border)", borderRadius: "8px", p: "3px" }}>
              {(["Éditer", "Aperçu"] as const).map((tab) => {
                const active = tab === "Éditer" ? !editCommentPreview : editCommentPreview;
                return (
                  <Box key={tab} component="button" onClick={() => setEditCommentPreview(tab === "Aperçu")}
                    sx={{ all: "unset", cursor: "pointer", px: "12px", height: "26px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", display: "flex", alignItems: "center", background: active ? "var(--s1)" : "transparent", color: active ? "var(--text)" : "var(--muted)", boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none", transition: "all 0.12s" }}>
                    {tab}
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ fontSize: "10px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>Markdown supporté</Box>
          </Box>
          {editCommentPreview ? (
            <Box sx={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: "10px", p: "14px 16px", minHeight: "150px", ...mdSx }}>
              {editCommentValue ? <ReactMarkdown>{editCommentValue}</ReactMarkdown> : <Box sx={{ fontSize: "12px", color: "var(--muted)" }}>Aperçu vide</Box>}
            </Box>
          ) : (
            <Box component="textarea" autoFocus value={editCommentValue} rows={7}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditCommentValue(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && editCommentValue.trim()) handleEditComment(); }}
              sx={{ ...fieldSx, resize: "none", lineHeight: 1.65 }}
            />
          )}
        </Box>
      </AppModal>

      <DeleteModal
        open={!!deleteCommentTarget}
        onClose={() => setDeleteCommentTarget(null)}
        onConfirm={handleDeleteComment}
        loading={deleteCommentLoading}
        title="Supprimer ce commentaire ?"
      >
        Cette action est irréversible. Le commentaire sera définitivement supprimé.
      </DeleteModal>

    </>
  );
};
