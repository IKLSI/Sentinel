import Box from "@mui/material/Box";
import { ECOSYSTEMS } from "@/features/landing/constants";
import { ECOSYSTEM_LOGOS } from "@/features/landing/ecosystemLogos";
import { SectionHeading } from "@/features/landing/pages/LandingPage/components/SectionHeading";
import { useT } from "@/contexts/I18nContext";

const CHIP_COLORS = [
  "#818cf8",
  "#c084fc",
  "#22d3ee",
  "#4ade80",
  "#fbbf24",
  "#fb923c",
  "#f87171",
  "#38bdf8",
  "#a3e635",
  "#f472b6",
  "#2dd4bf",
  "#facc15",
];

export const EcosystemChips = () => {
  const t = useT();

  return (
    <Box
      component="section"
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
        background: "#f0f9ff",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: "-140px",
          right: "22%",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--blue) 12%, transparent) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          bottom: "-90px",
          left: "-110px",
          width: "440px",
          height: "440px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--yellow) 12%, transparent) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1080,
          mx: "auto",
          px: { xs: "20px", md: "32px" },
        }}
      >
        <SectionHeading
          title={t("landing.ecosystems.title")}
          subtitle={t("landing.ecosystems.subtitle")}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(3, 1fr)",
              sm: "repeat(4, 1fr)",
              md: "repeat(6, 1fr)",
            },
            rowGap: { xs: "36px", md: "52px" },
            columnGap: { xs: "16px", md: "24px" },
          }}
        >
          {ECOSYSTEMS.map((eco, index) => {
            const color = CHIP_COLORS[index % CHIP_COLORS.length];
            return (
              <Box
                key={eco}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <Box
                  sx={{
                    width: { xs: 56, md: 72 },
                    height: { xs: 56, md: 72 },
                    flexShrink: 0,
                    borderRadius: { xs: "16px", md: "20px" },
                    background: `linear-gradient(160deg, ${color} 0%, color-mix(in srgb, ${color} 65%, black) 100%)`,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 16px 28px -12px color-mix(in srgb, ${color} 70%, transparent)`,
                  }}
                >
                  <Box
                    component="svg"
                    viewBox="0 0 24 24"
                    sx={{
                      width: { xs: 26, md: 34 },
                      height: { xs: 26, md: 34 },
                    }}
                  >
                    <path d={ECOSYSTEM_LOGOS[eco]} fill="currentColor" />
                  </Box>
                </Box>
                <Box
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "13px", md: "15px" },
                    color: "var(--text)",
                    letterSpacing: "-0.01em",
                    textAlign: "center",
                  }}
                >
                  {eco}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
