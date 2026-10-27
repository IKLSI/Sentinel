import type React from "react";
import Box from "@mui/material/Box";
import { typographyVariants } from "@/configs/themes/typography";
import type { ThemeVariantName } from "@/features/styleGuide/pages/StyleGuidePage/components/TypographySection/constants";

interface Props {
  name: ThemeVariantName;
  example: string;
}

export const VariantRow: React.FC<Props> = ({ name, example }) => {
  const variant: React.CSSProperties = typographyVariants[name];
  const specs = [
    variant.fontFamily ? "mono" : "ui",
    variant.fontSize,
    variant.fontWeight,
    variant.letterSpacing,
  ].filter(Boolean);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "200px 200px minmax(0, 1fr)",
        },
        alignItems: "baseline",
        gap: { xs: "4px", sm: "16px" },
        py: "10px",
        "& + &": { borderTop: "1px solid var(--border)" },
      }}
    >
      <Box
        component="code"
        sx={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--text)",
        }}
      >
        {`typography: "${name}"`}
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: "12px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--muted2)",
        }}
      >
        {specs.map((spec) => (
          <span key={String(spec)}>{spec}</span>
        ))}
      </Box>
      <Box sx={{ typography: name, color: "var(--text-secondary)" }}>
        {example}
      </Box>
    </Box>
  );
};
