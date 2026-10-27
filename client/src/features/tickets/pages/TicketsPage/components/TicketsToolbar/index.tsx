import type React from "react";
import { useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddOutlined from "@mui/icons-material/AddOutlined";
import { useT } from "@/contexts/I18nContext";
import { SearchInput } from "@/components/ui/forms/SearchInput";
import { FilterBuilder } from "@/components/ui/forms/FilterBuilder";
import type { FilterCriterion } from "@/components/ui/forms/FilterBuilder/types";
import { ExportButton } from "@/components/ui/common/ExportButton";
import type { ProjectOption } from "@/domains/projects/types";
import type { UserOption } from "@/domains/users/types";
import {
  buildTicketFilterFields,
  buildTicketFilterLabels,
} from "@/features/tickets/pages/TicketsPage/components/TicketsToolbar/filters";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  criterion: FilterCriterion | null;
  onCriterionChange: (criterion: FilterCriterion | null) => void;
  users: UserOption[];
  projects: ProjectOption[];
  onCreate: () => void;
  onExport: () => void;
  exporting: boolean;
}

export const TicketsToolbar: React.FC<Props> = ({
  search,
  onSearchChange,
  criterion,
  onCriterionChange,
  users,
  projects,
  onCreate,
  onExport,
  exporting,
}) => {
  const t = useT();
  const filterFields = useMemo(
    () => buildTicketFilterFields(t, users, projects),
    [t, users, projects],
  );
  const filterLabels = useMemo(() => buildTicketFilterLabels(t), [t]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        mb: "16px",
        flexShrink: 0,
        position: "relative",
        zIndex: 2,
      }}
    >
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={t("tickets.list.search_placeholder")}
      />

      <FilterBuilder
        fields={filterFields}
        value={criterion}
        onChange={onCriterionChange}
        labels={filterLabels}
      />

      <Box sx={{ flex: 1 }} />

      <Button
        variant="contained"
        size="small"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
        }}
        onClick={onCreate}
      >
        <AddOutlined sx={{ fontSize: 14 }} />
        {t("tickets.list.new_ticket")}
      </Button>

      <ExportButton
        onClick={onExport}
        exporting={exporting}
        label={t("tickets.list.export")}
      />
    </Box>
  );
};
