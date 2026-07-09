import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import { addDays, addWeeks, format, isSameWeek, startOfWeek } from "date-fns";
import { DeleteModal } from "@/components/DeleteModal";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useT } from "@/i18n/I18nContext";
import {
  type CreateTimeEntryDto,
  type TimeEntryDto,
  createTimeEntry,
  deleteTimeEntry,
  exportTimeEntriesExcel,
  getTimeEntries,
  updateTimeEntry,
} from "@/features/timeTracking/api/timeEntries";
import {
  type ProjectDto,
  getProjects,
} from "@/features/techHealth/api/projects";
import { getTickets } from "@/features/tickets/api/tickets";
import { getUsers } from "@/features/users/api/users";
import type { Ticket } from "@/types";
import { type FormState, emptyForm, parseDateLocal } from "./helpers";
import { WeekColumnsView } from "./components/WeekColumnsView";
import { UserPicker } from "./components/UserPicker";
import { TimeEntryModal } from "./components/TimeEntryModal";
import { TimeEntryDetailModal } from "./components/TimeEntryDetailModal";
import { extractApiError } from "@/utils/apiError";
import { UserRole } from "@/types/enums";

type JournalUserOption = {
  id: string;
  name: string;
  role?: string;
};

export const TimeTrackingPage: React.FC = () => {
  const t = useT();
  const location = useLocation();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.Admin;

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
  const [userFilterOpen, setUserFilterOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [allUsers, setAllUsers] = useState<JournalUserOption[]>([]);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addWeeks(base, weekOffset);
  }, [weekOffset]);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const data = await getTimeEntries(
          format(weekStart, "yyyy-MM-dd"),
          format(weekEnd, "yyyy-MM-dd"),
          signal,
        );
        if (signal?.aborted) return;
        setEntries(data);
      } catch {
        if (signal?.aborted) return;
        showToast(t("time_tracking.error_load_entries"), "error");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [weekStart, weekEnd, showToast, t],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  useEffect(() => {
    const loadAllUsers = async () => {
      const firstPage = await getUsers({ page: 1 });
      const users = [...firstPage.items];
      if (firstPage.totalPages > 1) {
        const remaining = await Promise.all(
          Array.from({ length: firstPage.totalPages - 1 }, (_, i) =>
            getUsers({ page: i + 2 }),
          ),
        );
        remaining.forEach((p) => {
          users.push(...p.items);
        });
      }
      setAllUsers(
        users.map((u) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
        })),
      );
    };

    getProjects()
      .then(setProjects)
      .catch(() => {});
    getTickets({ pageSize: 200 })
      .then((r) => setTickets(r.items))
      .catch(() => {});
    loadAllUsers().catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setSelectedUserId("all");
      return;
    }
    if (user?.id) setSelectedUserId(user.id);
  }, [isAdmin, user?.id]);

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

  const filteredEntries = useMemo(() => {
    if (selectedUserId === "all") return weekEntries;
    return weekEntries.filter((e) => e.userId === selectedUserId);
  }, [weekEntries, selectedUserId]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, TimeEntryDto[]>();
    weekDays.forEach((d) => {
      map.set(format(d, "yyyy-MM-dd"), []);
    });
    filteredEntries.forEach((e) => {
      const list = map.get(e.date);
      if (list) list.push(e);
    });
    return map;
  }, [weekDays, filteredEntries]);

  const journalUsers = useMemo<JournalUserOption[]>(() => {
    const usersMap = new Map<string, JournalUserOption>();
    allUsers.forEach((u) => {
      usersMap.set(u.id, u);
    });
    weekEntries.forEach((entry) => {
      if (!usersMap.has(entry.userId)) {
        usersMap.set(entry.userId, {
          id: entry.userId,
          name: entry.userName,
          role: entry.userRole,
        });
      }
    });
    if (user?.id && !usersMap.has(user.id)) {
      usersMap.set(user.id, {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      });
    }
    return Array.from(usersMap.values()).sort((a, b) => {
      if (a.id === user?.id) return -1;
      if (b.id === user?.id) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [allUsers, weekEntries, user]);

  const isCurrentWeek = weekOffset === 0;

  const handlePickDay = (newWeekStart: Date) => {
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const diff = Math.round(
      (newWeekStart.getTime() - currentWeekStart.getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    );
    setWeekOffset(diff);
  };

  const openCreate = useCallback((date?: string, startTime?: string) => {
    setEditingId(null);
    setForm(emptyForm(date, startTime));
    setModalOpen(true);
  }, []);

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      openCreate();
    }
  }, [location.state, openCreate]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = (entry: TimeEntryDto) => {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      durationMinutes: entry.durationMinutes,
      startTime: entry.startTime ? entry.startTime.substring(0, 5) : "",
      endTime: entry.endTime ? entry.endTime.substring(0, 5) : "",
      title: entry.title ?? "",
      description: entry.description ?? "",
      projectId: entry.projectId ?? "",
      ticketId: entry.ticketId ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    let durationMinutes = form.durationMinutes;
    if (form.startTime && form.endTime) {
      const [sh, sm] = form.startTime.split(":").map(Number);
      const [eh, em] = form.endTime.split(":").map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      if (diff > 0) durationMinutes = diff;
    }
    if (!form.title.trim() || durationMinutes <= 0) return;
    if (!form.projectId && !form.ticketId) {
      showToast(t("time_tracking.error_project_or_ticket_required"), "error");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await updateTimeEntry(editingId, {
          date: form.date,
          durationMinutes: durationMinutes,
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          projectId: form.projectId || null,
          ticketId: form.ticketId || null,
        });
        showToast(t("time_tracking.toast_entry_updated"), "success");
      } else {
        const payload: CreateTimeEntryDto = {
          date: form.date,
          durationMinutes: durationMinutes,
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
        };
        if (form.projectId) payload.projectId = form.projectId;
        if (form.ticketId) payload.ticketId = form.ticketId;
        await createTimeEntry(payload);
        showToast(t("time_tracking.toast_entry_created"), "success");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      showToast(
        extractApiError(err, t("time_tracking.error_save_entry")),
        "error",
      );
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
      showToast(
        extractApiError(err, t("time_tracking.error_delete_entry")),
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

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

  return (
    <>
      <Box
        className="page-enter"
        sx={{
          p: "20px 24px",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <WeekColumnsView
          weekStart={weekStart}
          weekEnd={weekEnd}
          weekDays={weekDays}
          isCurrentWeek={isCurrentWeek}
          entriesByDay={entriesByDay}
          loading={loading}
          exporting={exporting}
          canFilterByUser={isAdmin}
          currentUserId={user?.id}
          isAdmin={isAdmin}
          onPrev={() => setWeekOffset((o) => o - 1)}
          onNext={() => setWeekOffset((o) => o + 1)}
          onResetToToday={() => setWeekOffset(0)}
          onPickDay={handlePickDay}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onExport={handleExport}
          onOpenUserFilter={() => setUserFilterOpen(true)}
        />
      </Box>

      <UserPicker
        open={userFilterOpen}
        onClose={() => setUserFilterOpen(false)}
        users={journalUsers}
        selected={selectedUserId}
        onApply={setSelectedUserId}
        currentUserId={user?.id}
      />

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
        {t("time_tracking.delete_modal_warning")}{" "}
        <strong>
          {deleteTarget?.date
            ? format(new Date(deleteTarget.date), "dd/MM/yyyy")
            : ""}
        </strong>{" "}
        ?<br />
        {t("common.action_irreversible_before")}
        <b>{t("common.action_irreversible_word")}</b>
        {t("common.action_irreversible_after")}
      </DeleteModal>
    </>
  );
};
