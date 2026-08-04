import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddOutlined from "@mui/icons-material/AddOutlined";
import { useT } from "@/contexts/I18nContext";
import { SearchInput } from "@/components/ui/forms/SearchInput";
import { SelectField } from "@/components/ui/forms/SelectField";
import { ExportButton } from "@/components/ui/common/ExportButton";
import {
  buildTicketFilterGroups,
  type TicketFiltersState,
} from "@/features/tickets/pages/TicketsPage/filters";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  filters: TicketFiltersState;
  onFiltersChange: (f: TicketFiltersState) => void;
  onCreate: () => void;
  onExport: () => void;
  exporting: boolean;
}

export const TicketsToolbar: React.FC<Props> = ({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  onCreate,
  onExport,
  exporting,
}) => {
  const t = useT();
  const groups = buildTicketFilterGroups(t);

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

      {groups.map(({ key, label, tone, options }) => (
        <SelectField
          key={key}
          variant="pill"
          tone={tone}
          value={filters[key]}
          options={options}
          ariaLabel={label}
          placeholder={label}
          clearLabel={t("tickets.list.filter_remove", { label })}
          onChange={(value) => onFiltersChange({ ...filters, [key]: value })}
        />
      ))}

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
