import React, { useState } from "react";
import Box from "@mui/material/Box";
import ChevronLeftOutlined from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import TodayOutlined from "@mui/icons-material/TodayOutlined";
import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import { format, isToday, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { useT } from "@/i18n/I18nContext";
import { TimeEntryDto } from "@/features/timeTracking/api/timeEntries";
import { IconNavBtn, WORK_HOURS_TARGET, formatDuration } from "../../helpers";
import { WeekPicker } from "../WeekPicker";

interface Props {
  weekStart: Date;
  weekEnd: Date;
  weekDays: Date[];
  isCurrentWeek: boolean;
  totalMinutes: number;
  entriesByDay: Map<string, TimeEntryDto[]>;
  onPrev: () => void;
  onNext: () => void;
  onResetToToday: () => void;
  onPickDay: (day: Date) => void;
  onCreateForDate: (dateStr: string) => void;
}

export const WeekCalendarCard: React.FC<Props> = ({
  weekStart,
  weekEnd,
  weekDays,
  isCurrentWeek,
  totalMinutes,
  entriesByDay,
  onPrev,
  onNext,
  onResetToToday,
  onPickDay,
  onCreateForDate,
}) => {
  const t = useT();
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(
    null,
  );

  const weekLabel = `${format(weekStart, "dd MMM", { locale: fr })} — ${format(weekEnd, "dd MMM yyyy", { locale: fr })}`;

  return (
    <Box
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: "16px",
          py: "10px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Box
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {t("time_tracking.week_label")}
          </Box>
          <Box
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text)",
              letterSpacing: "-0.01em",
              fontFamily: "var(--font-ui)",
              textTransform: "capitalize",
            }}
          >
            {weekLabel}
          </Box>
          {totalMinutes > 0 && (
            <Box
              sx={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--accent)",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                borderRadius: "4px",
                px: "8px",
                py: "4px",
              }}
            >
              {formatDuration(totalMinutes)}
            </Box>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {!isCurrentWeek && (
            <Box
              component="button"
              onClick={onResetToToday}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "var(--accent-subtle)",
                border: "1px solid var(--accent-border)",
                borderRadius: "6px",
                px: "10px",
                height: "28px",
                cursor: "pointer",
                color: "var(--accent)",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "var(--font-ui)",
                transition: "background 0.12s",
                "&:hover": { background: "color-mix(in srgb, var(--accent) 15%, transparent)" },
              }}
            >
              <TodayOutlined sx={{ fontSize: 15 }} />
              {t("time_tracking.today")}
            </Box>
          )}
          <IconNavBtn onClick={onPrev}>
            <ChevronLeftOutlined sx={{ fontSize: 18 }} />
          </IconNavBtn>
          <IconNavBtn onClick={onNext} disabled={isCurrentWeek}>
            <ChevronRightOutlined sx={{ fontSize: 18 }} />
          </IconNavBtn>
          <Box
            component="button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
              setCalendarAnchor(e.currentTarget)
            }
            sx={{
              background: calendarAnchor ? "var(--accent-subtle)" : "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: calendarAnchor ? "var(--accent)" : "var(--muted2)",
              fontFamily: "var(--font-ui)",
              transition: "background 0.12s, color 0.12s",
              "&:hover": { background: "var(--s3)", color: "var(--text)" },
            }}
          >
            <CalendarTodayOutlined sx={{ fontSize: 16 }} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {weekDays.map((day, idx) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const dayEntries = entriesByDay.get(dayStr) ?? [];
          const dayMinutes = dayEntries.reduce(
            (s, e) => s + e.durationMinutes,
            0,
          );
          const today = isToday(day);
          const isWeekend = [0, 6].includes(day.getDay());
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
              onClick={() => onCreateForDate(dayStr)}
              sx={{
                background: today
                  ? "linear-gradient(180deg, var(--accent-subtle) 0%, transparent 100%)"
                  : isWeekend
                    ? "rgba(0,0,0,0.03)"
                    : "transparent",
                borderRight: idx < 6 ? "1px solid var(--border)" : "none",
                borderTop: today
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                borderBottom: "none",
                borderLeft: "none",
                padding: "14px 10px 14px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                fontFamily: "var(--font-ui)",
                minHeight: "106px",
                transition: "background 0.15s",
                "&:hover": {
                  background: today
                    ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                    : isWeekend
                      ? "rgba(0,0,0,0.07)"
                      : "var(--s2)",
                },
              }}
            >
              <Box
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: today
                    ? "var(--accent)"
                    : isWeekend
                      ? "var(--border2)"
                      : "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                }}
              >
                {format(day, "EEE", { locale: fr })}
              </Box>
              <Box
                sx={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: today ? "var(--accent)" : "transparent",
                  boxShadow: today ? "0 2px 10px var(--accent-border)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: today
                    ? "var(--s1)"
                    : isWeekend
                      ? "var(--muted)"
                      : "var(--text)",
                }}
              >
                {format(day, "d")}
              </Box>
              <Box
                sx={{
                  width: "100%",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                {dayMinutes > 0 && (
                  <Box
                    sx={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: barColor,
                      textAlign: "center",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {formatDuration(dayMinutes)}
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

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
