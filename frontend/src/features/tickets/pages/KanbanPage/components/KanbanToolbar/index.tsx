import React from "react";
import Box from "@mui/material/Box";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import FilterListOutlined from "@mui/icons-material/FilterListOutlined";
import { useT } from "@/i18n/I18nContext";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  activeFilterCount: number;
  onOpenFilters: () => void;
}

export const KanbanToolbar: React.FC<Props> = ({
  search,
  onSearchChange,
  activeFilterCount,
  onOpenFilters,
}) => {
  const t = useT();

  return (
    <Box
      sx={{
        px: "28px",
        pt: "20px",
        pb: "14px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        position: "relative",
        zIndex: 2,
      }}
    >
      <Box
        sx={{
          width: "280px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--s1)",
          border: "1px solid var(--border)",
          borderRadius: 'var(--r)',
          px: "10px",
          height: "32px",
          transition: "border-color 0.15s, box-shadow 0.15s",
          "&:focus-within": {
            borderColor: "var(--accent-border)",
            boxShadow: "0 0 0 3px var(--accent-subtle)",
          },
        }}
      >
        <SearchOutlined
          sx={{ color: "var(--muted)", fontSize: "14px", flexShrink: 0 }}
        />
        <Box
          component="input"
          placeholder={t("tickets.kanban.search_placeholder")}
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onSearchChange(e.target.value)
          }
          sx={{
            all: "unset",
            flex: 1,
            fontSize: "12.5px",
            color: "var(--text)",
            "&::placeholder": { color: "var(--muted)" },
            "&:focus": { outline: "none", boxShadow: "none !important" },
          }}
        />
      </Box>

      <Box
        component="button"
        onClick={onOpenFilters}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          height: "32px",
          px: "14px",
          borderRadius: 'var(--r)',
          border: `1px solid ${activeFilterCount > 0 ? "var(--accent-border)" : "var(--border)"}`,
          background:
            activeFilterCount > 0 ? "var(--accent-subtle)" : "var(--s1)",
          color:
            activeFilterCount > 0 ? "var(--accent)" : "var(--text-secondary)",
          fontSize: "13px",
          fontWeight: activeFilterCount > 0 ? 600 : 500,
          cursor: "pointer",
          transition: "all 0.12s",
          outline: "none",
          flexShrink: 0,
          "&:hover": {
            borderColor:
              activeFilterCount > 0 ? "var(--accent-border)" : "var(--border2)",
            background:
              activeFilterCount > 0 ? "var(--accent-subtle)" : "var(--s2)",
          },
        }}
      >
        <FilterListOutlined sx={{ fontSize: 15 }} />
        {t("tickets.kanban.filters_button")}
        {activeFilterCount > 0 && ` (${activeFilterCount})`}
      </Box>
    </Box>
  );
};
