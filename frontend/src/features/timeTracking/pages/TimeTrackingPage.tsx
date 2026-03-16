import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Topbar } from "../../../layouts/Topbar";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import { AppModal } from "../../../components/AppModal";
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
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import TodayOutlined from "@mui/icons-material/TodayOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import Popover from "@mui/material/Popover";
import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import { DurationPicker } from "../../../components/DurationPicker";

const WORK_HOURS_TARGET = 7 * 60;
const WEEK_TARGET = 5 * WORK_HOURS_TARGET;

const PROJECT_PALETTE = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#14b8a6",
  "#3b82f6", "#f97316",
];

const getProjectColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PROJECT_PALETTE[Math.abs(hash) % PROJECT_PALETTE.length];
};

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
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

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

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getProjects().then(setProjects).catch(() => {});
    getTickets({ pageSize: 200 }).then((r) => setTickets(r.items)).catch(() => {});
  }, []);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const weekEntries = useMemo(
    () => entries.filter((e) =>
      isSameWeek(parseDateLocal(e.date), weekStart, { weekStartsOn: 1 }),
    ),
    [entries, weekStart],
  );

  const totalMinutes = weekEntries.reduce((s, e) => s + e.durationMinutes, 0);
  const weekPct = Math.min(100, Math.round((totalMinutes / WEEK_TARGET) * 100));

  const statsByProject = useMemo(() => {
    const map = new Map<string, { name: string; minutes: number }>();
    weekEntries.forEach((e) => {
      const key = e.techProjectId ?? "__none__";
      const name = e.techProjectName ?? "Sans projet";
      const ex = map.get(key);
      if (ex) ex.minutes += e.durationMinutes;
      else map.set(key, { name, minutes: e.durationMinutes });
    });
    return Array.from(map.values()).sort((a, b) => b.minutes - a.minutes);
  }, [weekEntries]);

  const openCreate = (date?: string) => { setEditingId(null); setForm(emptyForm(date)); setModalOpen(true); };
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
          date: form.date, durationMinutes: form.durationMinutes,
          comment: form.comment.trim(),
          techProjectId: form.techProjectId || null,
          ticketId: form.ticketId || null,
        });
        showToast("Saisie modifiée", "success");
      } else {
        const payload: CreateTimeEntryDto = {
          date: form.date, durationMinutes: form.durationMinutes, comment: form.comment.trim(),
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

  const weekLabel = `Semaine du ${format(weekStart, "dd MMM", { locale: fr })} au ${format(weekEnd, "dd MMM yyyy", { locale: fr })}`;
  const isCurrentWeek = weekOffset === 0;

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const start = startOfWeek(firstDay, { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [calendarMonth]);

  const handleCalendarDayClick = (day: Date) => {
    const selectedWeekStart = startOfWeek(day, { weekStartsOn: 1 });
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const diff = Math.round((selectedWeekStart.getTime() - currentWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    setWeekOffset(diff);
    setCalendarAnchor(null);
  };

  const entriesByDay = useMemo(() => {
    const map = new Map<string, TimeEntryDto[]>();
    weekDays.forEach((d) => map.set(format(d, "yyyy-MM-dd"), []));
    weekEntries.forEach((e) => { const l = map.get(e.date); if (l) l.push(e); });
    return map;
  }, [weekDays, weekEntries]);

  return (
    <>
      <Topbar
        title=""
        subtitle={undefined}
      />

      <Box sx={{ p: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* ── Week grid card ── */}
        <SectionCard
          title={
            <Box component="span" sx={{ display: "inline-flex", alignItems: "baseline", gap: "6px" }}>
              <Box component="span">Vue hebdomadaire</Box>
              {totalMinutes > 0 && (
                <>
                  <Box component="span" sx={{ color: "var(--border2)", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>·</Box>
                  <Box component="span" sx={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color: "var(--muted2)", letterSpacing: 0, textTransform: "none" }}>
                    {formatDuration(totalMinutes)}
                  </Box>
                </>
              )}
            </Box>
          }
          action={
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {!isCurrentWeek && (
                <Box
                  component="button"
                  onClick={() => setWeekOffset(0)}
                  sx={{
                    display: "flex", alignItems: "center", gap: "4px",
                    background: "var(--accent-subtle)",
                    border: "1px solid var(--accent-border)",
                    borderRadius: "6px",
                    px: "8px", height: "26px",
                    cursor: "pointer", color: "var(--accent)",
                    fontSize: "11px", fontWeight: 600,
                    fontFamily: "var(--font-ui)",
                    transition: "background 0.12s",
                    "&:hover": { background: "rgba(99,102,241,0.15)" },
                  }}
                >
                  <TodayOutlined sx={{ fontSize: 12 }} />
                  Aujourd'hui
                </Box>
              )}
              <IconNavBtn onClick={() => setWeekOffset((o) => o - 1)}>
                <ChevronLeftOutlined sx={{ fontSize: 14 }} />
              </IconNavBtn>
              <IconNavBtn onClick={() => setWeekOffset((o) => o + 1)} disabled={isCurrentWeek}>
                <ChevronRightOutlined sx={{ fontSize: 14 }} />
              </IconNavBtn>
              <Box
                component="button"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { setCalendarMonth(weekStart); setCalendarAnchor(e.currentTarget); }}
                sx={{
                  background: calendarAnchor ? "var(--accent-subtle)" : "var(--s1)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  width: "26px", height: "26px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  color: calendarAnchor ? "var(--accent)" : "var(--muted2)",
                  fontFamily: "var(--font-ui)",
                  transition: "background 0.12s, color 0.12s",
                  "&:hover": { background: "var(--s3)", color: "var(--text)" },
                }}
              >
                <CalendarTodayOutlined sx={{ fontSize: 12 }} />
              </Box>
            </Box>
          }
          noPadding
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              borderTop: "1px solid var(--border)",
            }}
          >
            {weekDays.map((day, idx) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayEntries = entriesByDay.get(dayStr) ?? [];
              const dayMinutes = dayEntries.reduce((s, e) => s + e.durationMinutes, 0);
              const today = isToday(day);
              const isWeekend = [0, 6].includes(day.getDay());
              const pct = Math.min(100, Math.round((dayMinutes / WORK_HOURS_TARGET) * 100));
              const barColor = dayMinutes === 0
                ? "var(--border)"
                : dayMinutes > WORK_HOURS_TARGET ? "var(--red)"
                : dayMinutes >= 6 * 60 ? "var(--green)"
                : "var(--orange)";

              return (
                <Box
                  key={dayStr}
                  component="button"
                  onClick={() => openCreate(dayStr)}
                  sx={{
                    background: today
                      ? "linear-gradient(180deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.04) 100%)"
                      : isWeekend ? "var(--s2)" : "var(--s1)",
                    borderRight: idx < 6 ? "1px solid var(--border)" : "none",
                    borderTop: today ? "2px solid var(--accent)" : "none",
                    border: "none",
                    padding: "16px 10px 14px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "var(--font-ui)",
                    minHeight: "80px",
                    transition: "background 0.15s",
                    position: "relative",
                    "&:hover": { background: today ? "rgba(99,102,241,0.12)" : isWeekend ? "var(--s3)" : "var(--s2)" },
                  }}
                >
                  <Box sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: today ? "var(--accent)" : isWeekend ? "var(--border2)" : "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                  }}>
                    {format(day, "EEE", { locale: fr })}
                  </Box>

                  <Box sx={{
                    width: "30px", height: "30px",
                    borderRadius: "50%",
                    background: today ? "var(--accent)" : "transparent",
                    boxShadow: today ? "0 2px 8px rgba(99,102,241,0.4)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", fontWeight: 700,
                    color: today ? "#fff" : isWeekend ? "var(--muted)" : "var(--text)",
                  }}>
                    {format(day, "d")}
                  </Box>

                  <Box sx={{
                    width: "100%", height: "4px",
                    background: "var(--s3)", borderRadius: "2px",
                    overflow: "hidden",
                  }}>
                    {pct > 0 && (
                      <Box sx={{
                        height: "100%", width: `${pct}%`,
                        background: barColor, borderRadius: "2px",
                        transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
                      }} />
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </SectionCard>

        {/* ── Project distribution ── */}
        {statsByProject.length > 0 && (
          <SectionCard title="Répartition par projet">
            <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {statsByProject.map((p) => {
                const pct = totalMinutes > 0 ? Math.round((p.minutes / totalMinutes) * 100) : 0;
                const color = getProjectColor(p.name);
                return (
                  <Box key={p.name} sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Box sx={{
                      width: "3px", height: "32px", borderRadius: "2px",
                      background: color, flexShrink: 0, opacity: 0.85,
                    }} />
                    <Box component="span" sx={{
                      fontSize: "12.5px", color: "var(--text)", fontWeight: 500,
                      minWidth: "130px", letterSpacing: "-0.01em",
                    }}>
                      {p.name}
                    </Box>
                    <Box sx={{
                      flex: 1, height: "4px",
                      background: "var(--s3)", borderRadius: "2px", overflow: "hidden",
                    }}>
                      <Box sx={{
                        height: "100%", width: `${pct}%`,
                        background: color, borderRadius: "2px",
                        transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
                        opacity: 0.9,
                      }} />
                    </Box>
                    <Box sx={{
                      fontFamily: "var(--font-mono)",
                      display: "flex", alignItems: "center", gap: "14px",
                      minWidth: "88px", justifyContent: "flex-end",
                    }}>
                      <Box component="span" sx={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>
                        {formatDuration(p.minutes)}
                      </Box>
                      <Box component="span" sx={{ fontSize: "11px", color: "var(--muted)", minWidth: "28px", textAlign: "right" }}>
                        {pct}%
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </SectionCard>
        )}

        {/* ── Journal ── */}
        <SectionCard
          title="Journal"
          noPadding
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: "40px" }}>
              <CircularProgress size={22} />
            </Box>
          ) : weekEntries.length === 0 ? (
            <Box className="empty-state">
              <Box className="empty-state-icon"><AccessTimeOutlined sx={{ fontSize: 36 }} /></Box>
              <Box className="empty-state-title">Aucune saisie cette semaine</Box>
              <Box className="empty-state-subtitle">
                Cliquez sur un jour dans le calendrier pour ajouter du temps
              </Box>
            </Box>
          ) : (
            <Box>
              {weekDays
                .filter((d) => (entriesByDay.get(format(d, "yyyy-MM-dd")) ?? []).length > 0)
                .map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const dayDate = parseDateLocal(dayStr);
                  const isCurrentDay = isToday(dayDate);
                  const dayEntries = entriesByDay.get(dayStr) ?? [];
                  const dayMinutes = dayEntries.reduce((s, e) => s + e.durationMinutes, 0);

                  return (
                    <Box key={dayStr}>
                      <Box sx={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        px: "16px", py: "9px",
                        borderTop: "1px solid var(--border)",
                        borderLeft: isCurrentDay ? "3px solid var(--accent)" : "3px solid transparent",
                        background: isCurrentDay ? "rgba(99,102,241,0.04)" : "var(--s2)",
                      }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Box component="span" sx={{
                            fontSize: "12px", fontWeight: 700,
                            color: isCurrentDay ? "var(--accent)" : "var(--text)",
                            textTransform: "capitalize",
                            letterSpacing: "-0.01em",
                          }}>
                            {format(dayDate, "EEEE d MMMM", { locale: fr })}
                          </Box>
                          {isCurrentDay && (
                            <Box component="span" sx={{
                              fontSize: "10px",
                              background: "var(--accent-subtle)", color: "var(--accent)",
                              padding: "1px 7px", borderRadius: "4px", fontWeight: 600,
                              letterSpacing: "0.02em",
                            }}>
                              Aujourd'hui
                            </Box>
                          )}
                        </Box>
                        <Box component="span" sx={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "12px", fontWeight: 800,
                          color: isCurrentDay ? "var(--accent)" : "var(--muted2)",
                        }}>
                          {formatDuration(dayMinutes)}
                        </Box>
                      </Box>

                      {dayEntries.map((entry) => {
                        const projColor = entry.techProjectName
                          ? getProjectColor(entry.techProjectName)
                          : "var(--border2)";
                        return (
                          <Box
                            key={entry.id}
                            sx={{
                              display: "flex", alignItems: "center",
                              gap: "0",
                              borderTop: "1px solid var(--border)",
                              transition: "background 0.1s",
                              "&:hover": { background: "var(--s2)" },
                              "&:hover .tt-actions": { opacity: 1 },
                            }}
                          >
                            <Box sx={{ width: "4px", alignSelf: "stretch", background: projColor, flexShrink: 0, opacity: 0.75 }} />
                            <Box sx={{
                              px: "16px", py: "12px",
                              fontFamily: "var(--font-mono)",
                              fontSize: "13px", fontWeight: 800,
                              color: "var(--accent)",
                              minWidth: "60px", flexShrink: 0,
                              letterSpacing: "-0.02em",
                            }}>
                              {formatDuration(entry.durationMinutes)}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0, py: "12px" }}>
                              <Box sx={{
                                fontSize: "13px", color: "var(--text)", fontWeight: 500,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                letterSpacing: "-0.01em",
                                mb: (entry.techProjectName || entry.ticketTitle) ? "4px" : 0,
                              }}>
                                {entry.comment ?? "—"}
                              </Box>
                              {(entry.techProjectName || entry.ticketTitle) && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  {entry.techProjectName && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                      <Box sx={{ width: "5px", height: "5px", borderRadius: "50%", background: projColor, flexShrink: 0 }} />
                                      <Box component="span" sx={{ fontSize: "11px", color: "var(--muted2)", fontWeight: 500, letterSpacing: "-0.01em" }}>
                                        {entry.techProjectName}
                                      </Box>
                                    </Box>
                                  )}
                                  {entry.techProjectName && entry.ticketTitle && (
                                    <Box component="span" sx={{ fontSize: "10px", color: "var(--border2)" }}>·</Box>
                                  )}
                                  {entry.ticketTitle && (
                                    <Box component="span" sx={{
                                      fontFamily: "var(--font-mono)", fontSize: "10px",
                                      background: "var(--accent-subtle)", color: "var(--accent)",
                                      padding: "2px 7px", borderRadius: "4px", fontWeight: 600,
                                      whiteSpace: "nowrap", letterSpacing: "0.01em",
                                    }}>
                                      {entry.ticketTitle}
                                    </Box>
                                  )}
                                </Box>
                              )}
                            </Box>
                            <Box
                              className="tt-actions"
                              sx={{
                                display: "flex", alignItems: "center", gap: "2px",
                                px: "12px", opacity: 0,
                                transition: "opacity 0.15s", flexShrink: 0,
                              }}
                            >
                              <RowActionBtn
                                icon={<EditOutlined sx={{ fontSize: 13 }} />}
                                onClick={() => openEdit(entry)}
                                title="Modifier"
                              />
                              <RowActionBtn
                                icon={<DeleteOutlineOutlined sx={{ fontSize: 13 }} />}
                                onClick={() => setDeleteTarget(entry)}
                                title="Supprimer"
                                danger
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}
            </Box>
          )}
        </SectionCard>
      </Box>

      {/* ── Calendrier picker ── */}
      <Popover
        open={!!calendarAnchor}
        anchorEl={calendarAnchor}
        onClose={() => setCalendarAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              p: "12px",
              mt: "4px",
              width: "224px",
            },
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "10px" }}>
          <IconNavBtn onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
            <ChevronLeftOutlined sx={{ fontSize: 14 }} />
          </IconNavBtn>
          <Box sx={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", textTransform: "capitalize" }}>
            {format(calendarMonth, "MMMM yyyy", { locale: fr })}
          </Box>
          <IconNavBtn onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
            <ChevronRightOutlined sx={{ fontSize: 14 }} />
          </IconNavBtn>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: "4px" }}>
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <Box key={i} sx={{ textAlign: "center", fontSize: "9px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.05em", py: "3px" }}>
              {d}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px" }}>
          {calendarGrid.map((day, i) => {
            const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
            const isInSelectedWeek = isSameWeek(day, weekStart, { weekStartsOn: 1 });
            const todayDay = isToday(day);
            return (
              <Box
                key={i}
                component="button"
                onClick={() => handleCalendarDayClick(day)}
                sx={{
                  background: isInSelectedWeek ? "var(--accent-subtle)" : "transparent",
                  border: "none",
                  borderRadius: "5px",
                  height: "28px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: todayDay ? 800 : isInSelectedWeek ? 600 : 400,
                  color: todayDay
                    ? "var(--accent)"
                    : isInSelectedWeek
                    ? "var(--text)"
                    : isCurrentMonth
                    ? "var(--text)"
                    : "var(--border2)",
                  transition: "background 0.1s",
                  "&:hover": { background: isInSelectedWeek ? "rgba(99,102,241,0.18)" : "var(--s3)" },
                }}
              >
                {format(day, "d")}
              </Box>
            );
          })}
        </Box>
      </Popover>

      {/* ── Modal saisie ── */}
      <AppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Modifier la saisie" : "Saisir du temps"}
        actions={
          <>
            <Button variant="outlined" size="small" sx={{ textTransform: "none" }} onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="contained" size="small" sx={{ textTransform: "none" }}
              onClick={handleSubmit}
              disabled={!form.comment.trim() || submitting || form.durationMinutes <= 0}
            >
              {submitting ? "Enregistrement..." : editingId ? "Modifier" : "Enregistrer"}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <FormField label="Date">
              <Box component="input" type="date" sx={inputSx}
                value={form.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </FormField>
            <FormField
              label="Durée"
              labelSuffix={
                <Tooltip title="Formats acceptés : 2h, 1h30, 45m" placement="top" arrow>
                  <InfoOutlined sx={{ fontSize: 12, color: "var(--muted)", cursor: "help", verticalAlign: "middle" }} />
                </Tooltip>
              }
            >
              <DurationPicker value={form.durationMinutes} onChange={(v) => setForm((f) => ({ ...f, durationMinutes: v }))} />
            </FormField>
          </Box>

          <FormField label="Description *">
            <Box component="input" type="text" sx={inputSx}
              value={form.comment}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((f) => ({ ...f, comment: e.target.value }))
              }
              placeholder="Ce que vous avez fait..."
              autoFocus
            />
          </FormField>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <FormField label="Ticket (optionnel)">
              <Box component="select" sx={inputSx}
                value={form.ticketId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForm((f) => ({ ...f, ticketId: e.target.value }))
                }
              >
                <option value="">Aucun ticket</option>
                {tickets.map((t) => (
                  <option key={t.id} value={t.id}>{t.reference} — {t.title}</option>
                ))}
              </Box>
            </FormField>
            <FormField label="Projet (optionnel)">
              <Box component="select" sx={inputSx}
                value={form.techProjectId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForm((f) => ({ ...f, techProjectId: e.target.value }))
                }
              >
                <option value="">Aucun projet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Box>
            </FormField>
          </Box>
        </Box>
      </AppModal>

      {/* ── Modal suppression ── */}
      <AppModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer la saisie"
        actions={
          <>
            <Button variant="outlined" size="small" sx={{ textTransform: "none" }} onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="contained" color="error" size="small" sx={{ textTransform: "none" }} onClick={handleDelete} disabled={deleting}>
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </>
        }
      >
        <Box component="p" sx={{ margin: 0, fontSize: "14px", color: "var(--text)" }}>
          Supprimer <strong>"{deleteTarget?.comment}"</strong> ({deleteTarget ? formatDuration(deleteTarget.durationMinutes) : ""}) ? Cette action est irréversible.
        </Box>
      </AppModal>
    </>
  );
};

// ── Shared styles ──

const inputSx = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
  px: "12px", py: "8px",
  fontSize: "13px",
  color: "var(--text)",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box" as const,
};

// ── Components ──

const SectionCard: React.FC<{
  title: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
  children: React.ReactNode;
}> = ({ title, action, noPadding, children }) => (
  <Box sx={{
    background: "var(--s1)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    overflow: "hidden",
  }}>
    <Box sx={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      px: "16px", py: "10px", minHeight: "44px",
      borderBottom: "1px solid var(--border)",
    }}>
      <Box sx={{
        fontSize: "11px", fontWeight: 700,
        color: "var(--muted)", letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        {title}
      </Box>
      {action}
    </Box>
    <Box sx={noPadding ? {} : { p: "14px 16px" }}>
      {children}
    </Box>
  </Box>
);

const KpiCard: React.FC<{
  label: string;
  value: string;
  color: string;
  sub?: string;
  progress?: number;
}> = ({ label, value, color, sub, progress }) => (
  <Box sx={{
    background: "var(--s1)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "16px 18px",
    borderTop: `2px solid ${color}`,
    boxShadow: "var(--shadow)",
  }}>
    <Box sx={{
      fontSize: "10px", fontWeight: 600,
      color: "var(--muted)", letterSpacing: "0.1em",
      textTransform: "uppercase", mb: "10px",
    }}>
      {label}
    </Box>
    <Box sx={{
      fontSize: "30px", fontWeight: 800,
      fontFamily: "var(--font-mono)",
      color: "var(--text)", letterSpacing: "-0.04em",
      lineHeight: 1, mb: "8px",
    }}>
      {value}
    </Box>
    {progress !== undefined && (
      <Box sx={{ height: "3px", background: "var(--s3)", borderRadius: "2px", overflow: "hidden", mb: "6px" }}>
        <Box sx={{
          height: "100%", width: `${progress}%`,
          background: color, borderRadius: "2px",
          transition: "width 0.4s ease",
        }} />
      </Box>
    )}
    {sub && (
      <Box sx={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
        {sub}
      </Box>
    )}
  </Box>
);

const FormField: React.FC<{ label: string; labelSuffix?: React.ReactNode; children: React.ReactNode }> = ({ label, labelSuffix, children }) => (
  <Box>
    <Box sx={{
      display: "flex", alignItems: "center", gap: "5px", mb: "5px",
    }}>
      <Box component="label" sx={{
        fontSize: "11px", fontWeight: 600,
        color: "var(--muted2)", letterSpacing: "0.04em",
      }}>
        {label}
      </Box>
      {labelSuffix}
    </Box>
    {children}
  </Box>
);

const IconNavBtn: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
  <Box
    component="button"
    onClick={onClick}
    disabled={disabled}
    sx={{
      background: "var(--s1)",
      border: "1px solid var(--border)",
      borderRadius: "6px",
      width: "26px", height: "26px",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: disabled ? "not-allowed" : "pointer",
      color: disabled ? "var(--border2)" : "var(--muted2)",
      fontFamily: "var(--font-ui)",
      transition: "background 0.12s, color 0.12s",
      ...(!disabled ? { "&:hover": { background: "var(--s3)", color: "var(--text)" } } : {}),
    }}
  >
    {children}
  </Box>
);

const RowActionBtn: React.FC<{ icon: React.ReactNode; onClick: () => void; title: string; danger?: boolean }> = ({ icon, onClick, title, danger }) => (
  <Box
    component="button"
    title={title}
    onClick={onClick}
    sx={{
      background: "none", border: "none",
      cursor: "pointer", color: "var(--muted)",
      padding: "5px", borderRadius: "6px",
      display: "flex", alignItems: "center",
      fontFamily: "var(--font-ui)",
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
