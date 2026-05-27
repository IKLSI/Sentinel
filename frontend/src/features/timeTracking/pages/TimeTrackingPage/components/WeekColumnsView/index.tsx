import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import ChevronLeftOutlined from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import FilterListOutlined from "@mui/icons-material/FilterListOutlined";
import { format, isToday, startOfWeek } from "date-fns";
import { fr, enUS, type Locale } from "date-fns/locale";
import { useI18n } from "@/i18n/I18nContext";
import { Language } from "@/types/enums";

const DATE_FNS_LOCALE: Record<string, Locale> = { [Language.Fr]: fr, [Language.En]: enUS };
import { TimeEntryDto } from "@/features/timeTracking/api/timeEntries";
import {
  WORK_HOURS_TARGET,
  formatDuration,
  IconNavBtn,
  parseDateLocal,
} from "../../helpers";
import { WeekPicker } from "../WeekPicker";


const OverflowTooltip: React.FC<{ title: string; sx?: object; children: React.ReactNode }> = ({ title, sx, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (el) setTruncated(el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth);
  }, [children, title, sx]);
  return (
    <Tooltip title={truncated ? title : ""} placement="right" arrow enterDelay={600} enterNextDelay={300}>
      <Box ref={ref} sx={sx}>{children}</Box>
    </Tooltip>
  );
};

const HOUR_HEIGHT = 64;
const START_HOUR = 0;
const END_HOUR = 24;
const GUTTER_WIDTH = 44;
const GRID_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const SNAP_MINUTES = 15;
const SCROLL_VIEWPORT_OFFSET = 3;

