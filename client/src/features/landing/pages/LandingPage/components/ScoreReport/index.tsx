import type React from "react";
import { useId, useRef, useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Skeleton from "@mui/material/Skeleton";
import { useT } from "@/contexts/I18nContext";
import { useScoringModelQuery } from "@/domains/publicScan/queries";
import { LANDING_SECTION_IDS } from "@/features/landing/constants";
import { landingGradeColorOf } from "@/features/landing/helpers";
import { LandingSection } from "@/features/landing/pages/LandingPage/components/LandingSection";
import { ScoreLines } from "@/features/landing/pages/LandingPage/components/ScoreLines";
import { ScoreSummary } from "@/features/landing/pages/LandingPage/components/ScoreSummary";
import { SectionIntro } from "@/features/landing/pages/LandingPage/components/SectionIntro";

const TITLE_ID = "landing-score-title";

const cardSx = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "1fr",
  background: "#ffffff",
  borderRadius: "28px",
  boxShadow: "0 0 0 1px var(--line), 0 40px 80px -50px rgba(16,17,36,.35)",
  overflow: "hidden",
  "@media (min-width:860px)": { gridTemplateColumns: "320px 1fr" },
} as const;

export const ScoreReport: React.FC = () => {
  const t = useT();
  const { data, isPending, isError } = useScoringModelQuery();
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelId = useId();
  const examples = data?.examples ?? [];
  const example = examples[Math.min(selected, examples.length - 1)];

  const onTabKeyDown = (event: React.KeyboardEvent) => {
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const next = (selected + offset + examples.length) % examples.length;
    setSelected(next);
    tabRefs.current[next]?.focus();
  };

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
            <Box
              role="tablist"
              aria-label={t("landing.score.tabs_label")}
              sx={{
                display: "flex",
                gap: "4px",
                maxWidth: "100%",
                overflowX: "auto",
                scrollbarWidth: "none",
                p: "4px",
                borderRadius: "999px",
                background: "var(--tint)",
              }}
            >
              {examples.map((item, index) => {
                const isSelected = item === example;
                return (
                  <ButtonBase
                    type="button"
                    role="tab"
                    key={item.name}
                    ref={(element: HTMLButtonElement | null) => {
                      tabRefs.current[index] = element;
                    }}
                    aria-selected={isSelected}
                    aria-controls={panelId}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setSelected(index)}
                    onKeyDown={onTabKeyDown}
                    sx={{
                      flex: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      px: "14px",
                      py: "8px",
                      border: 0,
                      borderRadius: "999px",
                      cursor: "pointer",
                      font: "inherit",
                      textAlign: "inherit",
                      fontSize: "14px",
                      fontWeight: isSelected ? 500 : 400,
                      color: isSelected ? "var(--ink)" : "var(--ink-2)",
                      background: isSelected ? "#ffffff" : "transparent",
                      boxShadow: isSelected
                        ? "0 1px 3px rgba(16,17,36,.08)"
                        : "none",
                      "&:hover": { color: "var(--ink)" },
                      "&:focus-visible": {
                        outline: "2px solid var(--indigo)",
                        outlineOffset: "-2px",
                      },
                    }}
                  >
                    <Box
                      component="span"
                      aria-hidden
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: landingGradeColorOf(item.grade),
                      }}
                    />
                    {item.name}
                  </ButtonBase>
                );
              })}
            </Box>
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
