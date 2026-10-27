import { useCallback, useState } from "react";
import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import type { PendingMemberChange } from "@/features/users/pages/UsersPage/components/MemberAccessConfirmModal";
import { queryFromCriterion } from "@/features/users/pages/UsersPage/filterParams";
import type { User } from "@/domains/users/types";
import { useUpdateUserMutation } from "@/domains/users/mutations";
import { useUsersQuery } from "@/domains/users/queries";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSortState } from "@/hooks/useSortState";
import { usePagination } from "@/hooks/usePagination";
import { SortDirection, UserAccessStatus, UserSortField } from "@/enums";

const SEARCH_DEBOUNCE_MS = 300;

export const useMembersListing = (
  criterion: FilterCriterion | null,
  onCriterionChange: (criterion: FilterCriterion | null) => void,
) => {
  const [memberSearch, setMemberSearch] = useState("");
  const debouncedSearch = useDebouncedValue(memberSearch, SEARCH_DEBOUNCE_MS);
  const pagination = usePagination();
  const { page, pageSize, resetPage } = pagination;
  const [sort, toggleSort] = useSortState<UserSortField>({
    col: UserSortField.Member,
    dir: SortDirection.Asc,
  });

  const handleSearchChange = useCallback(
    (v: string) => {
      setMemberSearch(v);
      resetPage();
    },
    [resetPage],
  );

  const handleCriterionChange = useCallback(
    (next: FilterCriterion | null) => {
      resetPage();
      onCriterionChange(next);
    },
    [onCriterionChange, resetPage],
  );

  const usersQuery = useUsersQuery({
    page,
    pageSize,
    sortBy: sort.col,
    sortDirection: sort.dir,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...queryFromCriterion(criterion),
  });

  return {
    memberSearch,
    handleSearchChange,
    handleCriterionChange,
    pagination,
    sort,
    toggleSort,
    usersQuery,
  };
};

export const useMemberAccessChanges = () => {
  const onToggleError = useApiErrorToast("settings.toast.toggle_error");
  const updateAccessStatus = useUpdateUserMutation();
  const [pendingChange, setPendingChange] =
    useState<PendingMemberChange | null>(null);

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

  const isMemberBusy = (member: User) =>
    updateAccessStatus.isPending &&
    updateAccessStatus.variables?.id === member.id;

  return {
    pendingChange,
    saving: updateAccessStatus.isPending,
    isMemberBusy,
    handleToggleAccessStatus,
    handleRoleChange,
    confirmPendingChange,
    cancelPendingChange: () => setPendingChange(null),
  };
};
