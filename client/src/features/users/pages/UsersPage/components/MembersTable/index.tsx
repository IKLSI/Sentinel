import type React from "react";
import Box from "@mui/material/Box";
import { LoadingStatus } from "@/components/ui/common/feedback/LoadingStatus";
import { SortableTh } from "@/components/ui/common/table/SortableTh";
import {
  type SkeletonCell,
  TableSkeletonRows,
} from "@/components/ui/common/table/TableSkeletonRows";
import { useT } from "@/contexts/I18nContext";
import type { User } from "@/domains/users/types";
import { SortDirection, UserSortField } from "@/enums";
import { MemberRow } from "@/features/users/pages/UsersPage/components/MembersTable/components/MemberRow";
import type { useMemberAccessChanges } from "@/features/users/pages/UsersPage/hooks";
import type { SortState } from "@/hooks/useSortState";
import { DELAYED_REVEAL_SX } from "@/styles/keyframes";

const SKELETON_CELLS: readonly SkeletonCell[] = [
  "avatar",
  "chip",
  "chip",
  "text",
  "empty",
];

const ACTIONS_COLUMN_KEY = "actions";

interface MemberColumn {
  key: UserSortField | typeof ACTIONS_COLUMN_KEY;
  label: string;
  width: string;
}

interface Props {
  members: User[];
  loading: boolean;
  sort: SortState<UserSortField>;
  onSort: (field: UserSortField) => void;
  roleLabels: Record<string, string>;
  currentUserId: string | undefined;
  accessChanges: ReturnType<typeof useMemberAccessChanges>;
}

export const MembersTable: React.FC<Props> = ({
  members,
  loading,
  sort,
  onSort,
  roleLabels,
  currentUserId,
  accessChanges,
}) => {
  const t = useT();

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

  return (
    <Box sx={{ position: "relative", flex: 1, overflow: "hidden" }}>
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
                  onSort={() => sortable && onSort(key as UserSortField)}
                >
                  {label}
                </SortableTh>
              );
            })}
          </Box>
        </Box>
        <Box
          component="tbody"
          aria-busy={loading || undefined}
          sx={loading ? DELAYED_REVEAL_SX : undefined}
        >
          {loading ? (
            <TableSkeletonRows cells={SKELETON_CELLS} />
          ) : (
            members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                roleLabels={roleLabels}
                isCurrentUser={m.id === currentUserId}
                busy={accessChanges.isMemberBusy(m)}
                onToggleAccessStatus={accessChanges.handleToggleAccessStatus}
                onRoleChange={accessChanges.handleRoleChange}
              />
            ))
          )}
        </Box>
      </Box>
      {loading && <LoadingStatus label={t("settings.members.loading")} />}
    </Box>
  );
};
