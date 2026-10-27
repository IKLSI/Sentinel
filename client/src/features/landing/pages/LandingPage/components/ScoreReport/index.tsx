import type React from "react";
import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { useT } from "@/contexts/I18nContext";
import { useScoringModelQuery } from "@/domains/publicScan/queries";
import { LANDING_SECTION_IDS } from "@/features/landing/constants";
import { LandingSection } from "@/features/landing/pages/LandingPage/components/LandingSection";
import { ScoreExampleTabs } from "@/features/landing/pages/LandingPage/components/ScoreReport/components/ScoreExampleTabs";
import { ScoreLines } from "@/features/landing/pages/LandingPage/components/ScoreReport/components/ScoreLines";
import { ScoreSummary } from "@/features/landing/pages/LandingPage/components/ScoreReport/components/ScoreSummary";
import { SectionIntro } from "@/features/landing/pages/LandingPage/components/SectionIntro";

const TITLE_ID = "landing-score-title";

const cardSx = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "1fr",
  background: "var(--page)",
  borderRadius: "28px",
  boxShadow:
    "0 0 0 1px var(--line), 0 40px 80px -50px color-mix(in srgb, var(--ink) 35%, transparent)",
  overflow: "hidden",
  "@media (min-width:860px)": { gridTemplateColumns: "320px 1fr" },
} as const;

export const ScoreReport: React.FC = () => {
  const t = useT();
  const { data, isPending, isError } = useScoringModelQuery();
  const [selected, setSelected] = useState(0);
  const panelId = useId();
  const examples = data?.examples ?? [];
  const example = examples[Math.min(selected, examples.length - 1)];

  return (
    <LandingSection id={LANDING_SECTION_IDS.score} labelledBy={TITLE_ID}>
      <SectionIntro
        titleId={TITLE_ID}
        title={t("landing.score.title")}
        description={t("landing.score.subtitle")}
        spacing="36px"
      />
      <Box
        sx={{
          maxWidth: 1000,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {isPending && (
          <>
            <Skeleton
              variant="rounded"
              width={420}
              height={44}
              sx={{ maxWidth: "100%", borderRadius: "999px" }}
            />
            <Skeleton
              variant="rounded"
              width="100%"
              height={420}
              sx={{ borderRadius: "28px" }}
            />
          </>
        )}
        {(isError || (!isPending && !example)) && (
          <Box component="p" sx={{ m: 0, color: "var(--ink-3)" }}>
            {t("landing.score.unavailable")}
          </Box>
        )}
        {example && data && (
          <>
            <ScoreExampleTabs
              examples={examples}
              selected={selected}
              selectedExample={example}
              onSelect={setSelected}
              panelId={panelId}
            />
            <Box
              id={panelId}
              role="tabpanel"
              aria-label={example.name}
              sx={cardSx}
            >
              <ScoreSummary example={example} grades={data.grades} />
              <ScoreLines
                example={example}
                maxScore={data.maxScore}
                decayConstant={data.scoreDecayConstant}
              />
            </Box>
          </>
        )}
      </Box>
    </LandingSection>
  );
};
