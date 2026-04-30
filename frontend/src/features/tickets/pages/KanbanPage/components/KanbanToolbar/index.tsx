import React from "react";
import Box from "@mui/material/Box";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
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
        pt: "36px",
        pb: "14px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: "8px",
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
          borderRadius: "9px",
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
          gap: "6px",
          height: "32px",
          px: "12px",
          borderRadius: "9px",
          border: `1px solid ${activeFilterCount > 0 ? "var(--accent-border)" : "var(--border)"}`,
          background:
            activeFilterCount > 0 ? "var(--accent-subtle)" : "var(--s1)",
          color:
            activeFilterCount > 0 ? "var(--accent)" : "var(--text-secondary)",
          fontSize: "12.5px",
          fontWeight: activeFilterCount > 0 ? 600 : 500,
          cursor: "pointer",
          transition: "all 0.15s",
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
        <TuneOutlined sx={{ fontSize: "14px" }} />
        {t("tickets.kanban.filters_button")}
        {activeFilterCount > 0 && (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "var(--accent)",
              color: "var(--s1)",
              fontSize: "9px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
          >
            {activeFilterCount}
          </Box>
        )}
      </Box>
    </Box>
  );
};
