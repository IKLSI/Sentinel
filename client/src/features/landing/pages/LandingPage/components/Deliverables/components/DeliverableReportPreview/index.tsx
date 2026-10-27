import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import { SHOWCASE, SHOWCASE_REPORT_AXES } from "@/features/landing/constants";
import {
  formatShortDate,
  landingGradeColorOf,
} from "@/features/landing/helpers";
import { PREVIEW_CARD_SX } from "@/features/landing/pages/LandingPage/components/Deliverables/constants";

export const DeliverableReportPreview: React.FC = () => {
  const { t, culture } = useI18n();

  return (
    <Box sx={{ ...PREVIEW_CARD_SX, p: "14px 16px" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          pb: "10px",
          mb: "10px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <Box
          component="span"
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            display: "grid",
            placeItems: "center",
            color: "var(--on-dark)",
            fontWeight: 600,
            fontSize: "17px",
            background: landingGradeColorOf(SHOWCASE.stepGrade),
          }}
        >
          {SHOWCASE.stepGrade}
        </Box>
        <Box>
          <Box component="b" sx={{ display: "block", fontSize: "13.5px" }}>
            {t("landing.deliverables.report.title")}
          </Box>
          <Box
            component="span"
            sx={{ fontSize: "12px", color: "var(--ink-3)" }}
          >
            {t("landing.deliverables.report.meta", {
              project: SHOWCASE.customerPortal,
              date: formatShortDate(SHOWCASE.reportDate, culture),
            })}
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: "6px",
          fontSize: "12px",
          color: "var(--ink-2)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {SHOWCASE_REPORT_AXES.map((axis) => (
          <Box
            key={axis.labelKey}
            sx={{
              display: "grid",
              gridTemplateColumns: "64px 1fr 22px",
              gap: "8px",
              alignItems: "center",
            }}
          >
            {t(axis.labelKey)}
            <Box
              component="i"
              sx={{
                height: 5,
                borderRadius: "5px",
                background: "var(--tint)",
                overflow: "hidden",
              }}
            >
              <Box
                component="span"
                sx={{
                  display: "block",
                  height: "100%",
                  width: `${axis.value}%`,
                  borderRadius: "5px",
                  background: "color" in axis ? axis.color : "var(--grade-a)",
                }}
              />
            </Box>
            {axis.value}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
