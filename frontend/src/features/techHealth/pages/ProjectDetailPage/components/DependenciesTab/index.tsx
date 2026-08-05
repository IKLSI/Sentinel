import type React from "react";
import { memo } from "react";
import Box from "@mui/material/Box";
import InventoryOutlined from "@mui/icons-material/InventoryOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { StatusChip } from "@/components/ui/common/StatusChip";
import { TD } from "@/components/ui/common/VirtualTable/TableCells";
import {
  VirtualTable,
  type VirtualTableColumn,
} from "@/components/ui/common/VirtualTable";
import { useT } from "@/contexts/I18nContext";
import type { Dependency } from "@/domains/projects/types";
import type { DependencyStatus } from "@/enums";
import { DEP_STATUS } from "@/features/techHealth/pages/ProjectDetailPage/helpers";
import { useIsTextTruncated } from "@/hooks/useIsTextTruncated";

const ESTIMATED_ROW_HEIGHT = 45;
const COLUMN_COUNT = 6;

const nameSx = {
  display: "block",
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;
const ecoSx = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  color: "var(--muted)",
  background: "var(--s3)",
  px: "7px",
  py: "2px",
  borderRadius: "var(--r-xs)",
} as const;
const chipWrapSx = {
  "& .MuiChip-root": { fontSize: "11px" },
} as const;
const versionWrapSx = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "11px",
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
const noVulnSx = { color: "var(--muted)", fontSize: "11px" } as const;
const rowSx = { "& td": { borderBottom: "1px solid var(--border)" } } as const;
const noResultsSx = {
  padding: "32px",
  textAlign: "center",
  color: "var(--muted)",
  fontSize: "13px",
  borderBottom: "none",
} as const;

const DependencyName: React.FC<{ name: string }> = ({ name }) => {
  const { ref, truncated } = useIsTextTruncated<HTMLSpanElement>();
  return (
    <AppTooltip title={name} disableHoverListener={!truncated}>
      <Box component="span" ref={ref} sx={nameSx}>
        {name}
      </Box>
    </AppTooltip>
  );
};

interface RowProps {
  d: Dependency;
  typeProd: string;
  typeDev: string;
  index: number;
}

const DependencyRow = memo<RowProps>(({ d, typeProd, typeDev, index }) => {
  const s = DEP_STATUS[d.status as DependencyStatus] ?? {
    labelKey: "",
    variant: "gray" as const,
  };
  const t = useT();
  return (
    <Box component="tr" data-index={index} sx={rowSx}>
      <TD>
        <DependencyName name={d.name} />
      </TD>
      <TD>
        <Box component="span" sx={ecoSx}>
          {d.ecosystem}
        </Box>
      </TD>
      <TD>
        <Box sx={chipWrapSx}>
          <StatusChip variant="gray">
            {d.type === "Prod" ? typeProd : typeDev}
          </StatusChip>
        </Box>
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
        <Box sx={chipWrapSx}>
          <StatusChip variant={s.variant}>
            {s.labelKey ? t(s.labelKey) : d.status}
          </StatusChip>
        </Box>
      </TD>
      <TD align="center">
        {d.vulnerabilities.length > 0 ? (
          <Box sx={chipWrapSx}>
            <StatusChip variant="red">{d.vulnerabilities.length}</StatusChip>
          </Box>
        ) : (
          <Box component="span" sx={noVulnSx}>
            —
          </Box>
        )}
      </TD>
    </Box>
  );
});
DependencyRow.displayName = "DependencyRow";

interface Props {
  dependencies: Dependency[];
  filteredDeps: Dependency[];
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

  if (dependencies.length === 0) {
    return (
      <EmptyState
        icon={InventoryOutlined}
        title={t("tech_health.empty.no_deps_title")}
        subtitle={t("tech_health.empty.no_deps_subtitle")}
        iconSize={40}
      />
    );
  }

  const columns: VirtualTableColumn[] = [
    { label: t("tech_health.table.dep.library"), width: "30%" },
    { label: t("tech_health.table.dep.ecosystem"), width: "12%" },
    { label: t("tech_health.table.dep.type"), width: "6%" },
    { label: t("tech_health.table.dep.version"), width: "17%" },
    { label: t("tech_health.table.dep.status"), width: "10%" },
    { label: t("tech_health.table.dep.vulns"), width: "12%", align: "center" },
  ];

  const toolbar = (
    <Box
      sx={{
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
  );

  return (
    <VirtualTable<Dependency>
      rows={filteredDeps}
      getRowId={(d) => d.id}
      columns={columns}
      estimateRowHeight={ESTIMATED_ROW_HEIGHT}
      toolbar={toolbar}
      noResultsContent={
        <Box component="tr">
          <Box component="td" colSpan={COLUMN_COUNT} sx={noResultsSx}>
            {t("tech_health.no_results")}
          </Box>
        </Box>
      }
      renderRow={(d, index) => (
        <DependencyRow
          key={d.id}
          d={d}
          typeProd={typeProd}
          typeDev={typeDev}
          index={index}
        />
      )}
    />
  );
};
