import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { SHOWCASE, STEP_CHIP_SX } from "@/features/landing/constants";
import { landingGradeColorOf } from "@/features/landing/helpers";

export const StepResult: React.FC = () => {
  const t = useT();
  const chips = [
    {
      color: "#4f46e5",
      label: t("landing.steps.ticket_created", {
        reference: SHOWCASE.stepTicket,
      }),
    },
    { color: "#16a34a", label: t("landing.steps.alert_sent") },
  ];

  return (
    <>
      <Box
        sx={{
          ...STEP_CHIP_SX,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderRadius: "14px",
          p: "12px 18px 12px 12px",
          textAlign: "left",
        }}
      >
        <Box
          component="span"
          sx={{
            width: 44,
            height: 52,
            borderRadius: "12px",
            background: landingGradeColorOf(SHOWCASE.stepGrade),
            color: "#ffffff",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "26px",
          }}
        >
          {SHOWCASE.stepGrade}
        </Box>
        <Box>
          <Box component="b" sx={{ display: "block", fontSize: "14px" }}>
            {SHOWCASE.customerPortal}
          </Box>
          <Box
            component="small"
            sx={{ fontSize: "12.5px", color: "var(--ink-3)" }}
          >
            {SHOWCASE.stepScore} {t("landing.score.out_of_100")}
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        {chips.map(({ color, label }) => (
          <Box
            component="span"
            key={label}
            sx={{
              ...STEP_CHIP_SX,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "999px",
              px: "11px",
              py: "5px",
              fontSize: "12px",
            }}
          >
            <Box
              component="i"
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: color,
              }}
            />
            {label}
          </Box>
        ))}
      </Box>
    </>
  );
};
