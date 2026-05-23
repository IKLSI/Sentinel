import React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import { format, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { useT } from "@/i18n/I18nContext";
import { TimeEntryDto } from "@/features/timeTracking/api/timeEntries";
import {
  formatDuration,
  getProjectColor,
  IconNavBtn,
  parseDateLocal,
  WORK_HOURS_TARGET,
} from "../../helpers";

const LABEL_COL_WIDTH = 220;
const TOTAL_COL_WIDTH = 72;

type RowMeta = {
  title: string;
  techProjectId: string;
  techProjectName: string | null;
  ticketId: string;
  ticketTitle?: string;
};

type GridRow = RowMeta & {
  key: string;
  entriesByDay: Map<string, TimeEntryDto[]>;
  totalMinutes: number;
  firstEntry: TimeEntryDto;
};

function buildRows(entries: TimeEntryDto[], weekDays: Date[]): GridRow[] {
  const rowMap = new Map<string, GridRow>();

  for (const entry of entries) {
    const rowKey = `${entry.title ?? ""}__${entry.techProjectId ?? ""}__${entry.ticketId ?? ""}`;
    if (!rowMap.has(rowKey)) {
      const byDay = new Map<string, TimeEntryDto[]>();
      weekDays.forEach((d) => byDay.set(format(d, "yyyy-MM-dd"), []));
      rowMap.set(rowKey, {
        key: rowKey,
        title: entry.title ?? "",
        techProjectId: entry.techProjectId ?? "",
        techProjectName: entry.techProjectName ?? null,
        ticketId: entry.ticketId ?? "",
        ticketTitle: entry.ticketTitle,
        entriesByDay: byDay,
        totalMinutes: 0,
        firstEntry: entry,
      });
    }
    const row = rowMap.get(rowKey)!;
    const dayList = row.entriesByDay.get(entry.date);
    if (dayList) dayList.push(entry);
    row.totalMinutes += entry.durationMinutes;
  }

  return Array.from(rowMap.values());
}

interface Props {
  weekDays: Date[];
  weekEntries: TimeEntryDto[];
  loading: boolean;
  exporting: boolean;
  canFilterByUser: boolean;
  onOpenUserFilter: () => void;
  onCellClick: (
    anchor: HTMLElement,
    dayStr: string,
    entries: TimeEntryDto[],
    rowMeta: RowMeta,
  ) => void;
  onRowLabelClick: (entry: TimeEntryDto) => void;
  onAdd: () => void;
  onExport: () => void;
}

const headerColSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column" as const,
  py: "8px",
  px: "4px",
  borderRight: "1px solid var(--border)",
  gap: "2px",
};

const dataCellSx = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRight: "1px solid var(--border)",
  cursor: "pointer",
  height: "48px",
  position: "relative" as const,
  transition: "background 0.12s",
};

