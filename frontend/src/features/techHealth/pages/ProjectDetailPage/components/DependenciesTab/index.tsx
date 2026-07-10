import type React from "react";
import { memo, useRef } from "react";
import Box from "@mui/material/Box";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { useVirtualizer } from "@tanstack/react-virtual";
import { StatusChip } from "@/components/StatusChip";
import { useT } from "@/i18n/I18nContext";
import type { DependencyDto } from "@/features/techHealth/api/projects";
import { DEP_STATUS, TD, TH } from "../../helpers";

const ESTIMATED_ROW_HEIGHT = 45;
const OVERSCAN = 10;
const COLUMN_COUNT = 6;

const iconSx = { fontSize: 13, color: "var(--muted)", flexShrink: 0 } as const;
const nameSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "13px",
  fontWeight: 600,
} as const;
const nameWrapSx = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
} as const;
const ecoSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "10px",
  color: "var(--muted)",
  background: "var(--s3)",
  px: "7px",
  py: "2px",
  borderRadius: "var(--r-xs)",
} as const;
const versionWrapSx = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
} as const;
const arrowSx = {
  color: "var(--muted)",
  fontFamily: "var(--font-mono)",
} as const;
const latestSx = {
  color: "var(--orange)",
  fontWeight: 600,
  fontFamily: "var(--font-mono)",
} as const;
const noVulnSx = { color: "var(--muted)", fontSize: "12px" } as const;
const rowSx = { "& td": { borderBottom: "1px solid var(--border)" } } as const;
const spacerCellSx = { height: 0, padding: 0, border: 0 } as const;

interface RowProps {
  d: DependencyDto;
  typeProd: string;
  typeDev: string;
  index: number;
  measureRef: (el: HTMLElement | null) => void;
}

const DependencyRow = memo<RowProps>(
  ({ d, typeProd, typeDev, index, measureRef }) => {
    const s = DEP_STATUS[d.status] ?? { labelKey: "", variant: "gray" as const };
    const t = useT();
    return (
      <Box component="tr" ref={measureRef} data-index={index} sx={rowSx}>
        <TD>
          <Box sx={nameWrapSx}>
            <InventoryOutlined sx={iconSx} />
            <Box component="span" sx={nameSx}>
              {d.name}
            </Box>
          </Box>
        </TD>
        <TD>
          <Box component="span" sx={ecoSx}>
            {d.ecosystem}
          </Box>
        </TD>
        <TD>
          <StatusChip variant="gray">
            {d.type === "Prod" ? typeProd : typeDev}
          </StatusChip>
        </TD>
        <TD mono muted>
          <Box sx={versionWrapSx}>
            <span>{d.currentVersion}</span>
            {d.latestVersion && d.latestVersion !== d.currentVersion && (
              <>
                <Box component="span" sx={arrowSx}>
                  →
                </Box>
                <Box component="span" sx={latestSx}>
                  {d.latestVersion}
                </Box>
              </>
            )}
          </Box>
        </TD>
        <TD>
          <StatusChip variant={s.variant}>
            {s.labelKey ? t(s.labelKey) : d.status}
          </StatusChip>
        </TD>
        <TD>
          {d.vulnerabilities.length > 0 ? (
            <StatusChip variant="red">{d.vulnerabilities.length}</StatusChip>
          ) : (
            <Box component="span" sx={noVulnSx}>
              —
            </Box>
          )}
        </TD>
      </Box>
    );
  },
);
DependencyRow.displayName = "DependencyRow";

interface Props {
  dependencies: DependencyDto[];
  filteredDeps: DependencyDto[];
  search: string;
  onSearchChange: (v: string) => void;
}

