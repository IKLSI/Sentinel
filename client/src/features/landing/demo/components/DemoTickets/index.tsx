import type React from "react";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { PageContainer } from "@/components/layout/PageContainer";
import { Pagination } from "@/components/ui/common/table/Pagination";
import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import { useT } from "@/contexts/I18nContext";
import { SortDirection, TicketSortField } from "@/enums";
import { useSortState } from "@/hooks/useSortState";
import { DEMO_PROJECT_OPTIONS } from "@/features/landing/demo/fixtures/projects";
import {
  DEMO_TICKETS,
  DEMO_TICKETS_TOTAL,
  DEMO_TICKETS_TOTAL_PAGES,
  DEMO_USERS,
} from "@/features/landing/demo/fixtures/tickets";
import { selectDemoTickets } from "@/features/landing/demo/ticketList";
import { TicketsToolbar } from "@/features/tickets/pages/TicketsPage/components/TicketsToolbar";
import {
  TicketsTable,
  type SortState,
} from "@/features/tickets/pages/TicketsPage/components/TicketsTable";
import { PANEL_SX } from "@/helpers/cardSx";

const FIRST_PAGE = 1;

const noop = () => {};

export const DemoTickets: React.FC = () => {
  const t = useT();
  const [search, setSearch] = useState("");
  const [criterion, setCriterion] = useState<FilterCriterion | null>(null);
  const [sort, toggleSort] = useSortState<SortState["col"]>({
    col: TicketSortField.Priority,
    dir: SortDirection.Desc,
  });

  const tickets = useMemo(
    () => selectDemoTickets(DEMO_TICKETS, search, criterion, sort),
    [search, criterion, sort],
  );

  const hasFiltersApplied = !!search.trim() || !!criterion;
  const total = hasFiltersApplied ? tickets.length : DEMO_TICKETS_TOTAL;

  return (
    <PageContainer sx={{ height: "100%", boxSizing: "border-box" }}>
      <TicketsToolbar
        search={search}
        onSearchChange={setSearch}
        criterion={criterion}
        onCriterionChange={setCriterion}
        users={DEMO_USERS}
        projects={DEMO_PROJECT_OPTIONS}
        onCreate={noop}
        onExport={noop}
        exporting={false}
      />

      <Box
        sx={{
          ...PANEL_SX,
          overflow: "hidden",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TicketsTable
          tickets={tickets}
          sort={sort}
          onToggleSort={toggleSort}
          onEdit={noop}
          onDelete={noop}
          hasFiltersApplied={hasFiltersApplied}
        />

        <Pagination
          page={FIRST_PAGE}
          totalPages={hasFiltersApplied ? FIRST_PAGE : DEMO_TICKETS_TOTAL_PAGES}
          total={total}
          onChange={noop}
          countLabel={
            total > 1
              ? t("tickets.list.count_plural")
              : t("tickets.list.count_singular")
          }
        />
      </Box>
    </PageContainer>
  );
};
