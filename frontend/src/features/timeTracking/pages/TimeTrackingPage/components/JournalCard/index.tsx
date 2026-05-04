import React, { useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import { format, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { useT } from "@/i18n/I18nContext";
import { TimeEntryDto } from "@/features/timeTracking/api/timeEntries";
import {
  formatDuration,
  getProjectColor,
  getCurrentUserAvatar,
  getUserInitials,
  getUserAvatar,
  IconNavBtn,
  parseDateLocal,
} from "../../helpers";
import { RowActions } from "@/components/RowActions";

interface Props {
  loading: boolean;
  weekDays: Date[];
  weekEntries: TimeEntryDto[];
  entriesByDay: Map<string, TimeEntryDto[]>;
  contributors: number;
  exporting: boolean;
  isAdmin: boolean;
  currentUserId?: string;
  canFilterByUser: boolean;
  onOpenUserFilter: () => void;
  onCreate: () => void;
  onExport: () => void;
  onEdit: (entry: TimeEntryDto) => void;
  onDelete: (entry: TimeEntryDto) => void;
  onViewDetail: (entry: TimeEntryDto) => void;
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
  canFilterByUser,
  onOpenUserFilter,
  onCreate,
  onExport,
  onEdit,
  onDelete,
  onViewDetail,
}) => {
  const t = useT();
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

  return (
    <Box
      sx={{
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderRadius: 'var(--r-md)',
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
            {t("time_tracking.journal_label")}
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
            onClick={onCreate}
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
                      const userAvatar = isOwn
                        ? getCurrentUserAvatar()
                        : getUserAvatar();
                      return (
                        <Box
                          key={entry.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            borderTop: "1px solid var(--border)",
                            cursor: "pointer",
                            position: "relative",
                            transition: "background 0.12s",
                            "&:hover": { background: "var(--s2)" },
                            "&:hover .row-actions": { opacity: "1 !important" },
                          }}
                          onClick={(e: React.MouseEvent) => {
                            if ((e.target as HTMLElement).closest("button"))
                              return;
                            onViewDetail(entry);
                          }}
                        >
                          {/* Bloc auteur */}
                          {isAdmin && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                pl: "16px",
                                flexShrink: 0,
                                width: "110px",
                              }}
                            >
                              <Box
                                sx={{
                                  width: "26px",
                                  height: "26px",
                                  borderRadius: "50%",
                                  background: userAvatar.bg,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  color: userAvatar.text,
                                  letterSpacing: "0.01em",
                                }}
                              >
                                {getUserInitials(entry.userName)}
                              </Box>
                              <Box sx={{ minWidth: 0 }}>
                                <Box
                                  sx={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: isOwn
                                      ? "var(--accent)"
                                      : "var(--muted2)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {isOwn
                                    ? t("time_tracking.you")
                                    : entry.userName.split(" ")[0]}
                                </Box>
                                <Box
                                  sx={{
                                    fontSize: "10px",
                                    fontWeight: 500,
                                    color: "var(--muted)",
                                    lineHeight: 1.3,
                                    mt: "3px",
                                  }}
                                >
                                  {entry.userRole === "Admin"
                                    ? t("settings.role.admin")
                                    : t("settings.role.developer")}
                                </Box>
                              </Box>
                            </Box>
                          )}

                          {/* Séparateur */}
                          {isAdmin && (
                            <Box
                              sx={{
                                width: "1px",
                                height: "18px",
                                background: "var(--border)",
                                flexShrink: 0,
                                ml: "28px",
                                mr: "16px",
                              }}
                            />
                          )}

                          {/* Corps */}
                          <Box
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              py: "16px",
                              pl: isAdmin ? 0 : "16px",
                              pr: "8px",
                            }}
                          >
                            <Box
                              sx={{
                                fontSize: "13px",
                                color: "var(--text)",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                letterSpacing: "-0.01em",
                                lineHeight: 1.4,
                              }}
                            >
                              {entry.title ?? "—"}
                            </Box>

                            {(entry.techProjectName || entry.ticketId) && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  mt: "4px",
                                  flexWrap: "wrap",
                                }}
                              >
                                {entry.techProjectName && (
                                  <Box
                                    component="span"
                                    sx={{
                                      fontSize: "10px",
                                      fontWeight: 600,
                                      color: "var(--muted2)",
                                      px: "5px",
                                      py: "1px",
                                      borderRadius: 'var(--r-xs)',
                                      border: "1px solid var(--border2)",
                                      background: "var(--s3)",
                                    }}
                                  >
                                    {entry.techProjectName}
                                  </Box>
                                )}
                                {entry.ticketId && (
                                  <Box
                                    component="span"
                                    sx={{
                                      fontSize: "10px",
                                      fontWeight: 600,
                                      color: "var(--accent)",
                                      px: "5px",
                                      py: "1px",
                                      borderRadius: 'var(--r-xs)',
                                      border: "1px solid var(--accent-border)",
                                      background: "var(--accent-subtle)",
                                    }}
                                  >
                                    {`TKT-${entry.ticketId.replace(/-/g, "").substring(0, 6).toUpperCase()}`}
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* Droite */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              pr: "14px",
                              flexShrink: 0,
                            }}
                          >
                            {canEdit && (
                              <RowActions
                                actions={[
                                  {
                                    icon: (
                                      <EditOutlined sx={{ fontSize: 13 }} />
                                    ),
                                    label: t("time_tracking.action_edit"),
                                    onClick: (e) => {
                                      e.stopPropagation();
                                      onEdit(entry);
                                    },
                                    color: "accent",
                                  },
                                  {
                                    icon: (
                                      <DeleteOutlineOutlined
                                        sx={{ fontSize: 13 }}
                                      />
                                    ),
                                    label: t("time_tracking.action_delete"),
                                    onClick: (e) => {
                                      e.stopPropagation();
                                      onDelete(entry);
                                    },
                                    color: "red",
                                  },
                                ]}
                              />
                            )}
                            <Box
                              sx={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: projColor,
                                letterSpacing: "-0.01em",
                                flexShrink: 0,
                                minWidth: "36px",
                                textAlign: "right",
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

      {!loading && weekEntries.length > 0 && (
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
      )}
    </Box>
  );
};
