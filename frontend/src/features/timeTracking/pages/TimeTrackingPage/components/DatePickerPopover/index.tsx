import React from "react";
import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import ChevronLeftOutlined from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import { addDays, format, isToday, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { useT } from "@/i18n/I18nContext";
import { IconNavBtn, parseDateLocal } from "../../helpers";

interface Props {
  anchor: HTMLElement | null;
  onClose: () => void;
  selectedDate: string;
  onSelect: (dateStr: string) => void;
}

export const DatePickerPopover: React.FC<Props> = ({
  anchor,
  onClose,
  selectedDate,
  onSelect,
}) => {
  const t = useT();
  const [calendarMonth, setCalendarMonth] = React.useState(() =>
    parseDateLocal(selectedDate),
  );
  const [view, setView] = React.useState<"days" | "months">("days");

  React.useEffect(() => {
    if (anchor) setCalendarMonth(parseDateLocal(selectedDate));
  }, [anchor, selectedDate]);

  return (
    <Popover
      open={!!anchor}
      anchorEl={anchor}
      onClose={() => {
        onClose();
        setView("days");
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: {
            mt: "4px",
            p: "12px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            background: "var(--s1)",
            minWidth: "220px",
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
            borderRadius: "6px",
            px: "6px",
            py: "2px",
            fontFamily: "var(--font-ui)",
            "&:hover": { background: "var(--s3)" },
          }}
        >
          {view === "days"
            ? format(calendarMonth, "MMMM yyyy", { locale: fr })
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
          }}
        >
          {Array.from({ length: 12 }, (_, i) => i).map((monthIdx) => {
            const isCurrent = monthIdx === calendarMonth.getMonth();
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
                  borderRadius: "6px",
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
                {format(new Date(2000, monthIdx, 1), "MMM", { locale: fr })}
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
          >
            {(() => {
              const firstDay = new Date(
                calendarMonth.getFullYear(),
                calendarMonth.getMonth(),
                1,
              );
              const start = startOfWeek(firstDay, { weekStartsOn: 1 });
              return Array.from({ length: 42 }, (_, i) => addDays(start, i));
            })().map((day, i) => {
              const isCurrentMonth =
                day.getMonth() === calendarMonth.getMonth();
              const isSelected = selectedDate === format(day, "yyyy-MM-dd");
              const todayDay = isToday(day);
              return (
                <Box
                  key={i}
                  component="button"
                  onClick={() => {
                    onSelect(format(day, "yyyy-MM-dd"));
                    onClose();
                    setView("days");
                  }}
                  sx={{
                    background: isSelected ? "var(--accent)" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: todayDay ? 800 : isSelected ? 700 : 400,
                    color: isSelected
                      ? "#fff"
                      : todayDay
                        ? "var(--accent)"
                        : isCurrentMonth
                          ? "var(--muted2)"
                          : "var(--border2)",
                    transition: "background 0.08s",
                    outline: "none",
                    "&:hover": {
                      background: isSelected ? "var(--accent)" : "var(--s3)",
                    },
                  }}
                >
                  {format(day, "d")}
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Popover>
  );
};
