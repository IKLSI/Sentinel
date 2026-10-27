import type React from "react";
import Box from "@mui/material/Box";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";
import { useT } from "@/contexts/I18nContext";
import type { TypeStep } from "@/features/styleGuide/pages/StyleGuidePage/components/TypographySection/constants";

export const TypeScaleRow: React.FC<{ step: TypeStep }> = ({ step }) => {
  const t = useT();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "80px 240px minmax(0, 1fr)",
        },
        alignItems: "baseline",
        gap: { xs: "4px", sm: "16px" },
        py: "10px",
        "& + &": { borderTop: "1px solid var(--border)" },
      }}
    >
      <Box
        sx={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--text)",
        }}
      >
        {step.size} / {step.weight}
      </Box>
      <Box sx={{ fontSize: "12px", color: "var(--muted2)" }}>
        {t(step.roleKey)}
      </Box>
      <Box
        sx={{
          minWidth: 0,
          fontSize: `${step.size}px`,
          fontWeight: step.weight,
          fontFamily: step.mono ? "var(--font-mono)" : undefined,
          lineHeight: 1.3,
          letterSpacing: step.size >= 20 ? "-0.02em" : undefined,
          color: step.size <= 12 ? "var(--text-secondary)" : "var(--text)",
          ...TEXT_ELLIPSIS_SX,
        }}
      >
        {t(step.exampleKey)}
      </Box>
    </Box>
  );
};
