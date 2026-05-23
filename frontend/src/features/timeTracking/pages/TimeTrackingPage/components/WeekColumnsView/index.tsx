import React, { useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import ChevronLeftOutlined from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import TodayOutlined from "@mui/icons-material/TodayOutlined";
import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import { format, isToday, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { useT } from "@/i18n/I18nContext";
import { TimeEntryDto } from "@/features/timeTracking/api/timeEntries";
import {
  WORK_HOURS_TARGET,
  formatDuration,
  getProjectColor,
  IconNavBtn,
  parseDateLocal,
} from "../../helpers";
import { WeekPicker } from "../WeekPicker";
import { RowActions } from "@/components/RowActions";

const HOUR_HEIGHT = 64;
const START_HOUR = 7;
const END_HOUR = 21;
const GUTTER_WIDTH = 44;
const GRID_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

interface Props {
  weekStart: Date;
  weekEnd: Date;
  weekDays: Date[];
  isCurrentWeek: boolean;
  entriesByDay: Map<string, TimeEntryDto[]>;
  loading: boolean;
  exporting: boolean;
  canFilterByUser: boolean;
  currentUserId?: string;
  isAdmin: boolean;
  onPrev: () => void;
  onNext: () => void;
  onResetToToday: () => void;
  onPickDay: (day: Date) => void;
  onCreate: (dateStr: string) => void;
  onEdit: (entry: TimeEntryDto) => void;
  onDelete: (entry: TimeEntryDto) => void;
  onExport: () => void;
  onOpenUserFilter: () => void;
}

export const WeekColumnsView: React.FC<Props> = ({
  weekStart,
  weekEnd,
  weekDays,
  isCurrentWeek,
  entriesByDay,
  loading,
  exporting,
  canFilterByUser,
  currentUserId,
  isAdmin,
  onPrev,
  onNext,
  onResetToToday,
  onPickDay,
  onCreate,
  onEdit,
  onDelete,
  onExport,
  onOpenUserFilter,
}) => {
  const t = useT();
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(null);

  const weekLabel = `${format(weekStart, "dd MMM", { locale: fr })} — ${format(weekEnd, "dd MMM yyyy", { locale: fr })}`;
  const totalMinutes = Array.from(entriesByDay.values()).flat().reduce((s, e) => s + e.durationMinutes, 0);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: "16px",
          py: "10px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Box sx={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {t("time_tracking.week_label")}
          </Box>
          <Box sx={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em", textTransform: "capitalize" }}>
            {weekLabel}
          </Box>
          {totalMinutes > 0 && (
            <Box sx={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.04em", px: "8px", py: "4px", borderRadius: "var(--r-xs)" }}>
              {formatDuration(totalMinutes)}
            </Box>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {canFilterByUser && (
            <IconNavBtn onClick={onOpenUserFilter} title={t("time_tracking.filter_users_tooltip")} hoverColor="#1D4ED8">
              <TuneOutlined sx={{ fontSize: 13 }} />
            </IconNavBtn>
          )}
          <IconNavBtn onClick={onExport} disabled={exporting} title={t("time_tracking.export")} hoverColor="#1D4ED8">
            {exporting ? <CircularProgress size={11} sx={{ color: "var(--muted2)" }} /> : <FileDownloadOutlined sx={{ fontSize: 13 }} />}
          </IconNavBtn>
          {!isCurrentWeek && (
            <IconNavBtn onClick={onResetToToday} title={t("time_tracking.btn_today")} hoverColor="#1D4ED8">
              <TodayOutlined sx={{ fontSize: 13 }} />
            </IconNavBtn>
          )}
          <IconNavBtn onClick={onPrev} title={t("time_tracking.btn_prev_week")} hoverColor="#1D4ED8">
            <ChevronLeftOutlined sx={{ fontSize: 13 }} />
          </IconNavBtn>
          <IconNavBtn onClick={onNext} disabled={isCurrentWeek} title={t("time_tracking.btn_next_week")} hoverColor="#1D4ED8">
            <ChevronRightOutlined sx={{ fontSize: 13 }} />
          </IconNavBtn>
          <IconNavBtn onClick={(e) => setCalendarAnchor(e.currentTarget)} title={t("time_tracking.btn_pick_week")} hoverColor="#1D4ED8">
            <CalendarTodayOutlined sx={{ fontSize: 13, color: calendarAnchor ? "var(--accent)" : undefined }} />
          </IconNavBtn>
        </Box>
      </Box>

      {/* Day headers row */}
      <Box
        sx={{
          display: "flex",
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Gutter placeholder */}
        <Box sx={{ width: GUTTER_WIDTH, flexShrink: 0, borderRight: "1px solid var(--border)" }} />
        {/* Day headers */}
        {weekDays.map((day, idx) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const dayDate = parseDateLocal(dayStr);
          const today = isToday(dayDate);
          const isWeekend = [0, 6].includes(day.getDay());
          const dayMinutes = (entriesByDay.get(dayStr) ?? []).reduce((s, e) => s + e.durationMinutes, 0);
          const isLast = idx === weekDays.length - 1;

          const headerColor =
            dayMinutes === 0
              ? "var(--border2)"
              : dayMinutes > WORK_HOURS_TARGET
                ? "var(--red)"
                : dayMinutes >= 6 * 60
                  ? "var(--green)"
                  : "var(--orange)";

          return (
            <Box
              key={dayStr}
              sx={{
                flex: 1,
                px: "10px",
                py: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                borderRight: isLast ? "none" : "1px solid var(--border)",
                borderTop: today ? "3px solid var(--accent)" : "3px solid transparent",
                background: today
                  ? "color-mix(in srgb, var(--accent) 4%, var(--s1))"
                  : isWeekend
                    ? "var(--s2)"
                    : "transparent",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                <Box
                  sx={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: today ? "var(--accent)" : isWeekend ? "var(--muted)" : "var(--text)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {format(day, "EEE", { locale: fr })}
                </Box>
                <Box
                  sx={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: today ? "var(--accent)" : "var(--muted2)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {format(day, "dd.MM")}
                </Box>
              </Box>
              <Box
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: headerColor,
                  letterSpacing: "-0.02em",
                }}
              >
                {dayMinutes > 0
                  ? `${formatDuration(dayMinutes)} / ${formatDuration(WORK_HOURS_TARGET)}`
                  : `— / ${formatDuration(WORK_HOURS_TARGET)}`}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Add buttons row */}
      <Box sx={{ display: "flex", flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
        <Box sx={{ width: GUTTER_WIDTH, flexShrink: 0, borderRight: "1px solid var(--border)" }} />
        {weekDays.map((day, idx) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const isLast = idx === weekDays.length - 1;
          return (
            <Box
              key={dayStr}
              component="button"
              onClick={() => onCreate(dayStr)}
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                py: "6px",
                px: "8px",
                background: "transparent",
                border: "none",
                borderRight: isLast ? "none" : "1px solid var(--border)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "color 0.12s, background 0.12s",
                "&:hover .add-inner": {
                  color: "var(--accent)",
                },
              }}
            >
              <Box
                className="add-inner"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "var(--muted)",
                  fontSize: "11px",
                  fontWeight: 500,
                  width: "100%",
                  justifyContent: "center",
                  transition: "color 0.12s",
                }}
              >
                <AddOutlined sx={{ fontSize: 13 }} />
                {t("time_tracking.add_entry_title")}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Grid body */}
      {loading ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex" }}>
          {/* Hours gutter */}
          <Box
            sx={{
              width: GUTTER_WIDTH,
              flexShrink: 0,
              borderRight: "1px solid var(--border)",
              position: "relative",
              height: GRID_HEIGHT,
            }}
          >
            {HOURS.map((h) => (
              <Box
                key={h}
                sx={{
                  position: "absolute",
                  top: (h - START_HOUR) * HOUR_HEIGHT - 8,
                  right: "6px",
                  fontSize: "9px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--border2)",
                  letterSpacing: "0.01em",
                  userSelect: "none",
                }}
              >
                {h}h
              </Box>
            ))}
          </Box>

          {/* Columns + grid lines */}
          <Box sx={{ flex: 1, position: "relative", height: GRID_HEIGHT }}>
            {/* Horizontal grid lines */}
            {HOURS.map((h) => (
              <Box
                key={h}
                sx={{
                  position: "absolute",
                  top: (h - START_HOUR) * HOUR_HEIGHT,
                  left: 0,
                  right: 0,
                  borderTop: h === START_HOUR ? "none" : "1px solid var(--border)",
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* Day columns */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
              }}
            >
              {weekDays.map((day, idx) => {
                const dayStr = format(day, "yyyy-MM-dd");
                const dayDate = parseDateLocal(dayStr);
                const today = isToday(dayDate);
                const isWeekend = [0, 6].includes(day.getDay());
                const dayEntries = entriesByDay.get(dayStr) ?? [];
                const isLast = idx === weekDays.length - 1;

                return (
                  <Box
                    key={dayStr}
                    onClick={() => onCreate(dayStr)}
                    sx={{
                      borderRight: isLast ? "none" : "1px solid var(--border)",
                      background: today
                        ? "color-mix(in srgb, var(--accent) 2%, transparent)"
                        : isWeekend
                          ? "color-mix(in srgb, var(--s2) 60%, transparent)"
                          : "transparent",
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    {/* Entry blocks */}
                    <Box
                      sx={{ position: "absolute", inset: 0, zIndex: 1 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {dayEntries.map((entry) => {
                        const projColor = entry.techProjectName
                          ? getProjectColor(entry.techProjectName)
                          : "var(--accent)";
                        const blockHeight = Math.max(
                          Math.round((entry.durationMinutes / 60) * HOUR_HEIGHT),
                          32,
                        );
                        const isOwn = entry.userId === currentUserId;
                        const canEdit = isOwn || isAdmin;

                        let topOffset: number | null = null;
                        if (entry.startTime) {
                          const [h, m] = entry.startTime.split(":").map(Number);
                          const decimalHour = h + m / 60;
                          if (decimalHour >= START_HOUR && decimalHour < END_HOUR) {
                            topOffset = (decimalHour - START_HOUR) * HOUR_HEIGHT;
                          }
                        }

                        const timeLabel = entry.startTime
                          ? `${entry.startTime.substring(0, 5)} – ${entry.endTime?.substring(0, 5) ?? ""}`
                          : formatDuration(entry.durationMinutes);

                        return (
                          <Box
                            key={entry.id}
                            onClick={() => canEdit && onEdit(entry)}
                            sx={{
                              position: topOffset !== null ? "absolute" : "relative",
                              ...(topOffset !== null
                                ? { top: `${topOffset}px`, left: "4px", right: "4px" }
                                : { mx: "4px", mt: "4px" }),
                              height: `${blockHeight}px`,
                              flexShrink: 0,
                              background: "var(--s1)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--r)",
                              px: "8px",
                              py: "6px",
                              cursor: canEdit ? "pointer" : "default",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              overflow: "hidden",
                              transition: "border-color 0.15s, box-shadow 0.15s",
                              "&:hover": canEdit ? {
                                borderColor: "var(--border2)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                              } : {},
                              "&:hover .entry-actions": { opacity: 1 },
                            }}
                          >
                            <Box
                              sx={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "var(--text)",
                                lineHeight: 1.35,
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                letterSpacing: "-0.015em",
                              }}
                            >
                              {entry.title ?? "—"}
                            </Box>

                            {blockHeight >= 52 && entry.description && (
                              <Box
                                sx={{
                                  fontSize: "10.5px",
                                  color: "var(--muted2)",
                                  overflow: "hidden",
                                  whiteSpace: "nowrap",
                                  textOverflow: "ellipsis",
                                  lineHeight: 1.3,
                                }}
                              >
                                {entry.description}
                              </Box>
                            )}

                            {blockHeight >= 48 ? (
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", minWidth: 0 }}>
                                <Box
                                  sx={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    color: "var(--muted)",
                                    letterSpacing: "0.02em",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {timeLabel}
                                </Box>
                                {canEdit && (
                                  <Box
                                    className="entry-actions"
                                    sx={{ display: "flex", alignItems: "center", opacity: 0, transition: "opacity 0.15s" }}
                                  >
                                    <Tooltip title={t("time_tracking.action_delete")} placement="top" arrow>
                                      <Box
                                        component="button"
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(entry); }}
                                        sx={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "4px", color: "var(--muted2)", "&:hover": { color: "var(--red)" } }}
                                      >
                                        <DeleteOutlineOutlined sx={{ fontSize: 11 }} />
                                      </Box>
                                    </Tooltip>
                                  </Box>
                                )}
                              </Box>
                            ) : canEdit && (
                              <Box
                                className="entry-actions"
                                sx={{ position: "absolute", bottom: "2px", right: "2px", opacity: 0, transition: "opacity 0.15s" }}
                              >
                                <Tooltip title={t("time_tracking.action_delete")} placement="top" arrow>
                                  <Box
                                    component="button"
                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(entry); }}
                                    sx={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "3px", color: "var(--muted2)", "&:hover": { color: "var(--red)" } }}
                                  >
                                    <DeleteOutlineOutlined sx={{ fontSize: 10 }} />
                                  </Box>
                                </Tooltip>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}

      <WeekPicker
        anchor={calendarAnchor}
        onClose={() => setCalendarAnchor(null)}
        weekStart={weekStart}
        onPickDay={(day) => {
          onPickDay(startOfWeek(day, { weekStartsOn: 1 }));
          setCalendarAnchor(null);
        }}
      />
    </Box>
  );
};
