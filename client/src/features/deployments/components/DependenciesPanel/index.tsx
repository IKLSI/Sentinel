import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import EastOutlined from "@mui/icons-material/EastOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { CardHeader } from "@/components/ui/common/CardHeader";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { NO_VALUE } from "@/constants/display";
import { useT } from "@/contexts/I18nContext";
import type { ReleaseComparison } from "@/domains/deployments/types";
import {
  DEPENDENCY_SECTION_TONES,
  DependencySectionKey,
  PANEL_SX,
} from "@/features/deployments/constants";
import { SectionFilter } from "@/features/deployments/components/SectionFilter";
import { dependencySections } from "@/features/deployments/helpers";
import type { VersionRow } from "@/features/deployments/types";
import { CARD_SX } from "@/helpers/cardSx";

interface Props {
  comparison: ReleaseComparison;
}

const VERSION_SX = {
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
} as const;

const LIST_ROW_SX = {
  display: "grid",
  gridTemplateColumns: "minmax(40%, 1fr) minmax(0, max-content)",
  alignItems: "center",
  columnGap: "10px",
  minHeight: "42px",
  borderBottom: "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
  "&:last-of-type": { borderBottom: "none" },
} as const;

const newVersionTone = (change: VersionRow) => {
  if (change.change === DependencySectionKey.Added) return "var(--green)";
  if (change.isMajor) return "var(--orange)";
  return "var(--text)";
};

const DependencyRow: React.FC<{ change: VersionRow }> = ({ change }) => {
  const t = useT();
  const added = change.change === DependencySectionKey.Added;
  const removed = change.change === DependencySectionKey.Removed;
  const introduced = change.vulnerabilities;

  return (
    <Box component="li" sx={LIST_ROW_SX}>
      <Box
        sx={{
          minWidth: 0,
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: "13px",
            fontWeight: 600,
            color: removed ? "var(--muted2)" : "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {change.name}
        </Box>
        {introduced.length > 0 && (
          <AppTooltip title={introduced.join(", ")}>
            <Box
              component="span"
              tabIndex={0}
              sx={{
                flexShrink: 0,
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--red)",
              }}
            >
              {t("deployments.dependencies.introduced", {
                count: introduced.length,
              })}
            </Box>
          </AppTooltip>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "8px",
          minWidth: 0,
        }}
      >
        {!added && !removed && (
          <>
            <Box component="span" sx={{ ...VERSION_SX, color: "var(--muted)" }}>
              {change.baseVersion ?? NO_VALUE}
            </Box>
            <EastOutlined
              aria-hidden
              sx={{ fontSize: 13, color: "var(--border2)", flexShrink: 0 }}
            />
          </>
        )}
        <Box
          component="span"
          sx={
            removed
              ? {
                  ...VERSION_SX,
                  color: "var(--muted)",
                  textDecoration: "line-through",
                }
              : {
                  ...VERSION_SX,
                  fontWeight: 700,
                  color: newVersionTone(change),
                }
          }
        >
          {removed
            ? (change.baseVersion ?? NO_VALUE)
            : (change.headVersion ?? NO_VALUE)}
        </Box>
      </Box>
    </Box>
  );
};

const RuntimeChanges: React.FC<{ comparison: ReleaseComparison }> = ({
  comparison,
}) => {
  const t = useT();

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "6px 18px",
        px: "16px",
        py: "10px",
        flexShrink: 0,
        borderBottom: "1px solid var(--border)",
        background: "color-mix(in srgb, var(--accent) 4%, transparent)",
      }}
    >
      <Box
        component="span"
        sx={{ typography: "monoCaption", color: "var(--muted2)" }}
      >
        {t("deployments.dependencies.runtimes")}
      </Box>
      {comparison.runtimes.map((runtime) => (
        <Box
          key={runtime.name}
          sx={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Box
            component="span"
            sx={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}
          >
            {runtime.name}
          </Box>
          <Box component="span" sx={{ ...VERSION_SX, color: "var(--muted)" }}>
            {runtime.baseVersion ?? NO_VALUE}
          </Box>
          <EastOutlined
            aria-hidden
            sx={{ fontSize: 13, color: "var(--border2)" }}
          />
          <Box
            component="span"
            sx={{ ...VERSION_SX, fontWeight: 700, color: "var(--accent)" }}
          >
            {runtime.headVersion ?? NO_VALUE}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export const DependenciesPanel: React.FC<Props> = ({ comparison }) => {
  const t = useT();
  const sections = dependencySections(comparison);
  const fixed = comparison.summary.fixedVulnerabilityCount;
  const [selected, setSelected] = useState<string>();
  const active =
    sections.find((section) => section.key === selected) ?? sections[0];

  return (
    <Box component="section" sx={{ ...CARD_SX, ...PANEL_SX }}>
      <CardHeader
        label={t("deployments.dependencies.title")}
        action={
          fixed > 0 && (
            <Box
              component="span"
              sx={{ fontSize: "12px", fontWeight: 600, color: "var(--green)" }}
            >
              {t("deployments.dependencies.fixed_total", { count: fixed })}
            </Box>
          )
        }
      />
      {comparison.runtimes.length > 0 && (
        <RuntimeChanges comparison={comparison} />
      )}
      {!active ? (
        <EmptyState
          icon={Inventory2Outlined}
          title={t("deployments.dependencies.empty_title")}
          subtitle={t("deployments.dependencies.empty_subtitle")}
          sx={{ flex: 1, justifyContent: "center" }}
        />
      ) : (
        <>
          <SectionFilter
            sections={sections.map((section) => ({
              key: section.key,
              tone: DEPENDENCY_SECTION_TONES[section.key],
              label: t(`deployments.dependencies.section.${section.key}`),
              count: section.rows.length,
            }))}
            active={active.key}
            onChange={setSelected}
          />
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              px: "20px",
              py: "8px",
            }}
          >
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
              {active.rows.map((row) => (
                <DependencyRow key={row.id} change={row} />
              ))}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};
