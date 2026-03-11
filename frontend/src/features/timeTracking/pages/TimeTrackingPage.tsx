import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Topbar } from "../../../layouts/Topbar";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
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

      <Box sx={{ p: "24px 28px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "14px",
            mb: "24px",
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
        </Box>

        {statsByProject.length > 0 && (
          <Box
            sx={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              padding: "16px 20px",
              mb: "16px",
            }}
          >
            <Box
              sx={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--muted)",
                mb: "12px",
                fontWeight: 500,
              }}
            >
              Répartition par projet
            </Box>
            <Box className="d-flex flex-column" sx={{ gap: "8px" }}>
              {statsByProject.map((p) => {
                const pct =
                  totalMinutes > 0
                    ? Math.round((p.minutes / totalMinutes) * 100)
                    : 0;
                return (
                  <Box key={p.name}>
                    <Box
                      className="d-flex justify-content-between"
                      sx={{ mb: "4px" }}
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: "12px",
                          color: "var(--text)",
                          fontWeight: 500,
                        }}
                      >
                        {p.name}
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          fontSize: "12px",
                          fontFamily: "var(--font-mono)",
                          color: "var(--muted2)",
                        }}
                      >
                        {formatDuration(p.minutes)} · {pct}%
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        height: "4px",
                        background: "var(--s3)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--accent)",
                          borderRadius: "2px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        <Box
          className="d-flex align-items-center justify-content-between"
          sx={{ mb: "12px" }}
        >
          <Box sx={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
            Vue semaine
          </Box>
          <Box className="d-flex align-items-center gap-2">
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none", padding: "5px 10px" }}
              onClick={() => setWeekOffset((o) => o - 1)}
            >
              <ChevronLeftOutlined sx={{ fontSize: 14 }} />
            </Button>
            <Box
              component="span"
              sx={{
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                minWidth: "160px",
                textAlign: "center",
              }}
            >
              {weekLabel}
            </Box>
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
          </Box>
        </Box>

        <Box
          sx={{
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            overflow: "hidden",
            mb: "16px",
          }}
        >
          <Box
            sx={{
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
                <Box
                  key={dayStr}
                  component="button"
                  onClick={() => openCreate(dayStr)}
                  sx={{
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
                    "&:hover": {
                      background: today ? "var(--accent-subtle)" : "var(--s3)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "9px",
                      color: today ? "var(--accent)" : "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontWeight: 500,
                    }}
                  >
                    {format(day, "EEE", { locale: fr })}
                  </Box>
                  <Box
                    sx={{
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
                  </Box>
                  <Box
                    sx={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: dayMinutes > 0 ? barColor : "var(--muted)",
                    }}
                  >
                    {dayMinutes > 0 ? formatDuration(dayMinutes) : "—"}
                  </Box>
                  <Box
                    sx={{
                      width: "100%",
                      height: "3px",
                      background: "var(--s3)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${pct}%`,
                        background: barColor,
                        borderRadius: "2px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </Box>
                  {dayEntries.length > 0 && (
                    <Box
                      sx={{
                        fontSize: "9px",
                        color: "var(--muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {dayEntries.length} saisie
                      {dayEntries.length > 1 ? "s" : ""}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box
          className="d-flex align-items-center justify-content-between"
          sx={{ mb: "12px" }}
        >
          <Box sx={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
            Saisies de la semaine
          </Box>
          <Box component="span" sx={{ fontSize: "12px", color: "var(--muted)" }}>
            {weekEntries.length} entrée{weekEntries.length !== 1 ? "s" : ""}
          </Box>
        </Box>

        {loading ? (
          <Box className="d-flex justify-content-center" sx={{ p: "48px" }}>
            <CircularProgress size={24} />
          </Box>
        ) : weekEntries.length === 0 ? (
          <Box
            sx={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r)",
              padding: "16px 20px",
              mb: "8px",
            }}
          >
            <Box className="empty-state">
              <Box className="empty-state-icon">
                <AccessTimeOutlined sx={{ fontSize: 40 }} />
              </Box>
              <Box className="empty-state-title">
                Aucune saisie cette semaine
              </Box>
              <Box className="empty-state-subtitle">
                Cliquez sur un jour pour ajouter du temps
              </Box>
            </Box>
          </Box>
        ) : (
          <Box className="d-flex flex-column" sx={{ gap: "8px" }}>
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
                  <Box key={dayStr}>
                    <Box
                      className="d-flex align-items-center justify-content-between"
                      sx={{ padding: "6px 0", mb: "4px" }}
                    >
                      <Box className="d-flex align-items-center gap-2">
                        <Box
                          component="span"
                          sx={{
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
                            <Box
                              component="span"
                              sx={{
                                ml: "6px",
                                fontSize: "10px",
                                color: "var(--muted)",
                                fontWeight: 500,
                                textTransform: "none",
                              }}
                            >
                              • en cours
                            </Box>
                          )}
                        </Box>
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "var(--muted2)",
                        }}
                      >
                        {formatDuration(dayMinutes)}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        background: "var(--s1)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r)",
                        overflow: "hidden",
                        mb: "4px",
                      }}
                    >
                      {dayEntries.map((entry, idx) => (
                        <Box
                          key={entry.id}
                          className="d-flex align-items-center"
                          sx={{
                            gap: "14px",
                            padding: "12px 16px",
                            borderBottom:
                              idx < dayEntries.length - 1
                                ? "1px solid var(--border)"
                                : "none",
                          }}
                        >
                          <Box
                            sx={{
                              minWidth: "44px",
                              fontFamily: "var(--font-mono)",
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "var(--accent)",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {formatDuration(entry.durationMinutes)}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                fontSize: "13px",
                                color: "var(--text)",
                                fontWeight: 500,
                                mb: entry.techProjectName ? "3px" : 0,
                              }}
                            >
                              {entry.comment ?? "—"}
                            </Box>
                            {entry.techProjectName && (
                              <Box className="d-flex align-items-center" sx={{ gap: "5px" }}>
                                <AccountTreeOutlined
                                  sx={{ fontSize: 10, color: "var(--muted)" }}
                                />
                                <Box
                                  component="span"
                                  sx={{
                                    fontSize: "11px",
                                    color: "var(--muted2)",
                                  }}
                                >
                                  {entry.techProjectName}
                                </Box>
                              </Box>
                            )}
                          </Box>
                          {entry.ticketTitle && (
                            <Box
                              component="span"
                              sx={{
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
                            </Box>
                          )}
                          <Box className="d-flex flex-shrink-0" sx={{ gap: "4px" }}>
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
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })}
          </Box>
        )}
      </Box>

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
          <Box className="d-flex flex-column" sx={{ gap: "14px" }}>
            <Box>
              <Box
                component="label"
                sx={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  mb: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Date
              </Box>
              <Box
                component="input"
                type="date"
                sx={{
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
                }}
                value={form.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </Box>
            <Box>
              <Box
                component="label"
                sx={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  mb: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Ticket (optionnel)
              </Box>
              <Box
                component="select"
                sx={{
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
                }}
                value={form.ticketId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForm((f) => ({ ...f, ticketId: e.target.value }))
                }
              >
                <option value="">Aucun ticket</option>
                {tickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.reference} — {t.title}
                  </option>
                ))}
              </Box>
            </Box>
            <Box>
              <Box
                component="label"
                sx={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  mb: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Projet (optionnel)
              </Box>
              <Box
                component="select"
                sx={{
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
                }}
                value={form.techProjectId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForm((f) => ({ ...f, techProjectId: e.target.value }))
                }
              >
                <option value="">Aucun projet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Box>
            </Box>
            <Box>
              <Box
                component="label"
                sx={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  mb: "5px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Description *
              </Box>
              <Box
                component="input"
                type="text"
                sx={{
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
                }}
                value={form.comment}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((f) => ({ ...f, comment: e.target.value }))
                }
                placeholder="Ce que vous avez fait..."
                autoFocus
              />
            </Box>
            <Box>
              <Box
                component="label"
                sx={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  mb: "8px",
                  color: "var(--muted2)",
                  letterSpacing: "0.04em",
                }}
              >
                Durée
              </Box>
              <DurationPicker
                value={form.durationMinutes}
                onChange={(v) => setForm((f) => ({ ...f, durationMinutes: v }))}
              />
            </Box>
          </Box>
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
          <Box component="p" sx={{ margin: 0, fontSize: "14px", color: "var(--text)" }}>
            Supprimer la saisie <strong>"{deleteTarget?.comment}"</strong> (
            {deleteTarget ? formatDuration(deleteTarget.durationMinutes) : ""})
            ? Cette action est irréversible.
          </Box>
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
  <Box
    sx={{
      background: "var(--s1)",
      border: `1px solid ${accent ? "var(--accent-border)" : "var(--border)"}`,
      borderRadius: "var(--r)",
      padding: "20px 22px",
      boxShadow: "var(--shadow)",
    }}
  >
    <Box
      sx={{
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "var(--muted)",
        mb: "12px",
        fontWeight: 500,
      }}
    >
      {label}
    </Box>
    <Box
      sx={{
        fontSize: "28px",
        fontWeight: 800,
        color: accent ? "var(--accent)" : "var(--text)",
        letterSpacing: "-0.03em",
        lineHeight: 1,
      }}
    >
      {value}
    </Box>
  </Box>
);

const ActionBtn: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}> = ({ icon, onClick, title, danger }) => (
  <Box
    component="button"
    title={title}
    onClick={onClick}
    sx={{
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--muted)",
      padding: "5px",
      borderRadius: "var(--r-sm)",
      display: "flex",
      alignItems: "center",
      transition: "color 0.12s, background 0.12s",
      "&:hover": {
        color: danger ? "var(--red)" : "var(--text)",
        background: danger ? "var(--red-subtle)" : "var(--s3)",
      },
    }}
  >
    {icon}
  </Box>
);