export const TimesheetGrid: React.FC<Props> = ({
  weekDays,
  weekEntries,
  loading,
  exporting,
  canFilterByUser,
  onOpenUserFilter,
  onCellClick,
  onRowLabelClick,
  onAdd,
  onExport,
}) => {
  const t = useT();
  const rows = buildRows(weekEntries, weekDays);

  const dayTotals = weekDays.map((d) => {
    const dayStr = format(d, "yyyy-MM-dd");
    return weekEntries
      .filter((e) => e.date === dayStr)
      .reduce((s, e) => s + e.durationMinutes, 0);
  });

  const grandTotal = weekEntries.reduce((s, e) => s + e.durationMinutes, 0);

  return (
    <Box
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
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
          minHeight: "44px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Box
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {t("time_tracking.timesheet_label")}
          </Box>
          {canFilterByUser && (
            <IconNavBtn
              onClick={onOpenUserFilter}
              title={t("time_tracking.filter_users_tooltip")}
              hoverColor="#1D4ED8"
            >
              <TuneOutlined sx={{ fontSize: 16 }} />
            </IconNavBtn>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <IconNavBtn
            onClick={onAdd}
            title={t("time_tracking.add_entry_title")}
            hoverColor="#1D4ED8"
          >
            <AddOutlined sx={{ fontSize: 13 }} />
          </IconNavBtn>
          <IconNavBtn
            onClick={onExport}
            disabled={exporting}
            title={t("time_tracking.export")}
            hoverColor="#1D4ED8"
          >
            {exporting ? (
              <CircularProgress size={11} sx={{ color: "var(--muted2)" }} />
            ) : (
              <FileDownloadOutlined sx={{ fontSize: 13 }} />
            )}
          </IconNavBtn>
        </Box>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
          {/* Column headers */}
          <Box
            sx={{
              display: "flex",
              borderBottom: "1px solid var(--border)",
              background: "var(--s2)",
              position: "sticky",
              top: 0,
              zIndex: 2,
              minWidth: `${LABEL_COL_WIDTH + 7 * 60 + TOTAL_COL_WIDTH}px`,
            }}
          >
            <Box
              sx={{
                width: LABEL_COL_WIDTH,
                flexShrink: 0,
                px: "16px",
                py: "8px",
                borderRight: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {t("time_tracking.timesheet_activity_col")}
              </Box>
            </Box>
            {weekDays.map((day) => {
              const today = isToday(day);
              const isWeekend = [0, 6].includes(day.getDay());
              return (
                <Box
                  key={format(day, "yyyy-MM-dd")}
                  sx={{
                    ...headerColSx,
                    flex: 1,
                    minWidth: "60px",
                    background: today
                      ? "color-mix(in srgb, var(--accent) 6%, transparent)"
                      : isWeekend
                        ? "rgba(0,0,0,0.02)"
                        : "transparent",
                    borderTop: today
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                  }}
                >
                  <Box
                    sx={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: today ? "var(--accent)" : isWeekend ? "var(--border2)" : "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {format(day, "EEE", { locale: fr })}
                  </Box>
                  <Box
                    sx={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: today ? "var(--accent)" : isWeekend ? "var(--muted)" : "var(--text)",
                    }}
                  >
                    {format(day, "d")}
                  </Box>
                </Box>
              );
            })}
            <Box
              sx={{
                width: TOTAL_COL_WIDTH,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: "4px",
                py: "8px",
              }}
            >
              <Box
                sx={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {t("time_tracking.timesheet_total_col")}
              </Box>
            </Box>
          </Box>

          {/* Activity rows */}
          {rows.length === 0 ? (
            <Box className="empty-state" sx={{ flex: 1, py: "40px" }}>
              <Box className="empty-state-icon">
                <AccessTimeOutlined sx={{ fontSize: 36 }} />
              </Box>
              <Box className="empty-state-title">
                {t("time_tracking.empty_title")}
              </Box>
              <Box className="empty-state-subtitle">
                {t("time_tracking.timesheet_empty_subtitle")}
              </Box>
            </Box>
          ) : (
            rows.map((row) => {
              const projColor = row.techProjectName
                ? getProjectColor(row.techProjectName)
                : "var(--accent)";
              return (
                <Box
                  key={row.key}
                  sx={{
                    display: "flex",
                    borderBottom: "1px solid var(--border)",
                    minWidth: `${LABEL_COL_WIDTH + 7 * 60 + TOTAL_COL_WIDTH}px`,
                    "&:hover .row-label-cell": { background: "var(--s2)" },
                  }}
                >
                  {/* Label */}
                  <Box
                    className="row-label-cell"
                    component="button"
                    onClick={() => onRowLabelClick(row.firstEntry)}
                    sx={{
                      width: LABEL_COL_WIDTH,
                      flexShrink: 0,
                      px: "14px",
                      py: "10px",
                      borderRight: "1px solid var(--border)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "4px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "background 0.12s",
                      "&:hover": { background: "var(--s2)" },
                      height: "48px",
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.3,
                      }}
                    >
                      {row.title || "—"}
                    </Box>
                    {(row.techProjectName || row.ticketId) && (
                      <Box sx={{ display: "flex", gap: "3px", flexWrap: "nowrap" }}>
                        {row.techProjectName && (
                          <Box
                            component="span"
                            sx={{
                              fontSize: "9px",
                              fontWeight: 700,
                              color: "var(--muted2)",
                              px: "4px",
                              py: "1px",
                              borderRadius: "var(--r-xs)",
                              border: "1px solid var(--border2)",
                              background: "var(--s3)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "90px",
                            }}
                          >
                            {row.techProjectName}
                          </Box>
                        )}
                        {row.ticketId && (
                          <Box
                            component="span"
                            sx={{
                              fontSize: "9px",
                              fontWeight: 700,
                              color: "var(--accent)",
                              px: "4px",
                              py: "1px",
                              borderRadius: "var(--r-xs)",
                              border: "1px solid var(--accent-border)",
                              background: "var(--accent-subtle)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {`TKT-${row.ticketId.replace(/-/g, "").substring(0, 6).toUpperCase()}`}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Day cells */}
                  {weekDays.map((day) => {
                    const dayStr = format(day, "yyyy-MM-dd");
                    const cellEntries = row.entriesByDay.get(dayStr) ?? [];
                    const cellMinutes = cellEntries.reduce(
                      (s, e) => s + e.durationMinutes,
                      0,
                    );
                    const today = isToday(parseDateLocal(dayStr));
                    const isWeekend = [0, 6].includes(day.getDay());
                    const hasEntries = cellMinutes > 0;

                    return (
                      <Box
                        key={dayStr}
                        onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                          onCellClick(e.currentTarget, dayStr, cellEntries, {
                            title: row.title,
                            techProjectId: row.techProjectId,
                            techProjectName: row.techProjectName,
                            ticketId: row.ticketId,
                            ticketTitle: row.ticketTitle,
                          })
                        }
                        sx={{
                          ...dataCellSx,
                          background: today
                            ? "color-mix(in srgb, var(--accent) 3%, transparent)"
                            : isWeekend
                              ? "rgba(0,0,0,0.015)"
                              : "transparent",
                          "&:hover": {
                            background: today
                              ? "color-mix(in srgb, var(--accent) 8%, transparent)"
                              : isWeekend
                                ? "rgba(0,0,0,0.04)"
                                : "var(--s2)",
                          },
                          "&:hover .cell-add-icon": {
                            opacity: hasEntries ? 0 : 0.4,
                          },
                        }}
                      >
                        {hasEntries ? (
                          <Box
                            sx={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "11px",
                              fontWeight: 700,
                              color: projColor,
                              letterSpacing: "-0.02em",
                              userSelect: "none",
                            }}
                          >
                            {formatDuration(cellMinutes)}
                          </Box>
                        ) : (
                          <Box
                            className="cell-add-icon"
                            sx={{
                              opacity: 0,
                              color: "var(--muted2)",
                              fontSize: "14px",
                              lineHeight: 1,
                              transition: "opacity 0.1s",
                              userSelect: "none",
                            }}
                          >
                            +
                          </Box>
                        )}
                      </Box>
                    );
                  })}

                  {/* Row total */}
                  <Box
                    sx={{
                      width: TOTAL_COL_WIDTH,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "48px",
                    }}
                  >
                    <Box
                      sx={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: projColor,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {formatDuration(row.totalMinutes)}
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}

          {/* Footer totals */}
          {rows.length > 0 && (
            <Box
              sx={{
                display: "flex",
                borderTop: "1px solid var(--border)",
                background: "var(--s2)",
                position: "sticky",
                bottom: 0,
                minWidth: `${LABEL_COL_WIDTH + 7 * 60 + TOTAL_COL_WIDTH}px`,
              }}
            >
              <Box
                sx={{
                  width: LABEL_COL_WIDTH,
                  flexShrink: 0,
                  px: "14px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  borderRight: "1px solid var(--border)",
                }}
              >
                <Box
                  sx={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("time_tracking.timesheet_total_col")}
                </Box>
              </Box>
              {weekDays.map((day, idx) => {
                const dayMinutes = dayTotals[idx];
                const today = isToday(day);
                const isWeekend = [0, 6].includes(day.getDay());
                const barColor =
                  dayMinutes === 0
                    ? "var(--border2)"
                    : dayMinutes > WORK_HOURS_TARGET
                      ? "var(--red)"
                      : dayMinutes >= 6 * 60
                        ? "var(--green)"
                        : "var(--orange)";
                return (
                  <Box
                    key={format(day, "yyyy-MM-dd")}
                    sx={{
                      flex: 1,
                      minWidth: "60px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "36px",
                      borderRight: "1px solid var(--border)",
                      background: today
                        ? "color-mix(in srgb, var(--accent) 5%, transparent)"
                        : isWeekend
                          ? "rgba(0,0,0,0.02)"
                          : "transparent",
                    }}
                  >
                    {dayMinutes > 0 && (
                      <Box
                        sx={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: barColor,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {formatDuration(dayMinutes)}
                      </Box>
                    )}
                  </Box>
                );
              })}
              <Box
                sx={{
                  width: TOTAL_COL_WIDTH,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "36px",
                }}
              >
                {grandTotal > 0 && (
                  <Box
                    sx={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "var(--accent)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {formatDuration(grandTotal)}
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Add row */}
          <Box
            component="button"
            onClick={onAdd}
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              px: "14px",
              py: "10px",
              background: "transparent",
              border: "none",
              borderTop: rows.length > 0 ? "none" : "1px solid var(--border)",
              cursor: "pointer",
              fontFamily: "inherit",
              color: "var(--muted2)",
              transition: "background 0.12s, color 0.12s",
              "&:hover": {
                background: "var(--s2)",
                color: "var(--accent)",
              },
            }}
          >
            <AddOutlined sx={{ fontSize: 14 }} />
            <Box sx={{ fontSize: "12px", fontWeight: 600 }}>
              {t("time_tracking.timesheet_add_activity")}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
