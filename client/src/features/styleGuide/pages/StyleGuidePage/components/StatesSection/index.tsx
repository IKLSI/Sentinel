import type React from "react";
import Box from "@mui/material/Box";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { useT } from "@/contexts/I18nContext";
import { Specimen } from "@/features/styleGuide/pages/StyleGuidePage/components/Specimen";
import { LoadingDemo } from "@/features/styleGuide/pages/StyleGuidePage/components/StatesSection/components/LoadingDemo";
import { RetryDemo } from "@/features/styleGuide/pages/StyleGuidePage/components/StatesSection/components/RetryDemo";
import { ScanProgressDemo } from "@/features/styleGuide/pages/StyleGuidePage/components/StatesSection/components/ScanProgressDemo";
import {
  EMPTY_TICKETS,
  TONE_SAMPLES,
  TWO_COLUMNS_SX,
  WRITING_RULES,
} from "@/features/styleGuide/pages/StyleGuidePage/components/StatesSection/constants";
import { UsageRules } from "@/features/styleGuide/pages/StyleGuidePage/components/UsageRules";
import { PANEL_SX } from "@/helpers/cardSx";

const CAPTION_SX = {
  px: "12px",
  py: "8px",
  borderBottom: "1px solid var(--border)",
  fontSize: "12px",
  color: "var(--muted2)",
} as const;

export const StatesSection: React.FC = () => {
  const t = useT();

  return (
    <>
      <Specimen
        title={t("style_guide.empty_states.title")}
        note={t("style_guide.empty_states.note")}
        source="components/ui/common/feedback/EmptyState.tsx"
      >
        <Box sx={TWO_COLUMNS_SX}>
          <EmptyState
            icon={EMPTY_TICKETS.icon}
            title={t(EMPTY_TICKETS.titleKey)}
            subtitle={t(EMPTY_TICKETS.subtitleKey)}
            sx={PANEL_SX}
          />
          <EmptyState
            icon={SearchOutlined}
            title={t("common.no_results")}
            subtitle={t("tickets.list.empty_subtitle_search")}
            sx={PANEL_SX}
          />
        </Box>
        <Box
          sx={{
            mt: "16px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {TONE_SAMPLES.map(
            ({ tone, icon, titleKey, subtitleKey, captionKey }) => (
              <Box key={tone} sx={{ ...PANEL_SX, overflow: "hidden" }}>
                <Box sx={CAPTION_SX}>{t(captionKey)}</Box>
                <EmptyState
                  icon={icon}
                  tone={tone}
                  size="compact"
                  title={t(titleKey)}
                  subtitle={t(subtitleKey)}
                />
              </Box>
            ),
          )}
        </Box>
      </Specimen>

      <Box sx={TWO_COLUMNS_SX}>
        <Specimen
          title={t("style_guide.loading.title")}
          note={t("style_guide.loading.note")}
        >
          <Box sx={{ display: "grid", gap: "12px" }}>
            <LoadingDemo />
            <ScanProgressDemo />
          </Box>
        </Specimen>
        <Specimen
          title={t("style_guide.errors.load")}
          note={t("style_guide.errors.load_note")}
          canvasSx={{ display: "flex", flexDirection: "column" }}
        >
          <RetryDemo />
        </Specimen>
      </Box>

      <UsageRules
        title={t("style_guide.states.rules_title")}
        rules={WRITING_RULES}
      />
    </>
  );
};