const CurrentTimeLine: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const top = (now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT;
  if (top < 0 || top > GRID_HEIGHT) return null;
  return (
    <Box
      sx={{
        position: "absolute",
        top: `${top}px`,
        left: 0,
        right: 0,
        height: "1px",
        background: "var(--accent)",
        opacity: 0.7,
        zIndex: 3,
        pointerEvents: "none",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: "-3px",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "var(--accent)",
        },
      }}
    />
  );
};

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
  onCreate: (dateStr: string, startTime?: string) => void;
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
  onResetToToday: _onResetToToday,
  onPickDay,
  onCreate,
  onEdit,
  onDelete,
  onExport,
  onOpenUserFilter,
}) => {
  const { t, culture } = useI18n();
  const dateFnsLocale = DATE_FNS_LOCALE[culture] ?? fr;
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(null);
  const [hover, setHover] = useState<{ dayStr: string; top: number; label: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || !isCurrentWeek) return;
    const el = scrollRef.current;
    if (!el) return;
    const current = new Date();
    const target =
      (current.getHours() + current.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT -
      el.clientHeight / SCROLL_VIEWPORT_OFFSET;
    el.scrollTop = Math.max(0, target);
  }, [loading, isCurrentWeek]);

  const computeSlot = (relY: number) => {
    const decimalHour = START_HOUR + relY / HOUR_HEIGHT;
    const snapped = Math.min(
      Math.max(Math.round((decimalHour * 60) / SNAP_MINUTES) * SNAP_MINUTES, START_HOUR * 60),
      END_HOUR * 60,
    );
    const h = Math.floor(snapped / 60);
    const m = snapped % 60;
    const startTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return { startTime, top: (snapped / 60 - START_HOUR) * HOUR_HEIGHT };
  };

  const weekLabel = `${format(weekStart, "dd MMM", { locale: dateFnsLocale })} — ${format(weekEnd, "dd MMM yyyy", { locale: dateFnsLocale })}`;

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
          {canFilterByUser && (
            <IconNavBtn onClick={onOpenUserFilter} title={t("time_tracking.filter_users_tooltip")} hoverColor="#1D4ED8">
              <FilterListOutlined sx={{ fontSize: 13 }} />
            </IconNavBtn>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <IconNavBtn onClick={onPrev} title={t("time_tracking.btn_prev_week")} hoverColor="#1D4ED8">
            <ChevronLeftOutlined sx={{ fontSize: 13 }} />
          </IconNavBtn>
          <IconNavBtn onClick={(e) => setCalendarAnchor(e.currentTarget)} title={t("time_tracking.btn_pick_week")} hoverColor="#1D4ED8">
            <CalendarTodayOutlined sx={{ fontSize: 13, color: calendarAnchor ? "var(--accent)" : undefined }} />
          </IconNavBtn>
          <IconNavBtn onClick={onNext} disabled={isCurrentWeek} title={t("time_tracking.btn_next_week")} hoverColor="#1D4ED8">
            <ChevronRightOutlined sx={{ fontSize: 13 }} />
          </IconNavBtn>
          <IconNavBtn onClick={onExport} disabled={exporting} title={t("time_tracking.export")} hoverColor="#1D4ED8">
            {exporting ? <CircularProgress size={11} sx={{ color: "var(--muted2)" }} /> : <FileDownloadOutlined sx={{ fontSize: 13 }} />}
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
                background: today ? "color-mix(in srgb, var(--accent) 4%, var(--s1))" : "transparent",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                <Box
                  sx={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: today ? "var(--accent)" : "var(--text)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {format(day, "EEE", { locale: dateFnsLocale })}
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
        <Box ref={scrollRef} sx={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex" }}>
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
                  top: Math.max((h - START_HOUR) * HOUR_HEIGHT - 8, 0),
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
                const dayEntries = entriesByDay.get(dayStr) ?? [];
                const isLast = idx === weekDays.length - 1;

                return (
                  <Box
                    key={dayStr}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const { startTime } = computeSlot(e.clientY - rect.top);
                      onCreate(dayStr, startTime);
                    }}
                    onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const { startTime, top } = computeSlot(e.clientY - rect.top);
                      setHover({ dayStr, top, label: startTime });
                    }}
                    onMouseLeave={() => setHover((h) => (h?.dayStr === dayStr ? null : h))}
                    sx={{
                      borderRight: isLast ? "none" : "1px solid var(--border)",
                      background: today ? "color-mix(in srgb, var(--accent) 3%, transparent)" : "transparent",
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    {/* Current time line */}
                    {today && isCurrentWeek && <CurrentTimeLine />}

                    {/* Hover slot indicator */}
                    {hover?.dayStr === dayStr && hover.top > 0 && hover.top < GRID_HEIGHT && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: `${hover.top}px`,
                          left: 0,
                          right: 0,
                          transform: "translateY(-50%)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          px: "6px",
                          zIndex: 1,
                          pointerEvents: "none",
                        }}
                      >
                        <Box sx={{ flex: 1, height: "1px", background: "var(--accent)", opacity: 0.45 }} />
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            color: "var(--accent)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "0.01em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {hover.label}
                          <AddOutlined sx={{ fontSize: 12 }} />
                        </Box>
                        <Box sx={{ flex: 1, height: "1px", background: "var(--accent)", opacity: 0.45 }} />
                      </Box>
                    )}

                    {/* Entry blocks */}
                    <Box
                      sx={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
                    >
                      {dayEntries.map((entry) => {
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
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (canEdit) onEdit(entry); }}
                            onMouseMove={(e: React.MouseEvent) => { e.stopPropagation(); setHover(null); }}
                            sx={{
                              position: topOffset !== null ? "absolute" : "relative",
                              ...(topOffset !== null
                                ? { top: `${topOffset}px`, left: "4px", right: "4px" }
                                : { mx: "4px", mt: "4px" }),
                              height: `${blockHeight}px`,
                              flexShrink: 0,
                              pointerEvents: "auto",
                              background: "color-mix(in srgb, var(--accent) 5%, var(--s1))",
                              border: "1px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
                              borderRadius: "var(--r)",
                              pl: "8px",
                              pr: "8px",
                              pt: "5px",
                              pb: "5px",
                              cursor: canEdit ? "pointer" : "default",
                              display: "flex",
                              flexDirection: "column",
                              overflow: "hidden",
                              transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
                              "&:hover": canEdit ? {
                                background: "color-mix(in srgb, var(--accent) 8%, var(--s1))",
                                borderColor: "color-mix(in srgb, var(--accent) 35%, var(--border))",
                                boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                              } : {},
                              "&:hover .entry-actions": { opacity: 1 },
                            }}
                          >
                            <OverflowTooltip title={entry.title ?? ""} sx={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "var(--text)",
                                lineHeight: 1.4,
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: Math.max(1, Math.floor((blockHeight - 48) / 16) + 1),
                                WebkitBoxOrient: "vertical",
                                letterSpacing: "-0.01em",
                                wordBreak: "break-word",
                              }}>
                              {entry.title ?? "—"}
                            </OverflowTooltip>

                            {blockHeight >= 60 && entry.description && (
                              <OverflowTooltip title={entry.description} sx={{
                                  fontSize: "10px",
                                  color: "var(--muted2)",
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: Math.max(1, Math.floor((blockHeight - 80) / 14)),
                                  WebkitBoxOrient: "vertical",
                                  lineHeight: 1.4,
                                  wordBreak: "break-word",
                                  mt: "4px",
                                  fontStyle: "italic",
                                }}>
                                {entry.description}
                              </OverflowTooltip>
                            )}

                            <Box sx={{ flex: 1 }} />

                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", minWidth: 0 }}>
                              <Box
                                sx={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: "9.5px",
                                  fontWeight: 500,
                                  color: "color-mix(in srgb, var(--accent) 70%, var(--muted))",
                                  letterSpacing: "0.02em",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {timeLabel}
                              </Box>
                              {canEdit && (
                                <Box
                                  className="entry-actions"
                                  sx={{ opacity: 0, transition: "opacity 0.15s", display: "flex", alignItems: "center" }}
                                >
                                  <Tooltip title={t("time_tracking.action_delete")} placement="top" arrow>
                                    <Box
                                      component="button"
                                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(entry); }}
                                      sx={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "3px", color: "var(--muted2)", "&:hover": { color: "var(--red)" } }}
                                    >
                                      <DeleteOutlineOutlined sx={{ fontSize: 11 }} />
                                    </Box>
                                  </Tooltip>
                                </Box>
                              )}
                            </Box>
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
