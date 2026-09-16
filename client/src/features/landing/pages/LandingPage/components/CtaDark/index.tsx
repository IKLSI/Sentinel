import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import { ROUTES } from "@/constants/routes";
import { GRADES } from "@/features/landing/constants";

export const CtaDark = () => (
  <Box
    component="section"
    sx={{
      minHeight: "100dvh",
      scrollMarginTop: "88px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      py: { xs: "64px", md: "96px" },
      px: { xs: "16px", md: "32px" },
    }}
  >
    <Box
      sx={{
        position: "relative",
        maxWidth: 1160,
        mx: "auto",
        width: "100%",
        overflow: "hidden",
        background: "linear-gradient(180deg, var(--s1) 0%, var(--s2) 100%)",
        border: "1px solid var(--border)",
        boxShadow: "var(--sh-3)",
        borderRadius: "32px",
        p: { xs: "56px 24px", md: "96px 40px" },
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 640px 320px at 50% 0%, var(--accent-subtle) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: { xs: "10px", md: "14px" },
          mb: "40px",
        }}
      >
        {GRADES.map((grade, index) => {
          const distanceFromCenter = Math.abs(index - (GRADES.length - 1) / 2);
          const size = 60 - distanceFromCenter * 6;
          return (
            <Box
              key={grade.letter}
              sx={{
                width: size,
                height: size,
                borderRadius: "16px",
                background: `linear-gradient(160deg, ${grade.color} 0%, color-mix(in srgb, ${grade.color} 70%, black) 100%)`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: `${16 + (size - 44) * 0.28}px`,
                flexShrink: 0,
                boxShadow: `0 12px 24px -8px color-mix(in srgb, ${grade.color} 65%, transparent)`,
              }}
            >
              {grade.letter}
            </Box>
          );
        })}
      </Box>

      <Box
        component="h2"
        sx={{
          position: "relative",
          m: 0,
          fontSize: { xs: "40px", md: "72px" },
          fontWeight: 900,
          letterSpacing: "-0.045em",
          lineHeight: 0.98,
          mb: "20px",
          color: "var(--text)",
        }}
      >
        Votre note tient en une lettre.
      </Box>
      <Box
        component="p"
        sx={{
          position: "relative",
          m: "0 auto 40px",
          maxWidth: 460,
          fontSize: "16.5px",
          color: "var(--text-secondary)",
          lineHeight: 1.55,
        }}
      >
        Connectez un dépôt et découvrez la santé réelle de votre stack en
        quelques minutes.
      </Box>

      <Button
        component={Link}
        to={ROUTES.LOGIN}
        variant="contained"
        size="large"
        endIcon={<ArrowForwardOutlined sx={{ fontSize: 18 }} />}
        sx={{
          position: "relative",
          px: "32px",
          py: "14px",
          fontSize: "15px",
          borderRadius: "var(--r-lg)",
          boxShadow: "0 12px 32px -8px var(--accent-border)",
        }}
      >
        Scanner mon premier projet
      </Button>
    </Box>
  </Box>
);
