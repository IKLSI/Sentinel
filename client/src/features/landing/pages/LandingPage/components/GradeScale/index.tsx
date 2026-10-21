import Box from "@mui/material/Box";
import { MAX_HEALTH_SCORE } from "@/features/landing/constants";
import {
  formatGradeThreshold,
  formatPenalty,
  gradeColorOf,
} from "@/features/landing/helpers";
import { useScoringModelQuery } from "@/domains/publicScan/queries";
import { SectionHeading } from "@/features/landing/pages/LandingPage/components/SectionHeading";
import { useT } from "@/contexts/I18nContext";

export const GradeScale = () => {
  const t = useT();
  const { data: scoringModel } = useScoringModelQuery();
  const grades = scoringModel?.grades ?? [];
  const penalties = scoringModel?.penalties ?? [];

  return (
    <Box
      component="section"
      id="fonctionnalites"
      sx={{
        position: "relative",
        minHeight: "100dvh",
        scrollMarginTop: "88px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: { xs: "64px", md: "96px" },
        borderBottom: "1px solid var(--border)",
        background:
          "radial-gradient(120% 60% at 88% 20%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 60%), var(--s1)",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: "-90px",
          left: "18%",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--green) 12%, transparent) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1160,
          mx: "auto",
          px: { xs: "20px", md: "32px" },
        }}
      >
        <SectionHeading
          title={t("landing.grades.title")}
          subtitle={t("landing.grades.subtitle")}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: "18px",
          }}
        >
          {grades.map((grade, index) => (
            <Box
              key={grade.grade}
              sx={{
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                p: "24px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  flexShrink: 0,
                  borderRadius: "16px",
                  background: gradeColorOf(grade.grade),
                  color: "var(--bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "30px",
                  fontWeight: 800,
                  boxShadow: `0 10px 20px -8px color-mix(in srgb, ${gradeColorOf(grade.grade)} 70%, transparent)`,
                }}
              >
                {grade.grade}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    mb: "4px",
                  }}
                >
                  <Box
                    sx={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {t(`landing.grades.${grade.grade.toLowerCase()}.label`)}
                  </Box>
                  <Box
                    sx={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: gradeColorOf(grade.grade),
                      background: `color-mix(in srgb, ${gradeColorOf(grade.grade)} 14%, var(--s1))`,
                      borderRadius: "999px",
                      px: "9px",
                      py: "3px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatGradeThreshold(grades, index)}
                  </Box>
                </Box>
                <Box
                  sx={{
                    fontSize: "12.5px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.45,
                  }}
                >
                  {t(`landing.grades.${grade.grade.toLowerCase()}.desc`)}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            maxWidth: 820,
            mx: "auto",
            mt: "72px",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: "12px",
          }}
        >
          <Box
            sx={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: "22px 26px",
              borderRadius: "14px",
              background: "var(--s2)",
              border: "1px solid var(--border)",
            }}
          >
            <Box>
              <Box
                sx={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}
              >
                {t("landing.ledger.title")}
              </Box>
              <Box
                sx={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.45,
                  mt: "4px",
                }}
              >
                {t("landing.ledger.subtitle")}
              </Box>
            </Box>
            <Box
              sx={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text)",
                ml: "16px",
              }}
            >
              {MAX_HEALTH_SCORE}
            </Box>
          </Box>

          {penalties.map((penalty) => (
            <Box
              key={penalty.kind}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: "16px 22px",
                borderRadius: "14px",
                background: "var(--s1)",
                border: "1px solid var(--border)",
                fontSize: "14.5px",
              }}
            >
              <Box sx={{ color: "var(--text-secondary)" }}>
                {t(`landing.ledger.${penalty.kind}`)}
              </Box>
              <Box
                sx={{
                  fontWeight: 700,
                  color: "var(--red)",
                  ml: "16px",
                  flexShrink: 0,
                }}
              >
                {formatPenalty(penalty.points)}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
