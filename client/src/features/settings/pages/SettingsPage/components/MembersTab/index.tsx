import type React from "react";
import { useCallback, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import { CenteredLoader } from "@/components/ui/common/CenteredLoader";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { SortableTh } from "@/components/ui/common/SortableTh";
import { MemberRow } from "@/features/settings/pages/SettingsPage/components/MemberRow";
import {
  MemberAccessConfirmModal,
  type PendingMemberChange,
} from "@/features/settings/pages/SettingsPage/components/MemberAccessConfirmModal";
import type { User } from "@/domains/users/types";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/contexts/I18nContext";
import { useUpdateUserMutation } from "@/domains/users/mutations";
import { useUsersQuery } from "@/domains/users/queries";
import { Pagination } from "@/components/ui/common/Pagination";
import { SearchInput } from "@/components/ui/forms/SearchInput";
import { FilterBuilder } from "@/components/ui/forms/FilterBuilder";
import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import { queryFromCriterion } from "@/features/users/pages/UsersPage/filterParams";
import {
  buildUserFilterFields,
  buildUserFilterLabels,
} from "@/features/users/pages/UsersPage/filters";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSortState } from "@/hooks/useSortState";
import { SortDirection, UserAccessStatus, UserSortField } from "@/enums";

const ACTIONS_COLUMN_KEY = "actions";
const DEFAULT_PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

interface Props {
  criterion: FilterCriterion | null;
  onCriterionChange: (criterion: FilterCriterion | null) => void;
  onInviteClick: () => void;
}

interface MemberColumn {
  key: UserSortField | typeof ACTIONS_COLUMN_KEY;
  label: string;
  width: string;
}

export const MembersTab: React.FC<Props> = ({
  criterion,
  onCriterionChange,
  onInviteClick,
}) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const onToggleError = useApiErrorToast("settings.toast.toggle_error");

  const ROLE_LABELS: Record<string, string> = useMemo(
    () => ({
      Admin: t("settings.role.admin"),
      Developer: t("settings.role.developer"),
    }),
    [t],
  );

  const updateAccessStatus = useUpdateUserMutation();
  const [pendingChange, setPendingChange] =
    useState<PendingMemberChange | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const debouncedSearch = useDebouncedValue(memberSearch, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);
  const [sort, toggleSort] = useSortState<UserSortField>(
    { col: UserSortField.Member, dir: SortDirection.Asc },
    () => setPage(1),
  );

  const handleSearchChange = useCallback((v: string) => {
    setMemberSearch(v);
    setPage(1);
  }, []);

  const handleCriterionChange = useCallback(
    (next: FilterCriterion | null) => {
      setPage(1);
      onCriterionChange(next);
    },
    [onCriterionChange],
  );

  const usersQuery = useUsersQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    sortBy: sort.col,
    sortDirection: sort.dir,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...queryFromCriterion(criterion),
  });
  const members = usersQuery.data?.items ?? [];
  const totalMembers = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, usersQuery.data?.totalPages ?? 1);
  const loadingMembers = usersQuery.isLoading && !usersQuery.data;

  const columns: MemberColumn[] = [
    {
      key: UserSortField.Member,
      label: t("settings.members.col_member"),
      width: "50%",
    },
    {
      key: UserSortField.Role,
      label: t("settings.members.col_role"),
      width: "13%",
    },
    {
      key: UserSortField.Status,
      label: t("settings.members.col_status"),
      width: "14%",
    },
    {
      key: UserSortField.LastLogin,
      label: t("settings.members.col_last_login"),
      width: "15%",
    },
    { key: ACTIONS_COLUMN_KEY, label: "", width: "8%" },
  ];

  const handleToggleAccessStatus = (member: User) => {
    if (member.accessStatus === UserAccessStatus.Active) {
      setPendingChange({ kind: "suspend", member });
      return;
    }
    updateAccessStatus.mutate(
      { id: member.id, data: { accessStatus: UserAccessStatus.Active } },
      { onError: onToggleError },
    );
  };

  const handleRoleChange = (member: User, role: string) => {
    if (role !== member.role) setPendingChange({ kind: "role", member, role });
  };

  const confirmPendingChange = () => {
    if (!pendingChange) return;
    updateAccessStatus.mutate(
      {
        id: pendingChange.member.id,
        data:
          pendingChange.kind === "role"
            ? { role: pendingChange.role }
            : { accessStatus: UserAccessStatus.Suspended },
      },
      {
        onSuccess: () => setPendingChange(null),
        onError: onToggleError,
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
          position: "relative",
          zIndex: 2,
        }}
      >
        <SearchInput
          value={memberSearch}
          onChange={handleSearchChange}
          placeholder={t("settings.members.search_placeholder")}
          width="240px"
          sx={{ flex: "0 0 240px" }}
        />
        <FilterBuilder
          fields={buildUserFilterFields(t)}
          value={criterion}
          onChange={handleCriterionChange}
          labels={buildUserFilterLabels(t)}
        />
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          size="small"
          onClick={onInviteClick}
          startIcon={<PersonAddOutlined sx={{ fontSize: "13px !important" }} />}
        >
          {t("settings.members.add_member")}
        </Button>
      </Box>

      <Box
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
          <CenteredLoader />
        ) : members.length === 0 ? (
          <EmptyState
            icon={GroupOutlined}
            title={t("settings.members.empty")}
            subtitle={t("settings.members.empty_subtitle")}
            iconSize={40}
            sx={{ flex: 1, justifyContent: "center" }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              opacity: usersQuery.isFetching ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                  fontSize: "12px",
                }}
              >
                <Box component="thead">
                  <Box component="tr">
                    {columns.map(({ key, label, width }) => {
                      const sortable = key !== ACTIONS_COLUMN_KEY;
                      return (
                        <SortableTh
                          key={key}
                          width={width}
                          sortable={sortable}
                          active={sort.col === key}
                          ascending={sort.dir === SortDirection.Asc}
                          onSort={() =>
                            sortable && toggleSort(key as UserSortField)
                          }
                        >
                          {label}
                        </SortableTh>
                      );
                    })}
                  </Box>
                </Box>
                <Box component="tbody">
                  {members.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      roleLabels={ROLE_LABELS}
                      isCurrentUser={m.id === user?.id}
                      busy={
                        updateAccessStatus.isPending &&
                        updateAccessStatus.variables?.id === m.id
                      }
                      onToggleAccessStatus={handleToggleAccessStatus}
                      onRoleChange={handleRoleChange}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={totalMembers}
              onChange={setPage}
              previousLabel={t("settings.pagination.previous")}
              nextLabel={t("settings.pagination.next")}
              countLabel={
                totalMembers > 1
                  ? t("settings.members.count_plural")
                  : t("settings.members.count_singular")
              }
            />
          </Box>
        )}
      </Box>

      <MemberAccessConfirmModal
        change={pendingChange}
        roleLabels={ROLE_LABELS}
        saving={updateAccessStatus.isPending}
        onClose={() => setPendingChange(null)}
        onConfirm={confirmPendingChange}
      />
    </>
  );
};
