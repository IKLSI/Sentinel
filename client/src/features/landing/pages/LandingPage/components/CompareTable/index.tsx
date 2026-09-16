import Box from "@mui/material/Box";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { COMPARE_FEATURES } from "@/features/landing/constants";
import { SectionHeading } from "@/features/landing/pages/LandingPage/components/SectionHeading";

export const CompareTable = () => (
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
      background: "var(--s1)",
    }}
  >
    <Box sx={{ maxWidth: 1160, mx: "auto", px: { xs: "20px", md: "32px" } }}>
      <SectionHeading
        title="Moins d'outils, plus de clarté."
        subtitle="Snyk, Dependabot ou Renovate surveillent chacun un signal isolé. Sentinel les croise pour donner un score de santé unique par projet, sans jongler entre plusieurs outils."
        accent="var(--purple)"
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: { xs: "20px", md: "28px" },
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            border: "1px solid var(--border)",
            borderRadius: "20px",
            overflow: "hidden",
            background: "var(--s1)",
            boxShadow: "var(--sh-2)",
          }}
        >
          <Box
            sx={{
              p: "16px 22px",
              borderBottom: "1px solid var(--border)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Outils spécialisés
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {COMPARE_FEATURES.map((row) => (
              <Box
                key={row.feature}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  p: "13px 22px",
                  borderBottom: "1px solid var(--border)",
                  "&:last-of-type": { borderBottom: "none" },
                }}
              >
                <Box
                  sx={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "var(--red)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CloseOutlined sx={{ fontSize: 11, color: "#fff" }} />
                </Box>
                <Box>
                  <Box
                    sx={{
                      fontWeight: 600,
                      fontSize: "13.5px",
                      color: "#71717a",
                    }}
                  >
                    {row.feature}
                  </Box>
                  <Box sx={{ fontSize: "13px", color: "var(--muted)" }}>
                    {row.competitor}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            border: "1px solid var(--purple)",
            borderRadius: "20px",
            overflow: "hidden",
            background: "var(--s1)",
            boxShadow: `0 20px 48px -20px color-mix(in srgb, var(--purple) 45%, transparent)`,
          }}
        >
          <Box
            sx={{
              p: "16px 22px",
              background: "var(--purple)",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#fff",
            }}
          >
            Sentinel
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {COMPARE_FEATURES.map((row) => (
              <Box
                key={row.feature}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  p: "13px 22px",
                  borderBottom: "1px solid var(--border)",
                  "&:last-of-type": { borderBottom: "none" },
                }}
              >
                <Box
                  sx={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "var(--purple)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CheckOutlined sx={{ fontSize: 11, color: "#fff" }} />
                </Box>
                <Box>
                  <Box
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "var(--text)",
                    }}
                  >
                    {row.feature}
                  </Box>
                  <Box
                    sx={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {row.sentinel}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
);
