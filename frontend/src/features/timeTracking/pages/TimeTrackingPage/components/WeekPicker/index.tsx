import React from "react";
import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import ChevronLeftOutlined from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import { addDays, endOfWeek, format, isSameWeek, isToday, startOfWeek } from "date-fns";
import { fr, enUS, type Locale } from "date-fns/locale";
import { useI18n } from "@/i18n/I18nContext";
import { Language } from "@/types/enums";

const DATE_FNS_LOCALE: Record<string, Locale> = { [Language.Fr]: fr, [Language.En]: enUS };
import { IconNavBtn } from "../../helpers";

interface Props {
  anchor: HTMLElement | null;
  onClose: () => void;
  weekStart: Date;
  onPickDay: (day: Date) => void;
}

export const WeekPicker: React.FC<Props> = ({
  anchor,
  onClose,
  weekStart,
  onPickDay,
}) => {
  const { t, culture } = useI18n();
  const dateFnsLocale = DATE_FNS_LOCALE[culture] ?? fr;
  const [calendarMonth, setCalendarMonth] = React.useState(weekStart);
  const [hoveredWeekStart, setHoveredWeekStart] = React.useState<Date | null>(
    null,
  );
  const [view, setView] = React.useState<"days" | "months">("days");

  React.useEffect(() => {
    if (anchor) setCalendarMonth(weekStart);
  }, [anchor, weekStart]);

  const calendarGrid = React.useMemo(() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const lastDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const start = startOfWeek(firstDay, { weekStartsOn: 1 });
    const end = endOfWeek(lastDay, { weekStartsOn: 1 });
    const days: Date[] = [];
    let cur = start;
    while (cur <= end) { days.push(cur); cur = addDays(cur, 1); }
    return days;
  }, [calendarMonth]);

  return (
    <Popover
      open={!!anchor}
      anchorEl={anchor}
      onClose={() => {
        onClose();
        setHoveredWeekStart(null);
        setView("days");
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: 'var(--r-md)',
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            p: "12px",
            mt: "4px",
            width: "236px",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: "10px",
        }}
      >
        <IconNavBtn
          onClick={() =>
            setCalendarMonth(
              (m) =>
                new Date(
                  view === "months" ? m.getFullYear() - 1 : m.getFullYear(),
                  view === "months" ? m.getMonth() : m.getMonth() - 1,
                  1,
                ),
            )
          }
        >
          <ChevronLeftOutlined sx={{ fontSize: 14 }} />
        </IconNavBtn>
        <Box
          component="button"
          onClick={() => setView((v) => (v === "days" ? "months" : "days"))}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.01em",
            textTransform: "capitalize",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            borderRadius: 'var(--r-sm)',
            px: "6px",
            py: "2px",
            fontFamily: "var(--font-ui)",
            "&:hover": { background: "var(--s3)" },
          }}
        >
          {view === "days"
            ? format(calendarMonth, "MMMM yyyy", { locale: dateFnsLocale })
            : calendarMonth.getFullYear()}
          <ExpandMoreOutlined
            sx={{
              fontSize: 14,
              color: "var(--muted2)",
              transform: view === "months" ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </Box>
        <IconNavBtn
          onClick={() =>
            setCalendarMonth(
              (m) =>
                new Date(
                  view === "months" ? m.getFullYear() + 1 : m.getFullYear(),
                  view === "months" ? m.getMonth() : m.getMonth() + 1,
                  1,
                ),
            )
          }
        >
          <ChevronRightOutlined sx={{ fontSize: 14 }} />
        </IconNavBtn>
      </Box>

      {view === "months" ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "4px",
            mb: "4px",
          }}
        >
          {Array.from({ length: 12 }, (_, i) => i).map((monthIdx) => {
            const isCurrent = monthIdx === calendarMonth.getMonth();
            const label = format(new Date(2000, monthIdx, 1), "MMM", {
              locale: dateFnsLocale,
            });
            return (
              <Box
                key={monthIdx}
                component="button"
                onClick={() => {
                  setCalendarMonth(
                    (m) => new Date(m.getFullYear(), monthIdx, 1),
                  );
                  setView("days");
                }}
                sx={{
                  fontSize: "11px",
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? "var(--accent)" : "var(--text)",
                  background: isCurrent
                    ? "var(--accent-subtle)"
                    : "transparent",
                  border: isCurrent
                    ? "1px solid var(--accent-border)"
                    : "1px solid transparent",
                  borderRadius: 'var(--r-sm)',
                  py: "7px",
                  cursor: "pointer",
                  fontFamily: "var(--font-ui)",
                  textTransform: "capitalize",
                  "&:hover": {
                    background: isCurrent
                      ? "var(--accent-subtle)"
                      : "var(--s3)",
                  },
                }}
              >
                {label}
              </Box>
            );
          })}
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              mb: "4px",
            }}
          >
            {[
              t("time_tracking.weekday_initial_mon"),
              t("time_tracking.weekday_initial_tue"),
              t("time_tracking.weekday_initial_wed"),
              t("time_tracking.weekday_initial_thu"),
              t("time_tracking.weekday_initial_fri"),
              t("time_tracking.weekday_initial_sat"),
              t("time_tracking.weekday_initial_sun"),
            ].map((d, i) => (
              <Box
                key={i}
                sx={{
                  textAlign: "center",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "var(--muted)",
                  letterSpacing: "0.05em",
                  py: "3px",
                }}
              >
                {d}
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "1px",
            }}
            onMouseLeave={() => setHoveredWeekStart(null)}
          >
            {calendarGrid.map((day, i) => {
              const isCurrentMonth =
                day.getMonth() === calendarMonth.getMonth();
              const isInSelectedWeek = isSameWeek(day, weekStart, {
                weekStartsOn: 1,
              });
              const isInHoveredWeek = hoveredWeekStart
                ? isSameWeek(day, hoveredWeekStart, { weekStartsOn: 1 })
                : false;
              const todayDay = isToday(day);
              const isMonday = day.getDay() === 1;
              const isSunday = day.getDay() === 0;
              const highlighted = isInSelectedWeek || isInHoveredWeek;

              return (
                <Box
                  key={i}
                  component="button"
                  onClick={() => onPickDay(day)}
                  onMouseEnter={() =>
                    setHoveredWeekStart(startOfWeek(day, { weekStartsOn: 1 }))
                  }
                  sx={{
                    background: highlighted
                      ? isInSelectedWeek
                        ? "var(--accent-subtle)"
                        : "var(--s3)"
                      : "transparent",
                    border: "none",
                    borderRadius: isMonday
                      ? "6px 0 0 6px"
                      : isSunday
                        ? "0 6px 6px 0"
                        : "0",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: todayDay ? 800 : highlighted ? 600 : 400,
                    color: todayDay
                      ? "var(--accent)"
                      : isInSelectedWeek
                        ? "var(--text)"
                        : isInHoveredWeek
                          ? "var(--text)"
                          : isCurrentMonth
                            ? "var(--muted2)"
                            : "var(--border2)",
                    transition: "background 0.08s",
                    outline: "none",
                  }}
                >
                  {format(day, "d")}
                </Box>
              );
            })}
          </Box>
        </>
      )}
      {!isSameWeek(weekStart, new Date(), { weekStartsOn: 1 }) && (
      <Box sx={{ mt: "8px" }}>
        <Box
          component="button"
          onClick={() => onPickDay(new Date())}
          sx={{
            width: "100%",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            py: "5px",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--muted2)",
            cursor: "pointer",
            fontFamily: "var(--font-ui)",
            transition: "color 0.12s, border-color 0.12s",
            "&:hover": { color: "var(--accent)", borderColor: "var(--accent-border)" },
          }}
        >
          {t("time_tracking.btn_today")}
        </Box>
      </Box>
      )}
    </Popover>
  );
};
