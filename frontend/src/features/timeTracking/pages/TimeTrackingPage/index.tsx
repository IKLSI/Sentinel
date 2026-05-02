import React, { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { addDays, addWeeks, format, isSameWeek, startOfWeek } from "date-fns";
import { DeleteModal } from "@/components/DeleteModal";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useT } from "@/i18n/I18nContext";
import {
  CreateTimeEntryDto,
  TimeEntryDto,
  createTimeEntry,
  deleteTimeEntry,
  exportTimeEntriesExcel,
  getTimeEntries,
  updateTimeEntry,
} from "@/features/timeTracking/api/timeEntries";
import { ProjectDto, getProjects } from "@/features/techHealth/api/projects";
import { getTickets } from "@/features/tickets/api/tickets";
import { Ticket } from "@/types";
import {
  FormState,
  emptyForm,
  formatDuration,
  parseDateLocal,
} from "./helpers";
import { WeekCalendarCard } from "./components/WeekCalendarCard";
import { ProjectStatsCard } from "./components/ProjectStatsCard";
import { JournalCard } from "./components/JournalCard";
import { TimeEntryModal } from "./components/TimeEntryModal";
import { TimeEntryDetailModal } from "./components/TimeEntryDetailModal";
import { extractApiError } from "@/utils/apiError";

export const TimeTrackingPage: React.FC = () => {
  const t = useT();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

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
  const [exporting, setExporting] = useState(false);
  const [detailEntry, setDetailEntry] = useState<TimeEntryDto | null>(null);

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
      showToast(t("time_tracking.error_load_entries"), "error");
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd, showToast, t]);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportTimeEntriesExcel({
        from: format(weekStart, "yyyy-MM-dd"),
        to: format(weekEnd, "yyyy-MM-dd"),
      });
    } catch {
      showToast(t("time_tracking.error_export_entries"), "error");
    } finally {
      setExporting(false);
    }
  };

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
  const contributors = useMemo(
    () => new Set(weekEntries.map((e) => e.userId)).size,
    [weekEntries],
  );

  const statsByProject = useMemo(() => {
    const map = new Map<string, { name: string | null; minutes: number }>();
    weekEntries.forEach((e) => {
      const key = e.techProjectId ?? "__none__";
      const name = e.techProjectName ?? null;
      const ex = map.get(key);
      if (ex) ex.minutes += e.durationMinutes;
      else map.set(key, { name, minutes: e.durationMinutes });
    });
    return Array.from(map.values()).sort((a, b) => b.minutes - a.minutes);
  }, [weekEntries]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, TimeEntryDto[]>();
    weekDays.forEach((d) => map.set(format(d, "yyyy-MM-dd"), []));
    weekEntries.forEach((e) => {
      const l = map.get(e.date);
      if (l) l.push(e);
    });
    return map;
  }, [weekDays, weekEntries]);

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
      title: entry.title ?? "",
      description: entry.description ?? "",
      techProjectId: entry.techProjectId ?? "",
      ticketId: entry.ticketId ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || form.durationMinutes <= 0) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateTimeEntry(editingId, {
          date: form.date,
          durationMinutes: form.durationMinutes,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          techProjectId: form.techProjectId || null,
          ticketId: form.ticketId || null,
        });
        showToast(t("time_tracking.toast_entry_updated"), "success");
      } else {
        const payload: CreateTimeEntryDto = {
          date: form.date,
          durationMinutes: form.durationMinutes,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
        };
        if (form.techProjectId) payload.techProjectId = form.techProjectId;
        if (form.ticketId) payload.ticketId = form.ticketId;
        await createTimeEntry(payload);
        showToast(t("time_tracking.toast_entry_created"), "success");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      showToast(extractApiError(err, t("time_tracking.error_save_entry")), "error");
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
      showToast(t("time_tracking.toast_entry_deleted"), "success");
      await load();
    } catch (err) {
      showToast(extractApiError(err, t("time_tracking.error_delete_entry")), "error");
    } finally {
      setDeleting(false);
    }
  };

  const isCurrentWeek = weekOffset === 0;

  const handlePickDay = (newWeekStart: Date) => {
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const diff = Math.round(
      (newWeekStart.getTime() - currentWeekStart.getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    );
    setWeekOffset(diff);
  };

  return (
    <>
      <Box
        className="page-enter"
        sx={{
          p: "36px 24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <WeekCalendarCard
          weekStart={weekStart}
          weekEnd={weekEnd}
          weekDays={weekDays}
          isCurrentWeek={isCurrentWeek}
          totalMinutes={totalMinutes}
          entriesByDay={entriesByDay}
          onPrev={() => setWeekOffset((o) => o - 1)}
          onNext={() => setWeekOffset((o) => o + 1)}
          onResetToToday={() => setWeekOffset(0)}
          onPickDay={handlePickDay}
          onCreateForDate={openCreate}
        />

        {statsByProject.some((p) => p.name !== null) && (
          <ProjectStatsCard
            stats={statsByProject}
            totalMinutes={totalMinutes}
          />
        )}

        <JournalCard
          loading={loading}
          weekDays={weekDays}
          weekEntries={weekEntries}
          entriesByDay={entriesByDay}
          contributors={contributors}
          exporting={exporting}
          isAdmin={isAdmin}
          currentUserId={user?.id}
          onCreate={() => openCreate()}
          onExport={handleExport}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        onViewDetail={setDetailEntry}
        />
      </Box>

      <TimeEntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isEditing={!!editingId}
        form={form}
        onFormChange={setForm}
        submitting={submitting}
        onSubmit={handleSubmit}
        projects={projects}
        tickets={tickets}
      />

      <TimeEntryDetailModal
        open={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        entry={detailEntry}
        isAdmin={isAdmin}
        currentUserId={user?.id}
      />

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title={t("time_tracking.delete_modal_title")}
      >
        {deleteTarget?.title && (
          <>
            <strong>"{deleteTarget.title}"</strong> —{" "}
          </>
        )}
        {deleteTarget ? formatDuration(deleteTarget.durationMinutes) : ""}
        <br />
        {t("time_tracking.delete_modal_warning")}
      </DeleteModal>
    </>
  );
};
