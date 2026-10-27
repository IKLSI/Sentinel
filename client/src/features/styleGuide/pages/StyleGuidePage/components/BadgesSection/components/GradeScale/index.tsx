import type React from "react";
import Box from "@mui/material/Box";
import { GradeRing } from "@/components/ui/common/GradeRing";
import { NO_GRADE_TONE, gradeToneOf } from "@/constants/grades";
import { useT } from "@/contexts/I18nContext";
import { HealthGrade } from "@/enums";
import {
  GRADE_LABEL_SX,
  GRADE_RING_SIZE,
  NO_GRADE_SYMBOL,
  SAMPLE_GRADE_SCORES,
} from "@/features/styleGuide/pages/StyleGuidePage/components/BadgesSection/constants";

const CAPTION_SX = {
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--text-secondary)",
  textAlign: "center",
  whiteSpace: "nowrap",
} as const;

const ITEM_SX = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  minWidth: "64px",
} as const;

export const GradeScale: React.FC = () => {
  const t = useT();

  return (
    <Box
      component="ul"
      sx={{
        m: 0,
        p: 0,
        listStyle: "none",
        display: "flex",
        flexWrap: "wrap",
        gap: "20px 24px",
      }}
    >
      {Object.values(HealthGrade).map((grade) => {
        const tone = gradeToneOf(grade) ?? NO_GRADE_TONE;

        return (
          <Box component="li" key={grade} sx={ITEM_SX}>
            <GradeRing
              size={GRADE_RING_SIZE}
              value={SAMPLE_GRADE_SCORES[grade]}
              color={tone.color}
              labelSx={GRADE_LABEL_SX}
            >
              {grade}
            </GradeRing>
            <Box sx={CAPTION_SX}>{t(`projects.grade.${grade}.label`)}</Box>
          </Box>
        );
      })}
      <Box component="li" sx={ITEM_SX}>
        <GradeRing
          size={GRADE_RING_SIZE}
          value={null}
          showTrack={false}
          color={NO_GRADE_TONE.color}
          labelSx={GRADE_LABEL_SX}
        >
          {NO_GRADE_SYMBOL}
        </GradeRing>
        <Box sx={CAPTION_SX}>{t("projects.grade.NONE.label")}</Box>
      </Box>
    </Box>
  );
};
