import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import TaskAltOutlined from "@mui/icons-material/TaskAltOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { CardHeader } from "@/components/ui/common/CardHeader";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { useT } from "@/contexts/I18nContext";
import type { ReleaseComparison } from "@/domains/deployments/types";
import { SectionFilter } from "@/features/deployments/components/SectionFilter";
import {
  CHECK_SEVERITY_TONES,
  PANEL_SX,
} from "@/features/deployments/constants";
import {
  releaseCheckGroups,
  releaseDataGaps,
} from "@/features/deployments/helpers";
import type { ReleaseCheckBlock } from "@/features/deployments/types";
import { CARD_SX } from "@/helpers/cardSx";

interface Props {
  comparison: ReleaseComparison;
}

const ELLIPSIS_SX = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

const CheckBlock: React.FC<{ block: ReleaseCheckBlock; tone: string }> = ({
  block,
  tone,
}) => (
  <Box
    component="li"
    sx={{
      py: "10px",
      borderBottom:
        "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
      "&:last-of-type": { borderBottom: "none" },
    }}
  >
    <AppTooltip title={block.hint} placement="top-start">
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "10px",
          minWidth: 0,
        }}
      >
        <Box
          component="span"
          sx={{
            ...ELLIPSIS_SX,
            minWidth: 0,
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          {block.heading}
        </Box>
        {block.entries.length > 0 && (
          <Box
            component="span"
            sx={{
              flexShrink: 0,
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 700,
              color: tone,
            }}
          >
            {block.entries.length}
          </Box>
        )}
      </Box>
    </AppTooltip>
    {block.entries.length > 0 && (
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          mt: "6px",
          ml: "2px",
          pl: "12px",
          borderLeft: `2px solid color-mix(in srgb, ${tone} 30%, transparent)`,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {block.entries.map((entry) => (
          <Box
            component="li"
            key={entry.id}
            sx={{
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
              minWidth: 0,
            }}
          >
            <Box
              component="span"
              sx={{
                ...ELLIPSIS_SX,
                minWidth: 0,
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--text)",
              }}
            >
              {entry.text}
            </Box>
            {entry.note && (
              <Box
                component="span"
                sx={{
                  ...ELLIPSIS_SX,
                  flexShrink: 0,
                  maxWidth: "45%",
                  fontSize: "11px",
                  color: "var(--muted2)",
                }}
              >
                {entry.note}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    )}
  </Box>
);

const DataGapsNote: React.FC<{ gaps: string[] }> = ({ gaps }) => {
  const t = useT();

  return (
    <AppTooltip
      title={gaps
        .map((gap) => t(`deployments.checks.gap.${gap}.detail`))
        .join(" ")}
    >
      <Box
        tabIndex={0}
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          px: "16px",
          py: "8px",
          borderTop: "1px solid var(--border)",
          fontSize: "12px",
          color: "var(--muted)",
        }}
      >
        <InfoOutlined sx={{ fontSize: 14 }} />
        {gaps
          .map((gap) => t(`deployments.checks.gap.${gap}.title`))
          .join(" · ")}
      </Box>
    </AppTooltip>
  );
};

export const ReleaseChecksPanel: React.FC<Props> = ({ comparison }) => {
  const t = useT();
  const groups = releaseCheckGroups(comparison, t);
  const gaps = releaseDataGaps(comparison);
  const [selected, setSelected] = useState<string>();
  const active = groups.find((group) => group.kind === selected) ?? groups[0];

  return (
    <Box component="section" sx={{ ...CARD_SX, ...PANEL_SX }}>
      <CardHeader label={t("deployments.checks.title")} />
      {!active ? (
        <EmptyState
          icon={TaskAltOutlined}
          tone="success"
          title={t("deployments.checks.empty_title")}
          subtitle={t("deployments.checks.empty_subtitle")}
          sx={{ flex: 1, justifyContent: "center" }}
        />
      ) : (
        <>
          <SectionFilter
            sections={groups.map((group) => ({
              key: group.kind,
              tone: CHECK_SEVERITY_TONES[group.severity],
              label: t(`deployments.checks.kind.${group.kind}`),
              count: group.count,
            }))}
            active={active.kind}
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
              {active.blocks.map((block) => (
                <CheckBlock
                  key={block.id}
                  block={block}
                  tone={CHECK_SEVERITY_TONES[active.severity]}
                />
              ))}
            </Box>
          </Box>
        </>
      )}
      {gaps.length > 0 && <DataGapsNote gaps={gaps} />}
    </Box>
  );
};
