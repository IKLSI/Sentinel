import type React from "react";
import Box from "@mui/material/Box";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import TaskAltOutlined from "@mui/icons-material/TaskAltOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { CardHeader } from "@/components/ui/common/CardHeader";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { useT } from "@/contexts/I18nContext";
import type { ReleaseComparison } from "@/domains/deployments/types";
import {
  CHECK_SEVERITY_TONES,
  PANEL_SX,
} from "@/features/deployments/constants";
import {
  releaseCheckSteps,
  releaseDataGaps,
} from "@/features/deployments/helpers";
import type {
  ReleaseCheckBlock,
  ReleaseCheckStep,
} from "@/features/deployments/types";
import { CARD_SX } from "@/helpers/cardSx";

interface Props {
  comparison: ReleaseComparison;
}

const ELLIPSIS_SX = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

const CheckBlock: React.FC<{ block: ReleaseCheckBlock }> = ({ block }) => (
  <Box
    component="li"
    sx={{
      py: "8px",
      borderBottom:
        "1px solid color-mix(in srgb, var(--border) 60%, transparent)",
      "&:last-of-type": { borderBottom: "none" },
    }}
  >
    <AppTooltip title={block.hint} placement="top-start">
      <Box
        component="span"
        sx={{
          ...ELLIPSIS_SX,
          display: "block",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text)",
        }}
      >
        {block.heading}
      </Box>
    </AppTooltip>
    {block.entries.length > 0 && (
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          mt: "4px",
          p: 0,
          display: "flex",
          flexDirection: "column",
          gap: "2px",
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
                color: "var(--muted2)",
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
                  color: "var(--muted)",
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

const CheckStep: React.FC<{ step: ReleaseCheckStep; last: boolean }> = ({
  step,
  last,
}) => {
  const t = useT();
  const tone = CHECK_SEVERITY_TONES[step.severity];

  return (
    <Box component="li" sx={{ display: "flex", gap: "14px" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 700,
            color: tone,
            background: `color-mix(in srgb, ${tone} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${tone} 40%, transparent)`,
          }}
        >
          {step.index}
        </Box>
        <Box
          sx={{
            flex: 1,
            width: "1px",
            mt: "4px",
            mb: last ? 0 : "4px",
            background: "var(--border)",
          }}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, pb: last ? 0 : "18px" }}>
        <Box sx={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
          {t(`deployments.checks.step.${step.id}`)}
        </Box>
        <Box sx={{ fontSize: "12px", color: tone, mb: "4px" }}>
          {step.summary}
        </Box>
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {step.blocks.map((block) => (
            <CheckBlock key={block.id} block={block} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

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
  const steps = releaseCheckSteps(comparison, t);
  const gaps = releaseDataGaps(comparison);

  return (
    <Box component="section" sx={{ ...CARD_SX, ...PANEL_SX }}>
      <CardHeader label={t("deployments.checks.title")} />
      {steps.length === 0 ? (
        <EmptyState
          icon={TaskAltOutlined}
          title={t("deployments.checks.empty_title")}
          subtitle={t("deployments.checks.empty_subtitle")}
          sx={{ flex: 1, justifyContent: "center" }}
        />
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: "20px",
            py: "16px",
          }}
        >
          <Box
            component="ol"
            sx={{
              listStyle: "none",
              m: 0,
              p: 0,
            }}
          >
            {steps.map((step, position) => (
              <CheckStep
                key={step.id}
                step={step}
                last={position === steps.length - 1}
              />
            ))}
          </Box>
        </Box>
      )}
      {gaps.length > 0 && <DataGapsNote gaps={gaps} />}
    </Box>
  );
};
