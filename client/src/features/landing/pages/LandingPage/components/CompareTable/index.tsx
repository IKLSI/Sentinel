import Box from "@mui/material/Box";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
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
          display: { xs: "flex", md: "none" },
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {COMPARE_FEATURES.map((row) => (
          <Box
            key={row.feature}
            sx={{
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              p: "18px",
            }}
          >
            <Box
              sx={{
                fontWeight: 700,
                fontSize: "14.5px",
                color: "var(--text)",
                letterSpacing: "-0.015em",
                mb: "12px",
              }}
            >
              {row.feature}
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                mb: "8px",
                fontSize: "13px",
                color: "var(--muted)",
              }}
            >
              <Box
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--muted)",
                  flexShrink: 0,
                  minWidth: "88px",
                }}
              >
                Autres outils
              </Box>
              <Box>{row.competitor}</Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13.5px",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              <Box
                sx={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text)",
                  fontWeight: 700,
                  flexShrink: 0,
                  minWidth: "88px",
                }}
              >
                Sentinel
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckOutlined sx={{ fontSize: 15, color: "var(--green)" }} />
                {row.sentinel}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: { xs: "none", md: "block" },
          background: "var(--s1)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="table"
            sx={{ width: "100%", minWidth: 620, borderCollapse: "collapse" }}
          >
            <Box component="thead">
              <Box component="tr">
                <Box component="th" sx={{ p: "18px 24px" }} />
                <Box
                  component="th"
                  sx={{
                    p: "18px 24px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-mono)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Outils spécialisés
                </Box>
                <Box
                  component="th"
                  sx={{
                    p: "18px 24px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text)",
                    letterSpacing: "-0.01em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--border2)",
                  }}
                >
                  Sentinel
                </Box>
              </Box>
            </Box>
            <Box component="tbody">
              {COMPARE_FEATURES.map((row) => (
                <Box component="tr" key={row.feature}>
                  <Box
                    component="td"
                    sx={{
                      p: "18px 24px",
                      fontWeight: 600,
                      color: "var(--text)",
                      fontSize: "14.5px",
                      letterSpacing: "-0.015em",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {row.feature}
                  </Box>
                  <Box
                    component="td"
                    sx={{
                      p: "18px 24px",
                      fontSize: "14px",
                      color: "var(--muted)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {row.competitor}
                  </Box>
                  <Box
                    component="td"
                    sx={{
                      p: "18px 24px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--text)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <CheckOutlined
                        sx={{ fontSize: 16, color: "var(--green)" }}
                      />
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
  </Box>
);
