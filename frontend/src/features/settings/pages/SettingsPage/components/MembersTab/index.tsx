import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import BlockOutlined from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import { formatDistanceToNow } from "date-fns";
import { getDateFnsLocale } from "@/utils/dateFnsLocale";
import { RowActions } from "@/components/RowActions";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useI18n } from "@/i18n/I18nContext";
import { useUsers, useToggleUserActive } from "@/features/users/hooks/useUsers";
import { MemberPagination } from "../MemberPagination";
import { useApiError } from "@/hooks/useApiError";
import { UserRole } from "@/types/enums";

interface Props {
  onInviteClick: () => void;
}

export const MembersTab: React.FC<Props> = ({ onInviteClick }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t, culture } = useI18n();
  const apiError = useApiError();

  const ROLE_LABELS: Record<string, string> = useMemo(
    () => ({
      Admin: t("settings.role.admin"),
      Developer: t("settings.role.developer"),
    }),
    [t],
  );

  const { users: members, loading: loadingMembers } = useUsers();
  const toggleActive = useToggleUserActive();
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ col: string; dir: "asc" | "desc" } | null>(
    {
      col: "member",
      dir: "asc",
    },
  );
  const tableWrapRef = useRef<HTMLDivElement>(null);

  const toggleSort = useCallback((col: string) => {
    setSort((s) => {
      if (s?.col !== col) return { col, dir: "asc" };
      if (s.dir === "asc") return { col, dir: "desc" };
      return null;
    });
  }, []);

  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const measure = () =>
      setPageSize(Math.max(1, Math.floor((el.clientHeight - 52 - 41) / 52)));
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setPage(1);
  }, []);

  const filteredMembers = useMemo(() => {
    let list = members;
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      list = list.filter(
        (m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q),
      );
    }
    if (memberRoleFilter !== "all")
      list = list.filter((m) => m.role === memberRoleFilter);
    if (sort) {
      const mul = sort.dir === "asc" ? 1 : -1;
      list = list.slice().sort((a, b) => {
        switch (sort.col) {
          case "member":
            return (
              mul *
              `${a.firstName}${a.lastName}`.localeCompare(
                `${b.firstName}${b.lastName}`,
              )
            );
          case "role":
            return (
              mul *
              (ROLE_LABELS[a.role] ?? a.role).localeCompare(
                ROLE_LABELS[b.role] ?? b.role,
              )
            );
          case "status":
            return mul * (Number(a.isActive) - Number(b.isActive));
          case "last_login":
            return (
              mul *
              ((a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0) -
                (b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0))
            );
          default:
            return 0;
        }
      });
    }
    return list;
  }, [members, memberSearch, memberRoleFilter, sort, ROLE_LABELS]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedMembers = filteredMembers.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const handleToggleActive = (memberId: string, currentlyActive: boolean) => {
    toggleActive.mutate(
      { userId: memberId, isActive: !currentlyActive },
      {
        onError: (err) =>
          showToast(apiError(err, t("settings.toast.toggle_error")), "error"),
      },
    );
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          mb: "12px",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            flex: "0 0 240px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            px: "10px",
            height: "32px",
            "&:focus-within": {
              borderColor: "var(--accent-border)",
              boxShadow: "0 0 0 3px var(--accent-subtle)",
            },
          }}
        >
          <SearchOutlined
            sx={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }}
          />
          <Box
            component="input"
            placeholder={t("settings.members.search_placeholder")}
            sx={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: "12px",
              color: "var(--text)",
              fontFamily: "inherit",
            }}
            value={memberSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMemberSearch(e.target.value)
            }
          />
        </Box>
        <Box
          component="select"
          sx={{
            appearance: "none",
            WebkitAppearance: "none",
            background:
              "var(--s1) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E\") no-repeat right 12px center",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            px: "12px",
            height: "32px",
            pr: "36px",
            boxSizing: "border-box",
            fontSize: "13px",
            color: "var(--text)",
            outline: "none",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
          value={memberRoleFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setMemberRoleFilter(e.target.value)
          }
        >
          <option value="all">{t("settings.members.filter_all_roles")}</option>
          <option value={UserRole.Admin}>{t("settings.role.admin")}</option>
          <option value={UserRole.Developer}>
            {t("settings.role.developer")}
          </option>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          size="small"
          disableElevation
          onClick={onInviteClick}
          startIcon={<PersonAddOutlined sx={{ fontSize: "13px !important" }} />}
          sx={{
            textTransform: "none",
            background:
              "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)",
            color: "#fff",
            boxShadow: "none",
            "&:hover": {
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)",
              boxShadow: "none",
              transform: "none",
            },
            "&:active": { boxShadow: "none" },
          }}
        >
          {t("settings.members.add_member")}
        </Button>
      </Box>

      <Box
        ref={tableWrapRef}
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--s1)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
        }}
      >
        {loadingMembers ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={20} />
          </Box>
        ) : filteredMembers.length === 0 ? (
          <Box
            className="empty-state"
            sx={{ flex: 1, justifyContent: "center" }}
          >
            <GroupOutlined className="empty-state-icon" sx={{ fontSize: 40 }} />
            <Box className="empty-state-title">
              {t("settings.members.empty")}
            </Box>
            <Box className="empty-state-subtitle">
              {t("settings.members.empty_subtitle")}
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <Box component="thead">
                  <Box
                    component="tr"
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      background: "var(--s2)",
                    }}
                  >
                    {[
                      {
                        key: "member",
                        label: t("settings.members.col_member"),
                        width: "auto",
                      },
                      {
                        key: "role",
                        label: t("settings.members.col_role"),
                        width: "90px",
                      },
                      {
                        key: "status",
                        label: t("settings.members.col_status"),
                        width: "110px",
                      },
                      {
                        key: "last_login",
                        label: t("settings.members.col_last_login"),
                        width: "220px",
                      },
                      { key: "actions", label: "", width: "48px" },
                    ].map(({ key, label, width }) => {
                      const sortable = key !== "actions";
                      const isActive = sort?.col === key;
                      return (
                        <Box
                          component="th"
                          key={key}
                          onClick={() => sortable && toggleSort(key)}
                          sx={{
                            px: "16px",
                            py: "10px",
                            textAlign: "left",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: isActive ? "var(--accent)" : "var(--muted)",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            width,
                            cursor: sortable ? "pointer" : "default",
                            userSelect: "none",
                            transition: "color 0.12s",
                            "&:hover": sortable
                              ? { color: "var(--text-secondary)" }
                              : {},
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            {label}
                            {sortable && isActive && (
                              <Box
                                sx={{
                                  fontSize: "12px",
                                  color: "var(--accent)",
                                  lineHeight: 1,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                {sort?.dir === "asc" ? "↑" : "↓"}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
                <Box component="tbody">
                  {paginatedMembers.map((m) => (
                    <Box
                      component="tr"
                      key={m.id}
                      sx={{
                        borderBottom: "1px solid var(--border)",
                        "&:last-child": { borderBottom: "none" },
                        "&:hover": { background: "var(--s2)" },
                        "&:hover .row-actions": { opacity: "1 !important" },
                        transition: "background 0.1s",
                      }}
                    >
                      <Box component="td" sx={{ px: "16px", py: "10px" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <Box>
                            <Box
                              sx={{
                                fontWeight: 600,
                                color: "var(--text)",
                                lineHeight: 1.3,
                              }}
                            >
                              {m.firstName} {m.lastName}
                            </Box>
                            <Box
                              sx={{ color: "var(--muted2)", fontSize: "11px" }}
                            >
                              {m.email}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      <Box component="td" sx={{ px: "16px", py: "10px" }}>
                        <Box
                          sx={{
                            fontWeight: 400,
                            color: "var(--text)",
                            lineHeight: 1.3,
                          }}
                        >
                          {ROLE_LABELS[m.role] ?? m.role}
                        </Box>
                      </Box>
                      <Box component="td" sx={{ px: "16px", py: "10px" }}>
                        <Box
                          sx={{
                            fontWeight: 400,
                            color: "var(--text)",
                            lineHeight: 1.3,
                          }}
                        >
                          {m.isActive
                            ? t("settings.members.status_active")
                            : t("settings.members.status_inactive")}
                        </Box>
                      </Box>
                      <Box
                        component="td"
                        sx={{
                          px: "16px",
                          py: "10px",
                          color: "var(--muted2)",
                          fontSize: "11px",
                        }}
                      >
                        {m.lastLoginAt
                          ? formatDistanceToNow(new Date(m.lastLoginAt), {
                              addSuffix: true,
                              locale: getDateFnsLocale(culture),
                            })
                          : "—"}
                      </Box>
                      <Box
                        component="td"
                        sx={{ px: "16px", py: "10px", textAlign: "right" }}
                      >
                        {m.id !== user?.id &&
                          (toggleActive.isPending &&
                          toggleActive.variables?.userId === m.id ? (
                            <CircularProgress size={13} />
                          ) : (
                            <RowActions
                              actions={[
                                {
                                  icon: m.isActive ? (
                                    <BlockOutlined sx={{ fontSize: 13 }} />
                                  ) : (
                                    <CheckCircleOutlineOutlined
                                      sx={{ fontSize: 13 }}
                                    />
                                  ),
                                  label: m.isActive
                                    ? t("settings.members.deactivate")
                                    : t("settings.members.activate"),
                                  onClick: () =>
                                    handleToggleActive(m.id, m.isActive),
                                  color: m.isActive ? "red" : "green",
                                },
                              ]}
                            />
                          ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
            <MemberPagination
              page={page}
              totalPages={totalPages}
              total={filteredMembers.length}
              onChange={setPage}
            />
          </>
        )}
      </Box>
    </>
  );
};
