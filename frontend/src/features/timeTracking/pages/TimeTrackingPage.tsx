import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Topbar } from "../../../layouts/Topbar";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useToast } from "../../../hooks/useToast";
import {
  getTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  TimeEntryDto,
  CreateTimeEntryDto,
} from "../api/timeEntries";
import { getProjects, ProjectDto } from "../../techHealth/api/projects";
import { getTickets } from "../../tickets/api/tickets";
import { Ticket } from "../../../types";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  isToday,
  isSameWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import ChevronLeftOutlined from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import { DurationPicker } from "../../../components/DurationPicker";

const WORK_HOURS_TARGET = 8 * 60;

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, "0")}`;
};

const parseDateLocal = (dateStr: string) => {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d);
};

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

type FormState = {
  date: string;
  durationMinutes: number;
  comment: string;
  techProjectId: string;
  ticketId: string;
};

const emptyForm = (date?: string): FormState => ({
  date: date ?? format(new Date(), "yyyy-MM-dd"),
  durationMinutes: 0,
  comment: "",
  techProjectId: "",
  ticketId: "",
});

export const TimeTrackingPage: React.FC = () => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<TimeEntryDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [deleteTarget, setDeleteTarget] = useState<TimeEntryDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addWeeks(base, weekOffset);
  }, [weekOffset]);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTimeEntries(
        format(weekStart, "yyyy-MM-dd"),
        format(weekEnd, "yyyy-MM-dd"),
      );
      setEntries(data);
    } catch {
      showToast("Impossible de charger les saisies", "error");
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd, showToast]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => {});
    getTickets({ pageSize: 200 })
      .then((r) => setTickets(r.items))
      .catch(() => {});
  }, []);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const weekEntries = useMemo(
    () =>
      entries.filter((e) =>
        isSameWeek(parseDateLocal(e.date), weekStart, { weekStartsOn: 1 }),
      ),
    [entries, weekStart],
  );

  const totalMinutes = weekEntries.reduce((s, e) => s + e.durationMinutes, 0);

  const statsByProject = useMemo(() => {
    const map = new Map<string, { name: string; minutes: number }>();
    weekEntries.forEach((e) => {
      const key = e.techProjectId ?? "__none__";
      const name = e.techProjectName ?? "Sans projet";
      const existing = map.get(key);
      if (existing) existing.minutes += e.durationMinutes;
      else map.set(key, { name, minutes: e.durationMinutes });
    });
    return Array.from(map.values()).sort((a, b) => b.minutes - a.minutes);
  }, [weekEntries]);

  const openCreate = (date?: string) => {
    setEditingId(null);
    setForm(emptyForm(date));
    setModalOpen(true);
  };

  const openEdit = (entry: TimeEntryDto) => {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      durationMinutes: entry.durationMinutes,
      comment: entry.comment ?? "",
      techProjectId: entry.techProjectId ?? "",
      ticketId: entry.ticketId ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.comment.trim() || form.durationMinutes <= 0) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateTimeEntry(editingId, {
          date: form.date,
          durationMinutes: form.durationMinutes,
          comment: form.comment.trim(),
          techProjectId: form.techProjectId || null,
          ticketId: form.ticketId || null,
        });
        showToast("Saisie modifiée", "success");
      } else {
        const payload: CreateTimeEntryDto = {
          date: form.date,
          durationMinutes: form.durationMinutes,
          comment: form.comment.trim(),
        };
        if (form.techProjectId) payload.techProjectId = form.techProjectId;
        if (form.ticketId) payload.ticketId = form.ticketId;
        await createTimeEntry(payload);
        showToast("Saisie enregistrée", "success");
      }
      setModalOpen(false);
      await load();
    } catch {
      showToast("Erreur lors de la saisie", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTimeEntry(deleteTarget.id);
      setDeleteTarget(null);
      showToast("Saisie supprimée", "success");
      await load();
    } catch {
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setDeleting(false);
    }
  };

  const weekLabel = `${format(weekStart, "dd MMM", { locale: fr })} — ${format(weekEnd, "dd MMM yyyy", { locale: fr })}`;
  const isCurrentWeek = weekOffset === 0;

  const entriesByDay = useMemo(() => {
    const map = new Map<string, TimeEntryDto[]>();
    weekDays.forEach((d) => map.set(format(d, "yyyy-MM-dd"), []));
    weekEntries.forEach((e) => {
      const list = map.get(e.date);
      if (list) list.push(e);
    });
    return map;
  }, [weekDays, weekEntries]);

  return (
    <>
      <Topbar
        title="Time Tracking"
        subtitle={weekLabel}
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
            onClick={() => openCreate()}
          >
            <AddOutlined sx={{ fontSize: 14 }} />
            Saisir du temps
          </Button>
        }
      />

      <div style={{ padding: "24px 28px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <KpiCard
            label="Total cette semaine"
            value={formatDuration(totalMinutes)}
            accent
          />
          <KpiCard label="Nb saisies" value={String(weekEntries.length)} />
          <KpiCard
            label="Moyenne / jour ouvré"
            value={formatDuration(Math.round(totalMinutes / 5))}
          />
        </div>

        {statsByProject.length > 0 && (
          <div
            style={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              padding: "16px 20px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--muted)",
                marginBottom: "12px",
                fontWeight: 500,
              }}
            >
              Répartition par projet
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {statsByProject.map((p) => {
                const pct =
                  totalMinutes > 0
                    ? Math.round((p.minutes / totalMinutes) * 100)
                    : 0;
                return (
                  <div key={p.name}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--text)",
                          fontWeight: 500,
                        }}
                      >
                        {p.name}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontFamily: "var(--font-mono)",
                          color: "var(--muted2)",
                        }}
                      >
                        {formatDuration(p.minutes)} · {pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: "4px",
                        background: "var(--s3)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--accent)",
                          borderRadius: "2px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div
            style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}
          >
            Vue semaine
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none", padding: "5px 10px" }}
              onClick={() => setWeekOffset((o) => o - 1)}
            >
              <ChevronLeftOutlined sx={{ fontSize: 14 }} />
            </Button>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                minWidth: "160px",
                textAlign: "center",
              }}
            >
              {weekLabel}
            </span>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none", padding: "5px 10px" }}
              onClick={() => setWeekOffset((o) => o + 1)}
              disabled={isCurrentWeek}
            >
              <ChevronRightOutlined sx={{ fontSize: 14 }} />
            </Button>
            {!isCurrentWeek && (
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: "none",
                  padding: "5px 10px",
                  minWidth: "36px",
                }}
                onClick={() => setWeekOffset(0)}
                title="Revenir à la semaine en cours"
                aria-label="Revenir à la semaine en cours"
              >
                <RefreshOutlined sx={{ fontSize: 14 }} />
              </Button>
            )}
          </div>
        </div>

        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            overflow: "hidden",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "1px",
              background: "var(--border)",
            }}
          >
            {weekDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayEntries = entriesByDay.get(dayStr) ?? [];
              const dayMinutes = dayEntries.reduce(
                (s, e) => s + e.durationMinutes,
                0,
              );
              const today = isToday(day);
              const isWeekend = [0, 6].includes(day.getDay());
              const pct = Math.min(
                100,
                Math.round((dayMinutes / WORK_HOURS_TARGET) * 100),
              );
              const barColor =
                dayMinutes === 0
                  ? "var(--border)"
                  : dayMinutes > WORK_HOURS_TARGET
                    ? "var(--red)"
                    : dayMinutes >= 6 * 60
                      ? "var(--green)"
                      : "var(--orange)";

              return (
                <button
                  key={dayStr}
                  onClick={() => openCreate(dayStr)}
                  style={{
                    background: today
                      ? "var(--accent-subtle)"
                      : isWeekend
                        ? "var(--s2)"
                        : "var(--s1)",
                    border: "none",
                    padding: "14px 10px",
                    cursor: "pointer",
                    transition: "background 0.12s",
                    fontFamily: "var(--font-ui)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onMouseEnter={(e) => {
                    if (!today) e.currentTarget.style.background = "var(--s3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = today
                      ? "var(--accent-subtle)"
                      : isWeekend
                        ? "var(--s2)"
                        : "var(--s1)";
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      color: today ? "var(--accent)" : "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontWeight: 500,
                    }}
                  >
                    {format(day, "EEE", { locale: fr })}
                  </div>
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: today ? "var(--accent)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: today
                        ? "#fff"
                        : isWeekend
                          ? "var(--muted)"
                          : "var(--text)",
                    }}
                  >
                    {format(day, "d")}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: dayMinutes > 0 ? barColor : "var(--muted)",
                    }}
                  >
                    {dayMinutes > 0 ? formatDuration(dayMinutes) : "—"}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "3px",
                      background: "var(--s3)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: barColor,
                        borderRadius: "2px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  {dayEntries.length > 0 && (
                    <div
                      style={{
                        fontSize: "9px",
                        color: "var(--muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {dayEntries.length} saisie
                      {dayEntries.length > 1 ? "s" : ""}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div
            style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}
          >
            Saisies de la semaine
          </div>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            {weekEntries.length} entrée{weekEntries.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "48px",
            }}
          >
            <CircularProgress size={24} />
          </div>
        ) : weekEntries.length === 0 ? (
          <div
            style={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              padding: "16px 20px",
              marginBottom: "8px",
            }}
          >
            <div className="empty-state">
              <div className="empty-state-icon">
                <AccessTimeOutlined sx={{ fontSize: 40 }} />
              </div>
              <div className="empty-state-title">
                Aucune saisie cette semaine
              </div>
              <div className="empty-state-subtitle">
                Cliquez sur un jour pour ajouter du temps
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {weekDays
              .filter(
                (d) =>
                  (entriesByDay.get(format(d, "yyyy-MM-dd")) ?? []).length > 0,
              )
              .map((day) => {
                const dayStr = format(day, "yyyy-MM-dd");
                const dayDate = parseDateLocal(dayStr);
                const isCurrentDay = isToday(dayDate);
                const dayEntries = entriesByDay.get(dayStr) ?? [];
                const dayMinutes = dayEntries.reduce(
                  (s, e) => s + e.durationMinutes,
                  0,
                );

                return (
                  <div key={dayStr}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 0",
                        marginBottom: "4px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: isCurrentDay
                              ? "var(--accent)"
                              : "var(--text)",
                            textTransform: "capitalize",
                          }}
                        >
                          {format(dayDate, "EEEE d MMMM", { locale: fr })}
                          {isCurrentDay && (
                            <span
                              style={{
                                marginLeft: "6px",
                                fontSize: "10px",
                                color: "var(--muted)",
                                fontWeight: 500,
                                textTransform: "none",
                              }}
                            >
                              • en cours
                            </span>
                          )}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "var(--muted2)",
                        }}
                      >
                        {formatDuration(dayMinutes)}
                      </span>
                    </div>

                    <div
                      style={{
                        background: "var(--s1)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r)",
                        overflow: "hidden",
                        marginBottom: "4px",
                      }}
                    >
                      {dayEntries.map((entry, idx) => (
                        <div
                          key={entry.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            padding: "12px 16px",
                            borderBottom:
                              idx < dayEntries.length - 1
                                ? "1px solid var(--border)"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              minWidth: "44px",
                              fontFamily: "var(--font-mono)",
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "var(--accent)",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {formatDuration(entry.durationMinutes)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "13px",
                                color: "var(--text)",
                                fontWeight: 500,
                                marginBottom: entry.techProjectName ? "3px" : 0,
                              }}
                            >
                              {entry.comment ?? "—"}
                            </div>
                            {entry.techProjectName && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                              >
                                <AccountTreeOutlined sx={{ fontSize: 10 }} style={{ color: 'var(--muted)' }} />
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--muted2)",
                                  }}
                                >
                                  {entry.techProjectName}
                                </span>
                              </div>
                            )}
                          </div>
                          {entry.ticketTitle && (
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "10px",
                                background: "var(--accent-subtle)",
                                color: "var(--accent)",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                whiteSpace: "nowrap",
                                fontWeight: 600,
                              }}
                            >
                              {entry.ticketTitle}
                            </span>
                          )}
                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                              flexShrink: 0,
                            }}
                          >
                            <ActionBtn
                              icon={<EditOutlined sx={{ fontSize: 13 }} />}
                              onClick={() => openEdit(entry)}
                              title="Modifier"
                            />
                            <ActionBtn
                              icon={<DeleteOutlineOutlined sx={{ fontSize: 13 }} />}
                              onClick={() => setDeleteTarget(entry)}
                              title="Supprimer"
                              danger
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
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
          {editingId ? "Modifier la saisie" : "Saisir du temps"}
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
                Date
              </label>
              <input
                type="date"
                style={inputStyle}
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
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
                Ticket (optionnel)
              </label>
              <select
                style={inputStyle}
                value={form.ticketId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ticketId: e.target.value }))
                }
              >
                <option value="">Aucun ticket</option>
                {tickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.reference} — {t.title}
                  </option>
                ))}
              </select>
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
                Projet (optionnel)
              </label>
              <select
                style={inputStyle}
                value={form.techProjectId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, techProjectId: e.target.value }))
                }
              >
                <option value="">Aucun projet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
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
                Description *
              </label>
              <input
                type="text"
                style={inputStyle}
                value={form.comment}
                onChange={(e) =>
                  setForm((f) => ({ ...f, comment: e.target.value }))
                }
                placeholder="Ce que vous avez fait..."
                autoFocus
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Durée
              </label>
              <DurationPicker
                value={form.durationMinutes}
                onChange={(v) => setForm((f) => ({ ...f, durationMinutes: v }))}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: "16px", pt: 0 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={() => setModalOpen(false)}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: "none" }}
            onClick={handleSubmit}
            disabled={!form.comment.trim() || submitting || form.durationMinutes <= 0}
          >
            {submitting
              ? "Enregistrement..."
              : editingId
                ? "Modifier"
                : "Enregistrer"}
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
          Supprimer la saisie
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text)" }}>
            Supprimer la saisie <strong>"{deleteTarget?.comment}"</strong> (
            {deleteTarget ? formatDuration(deleteTarget.durationMinutes) : ""})
            ? Cette action est irréversible.
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

const KpiCard: React.FC<{ label: string; value: string; accent?: boolean }> = ({
  label,
  value,
  accent,
}) => (
  <div
    style={{
      background: "var(--s1)",
      border: `1px solid ${accent ? "var(--accent-border)" : "var(--border)"}`,
      borderRadius: "var(--r)",
      padding: "20px 22px",
      boxShadow: "var(--shadow)",
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
        fontWeight: 500,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "28px",
        fontWeight: 800,
        color: accent ? "var(--accent)" : "var(--text)",
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}
    >
      {value}
    </div>
  </div>
);

const ActionBtn: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}> = ({ icon, onClick, title, danger }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--muted)",
      padding: "5px",
      borderRadius: "var(--r-sm)",
      display: "flex",
      alignItems: "center",
      transition: "color 0.12s, background 0.12s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = danger ? "var(--red)" : "var(--text)";
      e.currentTarget.style.background = danger
        ? "var(--red-subtle)"
        : "var(--s3)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = "var(--muted)";
      e.currentTarget.style.background = "transparent";
    }}
  >
    {icon}
  </button>
);
