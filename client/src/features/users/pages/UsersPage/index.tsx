import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import Button from "@mui/material/Button";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { Pagination } from "@/components/ui/common/table/Pagination";
import { FilterBuilder } from "@/components/ui/forms/FilterBuilder";
import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import { SearchInput } from "@/components/ui/forms/SearchInput";
import { useI18n } from "@/contexts/I18nContext";
import { InviteModal } from "@/features/users/pages/UsersPage/components/InviteModal";
import { MemberAccessConfirmModal } from "@/features/users/pages/UsersPage/components/MemberAccessConfirmModal";
import { MembersTable } from "@/features/users/pages/UsersPage/components/MembersTable";
import {
  buildUserFilterFields,
  buildUserFilterLabels,
  criterionFromSearch,
  searchFromCriterion,
} from "@/features/users/pages/UsersPage/filterParams";
import {
  useMemberAccessChanges,
  useMembersListing,
} from "@/features/users/pages/UsersPage/hooks";
import { PANEL_SX } from "@/helpers/cardSx";
import { useAuth } from "@/hooks/useAuth";
import { PAGE_SIZE_OPTIONS } from "@/hooks/usePagination";

const routeApi = getRouteApi("/_authenticated/_admin/users");

const TOOLBAR_SX = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  mb: "12px",
  flexShrink: 0,
  position: "relative",
  zIndex: 2,
} as const;

const PANEL_BODY_SX = {
  flex: 1,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  ...PANEL_SX,
} as const;

export const UsersPage: React.FC = () => {
  const navigate = routeApi.useNavigate();
  const searchParams = routeApi.useSearch();
  const { user } = useAuth();
  const { t } = useI18n();
  const [inviteOpen, setInviteOpen] = useState(false);

  const criterion = useMemo(
    () => criterionFromSearch(searchParams),
    [searchParams],
  );

  const navigateToCriterion = useCallback(
    (next: FilterCriterion | null) => {
      navigate({
        search: (previous) => ({ ...previous, ...searchFromCriterion(next) }),
        replace: true,
      });
    },
    [navigate],
  );

  const roleLabels: Record<string, string> = useMemo(
    () => ({
      Admin: t("settings.role.admin"),
      Developer: t("settings.role.developer"),
    }),
    [t],
  );

  const {
    memberSearch,
    handleSearchChange,
    handleCriterionChange,
    pagination,
    sort,
    toggleSort,
    usersQuery,
  } = useMembersListing(criterion, navigateToCriterion);
  const accessChanges = useMemberAccessChanges();

  const members = usersQuery.data?.items ?? [];
  const totalMembers = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, usersQuery.data?.totalPages ?? 1);
  const loadingMembers = usersQuery.isLoading;

  return (
    <>
      <PageContainer>
        <Box sx={TOOLBAR_SX}>
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
            onClick={() => setInviteOpen(true)}
            startIcon={
              <PersonAddOutlined sx={{ fontSize: "13px !important" }} />
            }
          >
            {t("settings.members.add_member")}
          </Button>
        </Box>

        <Box sx={PANEL_BODY_SX}>
          {!loadingMembers && members.length === 0 ? (
            <EmptyState
              icon={SearchOutlined}
              title={t("common.no_results")}
              subtitle={t("settings.members.empty_subtitle")}
              sx={{ flex: 1 }}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                opacity: usersQuery.isFetching && !loadingMembers ? 0.6 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <MembersTable
                members={members}
                loading={loadingMembers}
                sort={sort}
                onSort={toggleSort}
                roleLabels={roleLabels}
                currentUserId={user?.id}
                accessChanges={accessChanges}
              />
              {!loadingMembers && (
                <Pagination
                  page={pagination.page}
                  totalPages={totalPages}
                  total={totalMembers}
                  onChange={pagination.setPage}
                  pageSize={pagination.pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  onPageSizeChange={pagination.setPageSize}
                  countLabel={
                    totalMembers > 1
                      ? t("settings.members.count_plural")
                      : t("settings.members.count_singular")
                  }
                />
              )}
            </Box>
          )}
        </Box>

        <MemberAccessConfirmModal
          change={accessChanges.pendingChange}
          roleLabels={roleLabels}
          saving={accessChanges.saving}
          onClose={accessChanges.cancelPendingChange}
          onConfirm={accessChanges.confirmPendingChange}
        />
      </PageContainer>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
};
