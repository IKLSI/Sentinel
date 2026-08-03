import React, { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddOutlined from "@mui/icons-material/AddOutlined";
import FilterListOutlined from "@mui/icons-material/FilterListOutlined";
import { useT } from "@/contexts/I18nContext";
import { TICKET_STATUSES, statusLabelKeys } from "@/features/tickets/constants";
import { selectSx } from "@/features/tickets/pages/TicketsPage/helpers";
import { SearchInput } from "@/components/ui/forms/SearchInput";
import { ExportButton } from "@/components/ui/common/ExportButton";

interface FiltersState {
  priority: string;
  status: string;
  type: string;
}

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  filters: FiltersState;
  onFiltersChange: (f: FiltersState) => void;
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
  const filtersRef = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  useEffect(() => {
    if (!filtersOpen) return;
    const handler = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node))
        setFiltersOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filtersOpen]);

  const hasFilter = !!(filters.priority || filters.status || filters.type);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
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

      <Box ref={filtersRef} sx={{ position: "relative" }}>
        {hasFilter && (
          <Box
            sx={{
              position: "absolute",
              top: -5,
              right: -5,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
              zIndex: 1,
              border: "2px solid var(--bg)",
            }}
          />
        )}
        <Box
          component="button"
          onClick={() => setFiltersOpen((v) => !v)}
          sx={{
            all: "unset",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            px: "14px",
            height: "32px",
            background: filtersOpen ? "var(--accent-subtle)" : "var(--s1)",
            border: `1px solid ${filtersOpen ? "var(--accent-border)" : "var(--border)"}`,
            borderRadius: "var(--r)",
            fontSize: "13px",
            fontWeight: 500,
            color: filtersOpen ? "var(--accent)" : "var(--text-secondary)",
            transition: "all 0.12s",
            "&:hover": {
              background: "var(--s2)",
              borderColor: "var(--border2)",
            },
          }}
        >
          <FilterListOutlined sx={{ fontSize: 15 }} />
          {t("tickets.list.filters")}
        </Box>

        {filtersOpen && (
          <Box
            sx={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 50,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -6,
                left: "calc(50% - 6px)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderBottom: "6px solid var(--border)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: -5,
                left: "calc(50% - 5px)",
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderBottom: "5px solid var(--s1)",
              }}
            />
            <Box
              sx={{
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                p: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                minWidth: "220px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                animation: "fadeInUp 0.12s ease forwards",
              }}
            >
              {[
                {
                  label: t("tickets.list.filter_priority"),
                  key: "priority" as const,
                  value: filters.priority,
                  options: [
                    ["", t("tickets.list.filter_all_feminine")],
                    ["critical", t("tickets.list.priority_critical")],
                    ["high", t("tickets.list.priority_high")],
                    ["medium", t("tickets.list.priority_medium")],
                    ["low", t("tickets.list.priority_low")],
                  ],
                },
                {
                  label: t("tickets.list.filter_status"),
                  key: "status" as const,
                  value: filters.status,
                  options: [
                    ["", t("tickets.list.filter_all_masculine")],
                    ...TICKET_STATUSES.map(
                      (status) =>
                        [status, t(statusLabelKeys[status])] as [
                          string,
                          string,
                        ],
                    ),
                  ],
                },
                {
                  label: t("tickets.list.filter_type"),
                  key: "type" as const,
                  value: filters.type,
                  options: [
                    ["", t("tickets.list.filter_all_masculine")],
                    ["bug", t("tickets.list.type_bug")],
                    ["feature", t("tickets.list.type_feature")],
                    ["security", t("tickets.list.type_security")],
                    ["performance", t("tickets.list.type_performance_short")],
                  ],
                },
              ].map(({ label, key, value, options }) => (
                <Box key={key}>
                  <Box
                    sx={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "var(--muted)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      mb: "5px",
                    }}
                  >
                    {label}
                  </Box>
                  <Box
                    component="select"
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      onFiltersChange({ ...filters, [key]: e.target.value })
                    }
                    sx={{ ...selectSx, width: "100%", boxSizing: "border-box" }}
                  >
                    {options.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Box>
                </Box>
              ))}

              {hasFilter && (
                <Box
                  component="button"
                  onClick={() => {
                    onFiltersChange({ priority: "", status: "", type: "" });
                    setFiltersOpen(false);
                  }}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    mt: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--red)",
                    background: "var(--red-subtle)",
                    border:
                      "1px solid color-mix(in srgb, var(--red) 20%, transparent)",
                    borderRadius: "var(--r-sm)",
                    py: "8px",
                    transition: "background 0.12s, border-color 0.12s",
                    "&:hover": {
                      background:
                        "color-mix(in srgb, var(--red) 14%, transparent)",
                      borderColor:
                        "color-mix(in srgb, var(--red) 35%, transparent)",
                    },
                  }}
                >
                  {t("tickets.list.reset")}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>

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
