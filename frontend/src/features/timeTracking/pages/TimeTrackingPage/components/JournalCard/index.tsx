import React, { useState } from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import { format, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { useT } from "@/i18n/I18nContext";
import { TimeEntryDto } from "@/features/timeTracking/api/timeEntries";
import {
  RowActionBtn,
  formatDuration,
  getProjectColor,
  getUserInitials,
  parseDateLocal,
} from "../../helpers";

interface Props {
  loading: boolean;
  weekDays: Date[];
  weekEntries: TimeEntryDto[];
  entriesByDay: Map<string, TimeEntryDto[]>;
  contributors: number;
  exporting: boolean;
  isAdmin: boolean;
  currentUserId?: string;
  onCreate: () => void;
  onExport: () => void;
  onEdit: (entry: TimeEntryDto) => void;
  onDelete: (entry: TimeEntryDto) => void;
}

export const JournalCard: React.FC<Props> = ({
  loading,
  weekDays,
  weekEntries,
  entriesByDay,
  contributors,
  exporting,
  isAdmin,
  currentUserId,
  onCreate,
  onExport,
  onEdit,
  onDelete,
}) => {
  const t = useT();
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

  return (
    <Box
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
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
            {t("time_tracking.journal_label")}
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Box
            component="button"
            onClick={onCreate}
            title={t("time_tracking.add_entry_title")}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              background: "transparent",
              border: "1px solid transparent",
              borderRadius: "6px",
              cursor: "pointer",
              color: "var(--muted2)",
              transition: "background 0.12s, color 0.12s, border-color 0.12s",
              "&:hover": {
                background: "var(--s3)",
                color: "var(--text)",
                borderColor: "var(--border)",
              },
            }}
          >
            <AddOutlined sx={{ fontSize: 14 }} />
          </Box>
          <Box
            component="button"
            onClick={onExport}
            disabled={exporting}
            title={t("time_tracking.export_csv_title")}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              background: "transparent",
              border: "1px solid transparent",
              borderRadius: "6px",
              cursor: exporting ? "default" : "pointer",
              color: "var(--muted2)",
              opacity: exporting ? 0.5 : 1,
              transition: "background 0.12s, color 0.12s, border-color 0.12s",
              "&:hover": {
                background: "var(--s3)",
                color: "var(--text)",
                borderColor: "var(--border)",
              },
            }}
          >
            {exporting ? (
              <CircularProgress size={11} sx={{ color: "var(--muted2)" }} />
            ) : (
              <FileDownloadOutlined sx={{ fontSize: 14 }} />
            )}
          </Box>
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
      ) : weekEntries.length === 0 ? (
        <Box className="empty-state" sx={{ flex: 1 }}>
          <Box className="empty-state-icon">
            <AccessTimeOutlined sx={{ fontSize: 36 }} />
          </Box>
          <Box className="empty-state-title">
            {t("time_tracking.empty_title")}
          </Box>
          <Box className="empty-state-subtitle">
            {t("time_tracking.empty_subtitle")}
          </Box>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: "auto" }}>
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

              const isCollapsed = collapsedDays.has(dayStr);
              const toggleCollapse = () =>
                setCollapsedDays((prev) => {
                  const next = new Set(prev);
                  if (next.has(dayStr)) next.delete(dayStr);
                  else next.add(dayStr);
                  return next;
                });

              return (
                <Box key={dayStr}>
                  <Box
                    component="button"
                    onClick={toggleCollapse}
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: "16px",
                      py: "8px",
                      background: isCurrentDay
                        ? "color-mix(in srgb, var(--accent) 4%, transparent)"
                        : "var(--s2)",
                      border: "none",
                      borderTop: "1px solid var(--border)",
                      cursor: "pointer",
                      fontFamily: "var(--font-ui)",
                      transition: "background 0.1s",
                      "&:hover": {
                        background: isCurrentDay
                          ? "color-mix(in srgb, var(--accent) 7%, transparent)"
                          : "var(--s3)",
                      },
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <ExpandMoreOutlined
                        sx={{
                          fontSize: 16,
                          color: "var(--muted2)",
                          transform: isCollapsed
                            ? "rotate(-90deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                      <Box
                        sx={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: isCurrentDay
                            ? "var(--accent)"
                            : "var(--muted2)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {format(dayDate, "EEE", { locale: fr })}
                      </Box>
                      <Box
                        sx={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: isCurrentDay ? "var(--accent)" : "var(--text)",
                          letterSpacing: "-0.01em",
                          textTransform: "capitalize",
                        }}
                      >
                        {format(dayDate, "d MMMM", { locale: fr })}
                      </Box>
                      {isCurrentDay && (
                        <Box
                          sx={{
                            fontSize: "10px",
                            fontWeight: 600,
                            background: "var(--accent-subtle)",
                            color: "var(--accent)",
                            px: "6px",
                            py: "1px",
                            borderRadius: "4px",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {t("time_tracking.today")}
                        </Box>
                      )}
                    </Box>
                    <Box
                      sx={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: isCurrentDay ? "var(--accent)" : "var(--muted2)",
                      }}
                    >
                      {formatDuration(dayMinutes)}
                    </Box>
                  </Box>

                  {!isCollapsed &&
                    dayEntries.map((entry) => {
                      const projColor = entry.techProjectName
                        ? getProjectColor(entry.techProjectName)
                        : "var(--border2)";
                      const isOwn = entry.userId === currentUserId;
                      const canEdit = isOwn;
                      return (
                        <Box
                          key={entry.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            pl: "16px",
                            pr: "12px",
                            borderTop: "1px solid var(--border)",
                            minHeight: "52px",
                            gap: "12px",
                            transition: "background 0.1s",
                            "&:hover": { background: "var(--s2)" },
                            "&:hover .tt-actions": { opacity: 1 },
                          }}
                        >
                          {isAdmin && (
                            <Tooltip
                              title={
                                isOwn ? t("time_tracking.you") : entry.userName
                              }
                              placement="top"
                              arrow
                            >
                              <Box
                                sx={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  background: isOwn
                                    ? "var(--accent)"
                                    : getProjectColor(entry.userName),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  color: "var(--s1)",
                                  letterSpacing: "0.02em",
                                }}
                              >
                                {getUserInitials(entry.userName)}
                              </Box>
                            </Tooltip>
                          )}

                          <Box sx={{ flex: 1, minWidth: 0, py: "11px" }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                mb:
                                  entry.techProjectName || entry.ticketTitle
                                    ? "5px"
                                    : 0,
                              }}
                            >
                              <Box
                                sx={{
                                  fontSize: "13px",
                                  color: "var(--text)",
                                  fontWeight: 500,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  letterSpacing: "-0.01em",
                                  flex: 1,
                                  minWidth: 0,
                                }}
                              >
                                {entry.comment ?? "—"}
                              </Box>
                            </Box>
                            {(entry.techProjectName || entry.ticketTitle) && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  flexWrap: "wrap",
                                }}
                              >
                                {entry.techProjectName && (
                                  <Box
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      px: "6px",
                                      py: "2px",
                                      borderRadius: "4px",
                                      background: `color-mix(in srgb, ${projColor} 9%, transparent)`,
                                      border: `1px solid color-mix(in srgb, ${projColor} 25%, transparent)`,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: "5px",
                                        height: "5px",
                                        borderRadius: "50%",
                                        background: projColor,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Box
                                      component="span"
                                      sx={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: projColor,
                                      }}
                                    >
                                      {entry.techProjectName}
                                    </Box>
                                  </Box>
                                )}
                                {entry.ticketId && (
                                  <Box
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      fontFamily: "var(--font-mono)",
                                      fontSize: "10px",
                                      background: "var(--accent-subtle)",
                                      color: "var(--accent)",
                                      px: "6px",
                                      py: "2px",
                                      borderRadius: "4px",
                                      fontWeight: 600,
                                      letterSpacing: "0.04em",
                                      border: "1px solid var(--accent-border)",
                                    }}
                                  >
                                    {`TKT-${entry.ticketId.replace(/-/g, "").substring(0, 6).toUpperCase()}`}
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              flexShrink: 0,
                            }}
                          >
                            <Box
                              className="tt-actions"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                                opacity: 0,
                                transition: "opacity 0.15s",
                              }}
                            >
                              {canEdit && (
                                <>
                                  <RowActionBtn
                                    icon={
                                      <EditOutlined sx={{ fontSize: 13 }} />
                                    }
                                    onClick={() => onEdit(entry)}
                                    title={t("time_tracking.action_edit")}
                                  />
                                  <RowActionBtn
                                    icon={
                                      <DeleteOutlineOutlined
                                        sx={{ fontSize: 13 }}
                                      />
                                    }
                                    onClick={() => onDelete(entry)}
                                    title={t("time_tracking.action_delete")}
                                    danger
                                  />
                                </>
                              )}
                            </Box>
                            <Box
                              sx={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "13px",
                                fontWeight: 800,
                                color: projColor,
                                background: `color-mix(in srgb, ${projColor} 9%, transparent)`,
                                border: `1px solid color-mix(in srgb, ${projColor} 21%, transparent)`,
                                px: "8px",
                                py: "3px",
                                borderRadius: "6px",
                                letterSpacing: "-0.02em",
                                flexShrink: 0,
                              }}
                            >
                              {formatDuration(entry.durationMinutes)}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                </Box>
              );
            })}
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: "16px",
          py: "8px",
          borderTop: "1px solid var(--border)",
          background: "var(--s2)",
          flexShrink: 0,
          gap: "16px",
        }}
      >
        {contributors > 0 && (
          <Box
            sx={{
              fontSize: "11px",
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.04em",
            }}
          >
            {contributors}{" "}
            {contributors > 1
              ? t("time_tracking.member_plural")
              : t("time_tracking.member_singular")}
          </Box>
        )}
      </Box>
    </Box>
  );
};