export const DependenciesTab: React.FC<Props> = ({
  dependencies,
  filteredDeps,
  search,
  onSearchChange,
}) => {
  const t = useT();
  const typeProd = t("tech_health.dep.type_prod");
  const typeDev = t("tech_health.dep.type_dev");
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredDeps.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  if (dependencies.length === 0) {
    return (
      <Box className="empty-state">
        <InventoryOutlined className="empty-state-icon" sx={{ fontSize: 40 }} />
        <Box className="empty-state-title">
          {t("tech_health.empty.no_deps_title")}
        </Box>
        <Box className="empty-state-subtitle">
          {t("tech_health.empty.no_deps_subtitle")}
        </Box>
      </Box>
    );
  }

  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = items.length > 0 ? items[0].start : 0;
  const paddingBottom =
    items.length > 0 ? totalSize - items[items.length - 1].end : 0;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        border: "1px solid var(--border)",
        borderRadius: "var(--r)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          px: "16px",
          py: "14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--s2)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            px: "9px",
            height: "28px",
            width: "calc(30% + 10px)",
            transition: "border-color 0.15s",
            "&:focus-within": {
              borderColor: "var(--accent-border)",
              boxShadow: "0 0 0 3px var(--accent-subtle)",
            },
          }}
        >
          <SearchOutlined
            sx={{ color: "var(--muted)", fontSize: "13px", flexShrink: 0 }}
          />
          <Box
            component="input"
            placeholder={t("tech_health.search_placeholder")}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSearchChange(e.target.value)
            }
            sx={{
              all: "unset",
              flex: 1,
              fontSize: "12px",
              color: "var(--text)",
              "&::placeholder": { color: "var(--muted)" },
              "&:focus": { outline: "none", boxShadow: "none !important" },
            }}
          />
        </Box>
        {search && (
          <Box
            component="span"
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--muted)",
            }}
          >
            {filteredDeps.length} / {dependencies.length}
          </Box>
        )}
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <Box component="colgroup">
            <Box component="col" sx={{ width: "30%" }} />
            <Box component="col" sx={{ width: "12%" }} />
            <Box component="col" sx={{ width: "6%" }} />
            <Box component="col" sx={{ width: "17%" }} />
            <Box component="col" sx={{ width: "10%" }} />
            <Box component="col" sx={{ width: "12%" }} />
          </Box>
          <Box component="thead">
            <Box component="tr">
              <TH>{t("tech_health.table.dep.library")}</TH>
              <TH>{t("tech_health.table.dep.ecosystem")}</TH>
              <TH>{t("tech_health.table.dep.type")}</TH>
              <TH>{t("tech_health.table.dep.version")}</TH>
              <TH>{t("tech_health.table.dep.status")}</TH>
              <TH>{t("tech_health.table.dep.vulns")}</TH>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box ref={scrollRef} sx={{ overflowY: "auto", flex: 1 }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <Box component="colgroup">
            <Box component="col" sx={{ width: "30%" }} />
            <Box component="col" sx={{ width: "12%" }} />
            <Box component="col" sx={{ width: "6%" }} />
            <Box component="col" sx={{ width: "17%" }} />
            <Box component="col" sx={{ width: "10%" }} />
            <Box component="col" sx={{ width: "12%" }} />
          </Box>
          <Box component="tbody">
            {filteredDeps.length === 0 ? (
              <Box component="tr">
                <Box
                  component="td"
                  colSpan={COLUMN_COUNT}
                  sx={{
                    padding: "32px",
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: "13px",
                    borderBottom: "none",
                  }}
                >
                  {t("tech_health.no_results")}
                </Box>
              </Box>
            ) : (
              <>
                {paddingTop > 0 && (
                  <Box component="tr">
                    <Box
                      component="td"
                      colSpan={COLUMN_COUNT}
                      sx={{ ...spacerCellSx, height: `${paddingTop}px` }}
                    />
                  </Box>
                )}
                {items.map((item) => {
                  const d = filteredDeps[item.index];
                  return (
                    <DependencyRow
                      key={d.id}
                      d={d}
                      typeProd={typeProd}
                      typeDev={typeDev}
                      index={item.index}
                      measureRef={virtualizer.measureElement}
                    />
                  );
                })}
                {paddingBottom > 0 && (
                  <Box component="tr">
                    <Box
                      component="td"
                      colSpan={COLUMN_COUNT}
                      sx={{ ...spacerCellSx, height: `${paddingBottom}px` }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
