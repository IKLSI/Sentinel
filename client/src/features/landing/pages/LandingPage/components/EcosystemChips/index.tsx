import Box from "@mui/material/Box";
import { ECOSYSTEMS } from "@/features/landing/constants";
import { ECOSYSTEM_LOGOS } from "@/features/landing/ecosystemLogos";
import { SectionHeading } from "@/features/landing/pages/LandingPage/components/SectionHeading";

const CHIP_COLORS = [
  "var(--blue)",
  "var(--purple)",
  "var(--cyan)",
  "var(--green)",
  "var(--yellow)",
  "var(--orange)",
];

export const EcosystemChips = () => {
  return (
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
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Box sx={{ maxWidth: 1080, mx: "auto", px: { xs: "20px", md: "32px" } }}>
        <SectionHeading
          title="Aucun langage oublié."
          subtitle="12 écosystèmes majeurs reconnus dès la première connexion, quel que soit le langage utilisé par vos équipes ou l'âge de vos projets."
          accent="var(--cyan)"
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
