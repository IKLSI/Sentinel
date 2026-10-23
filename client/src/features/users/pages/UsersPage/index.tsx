import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/PageContainer";
import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import { MembersTab } from "@/features/users/pages/UsersPage/components/MembersTab";
import { InviteModal } from "@/features/users/pages/UsersPage/components/InviteModal";
import {
  criterionFromSearch,
  searchFromCriterion,
} from "@/features/users/pages/UsersPage/filterParams";

const routeApi = getRouteApi("/_authenticated/_admin/users");

export const UsersPage: React.FC = () => {
  const navigate = routeApi.useNavigate();
  const searchParams = routeApi.useSearch();
  const [inviteOpen, setInviteOpen] = useState(false);

  const criterion = useMemo(
    () => criterionFromSearch(searchParams),
    [searchParams],
  );

  const handleCriterionChange = useCallback(
    (next: FilterCriterion | null) => {
      navigate({
        search: (previous) => ({ ...previous, ...searchFromCriterion(next) }),
        replace: true,
      });
    },
    [navigate],
  );

  return (
    <>
      <PageContainer>
        <MembersTab
          criterion={criterion}
          onCriterionChange={handleCriterionChange}
          onInviteClick={() => setInviteOpen(true)}
        />
      </PageContainer>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
};
