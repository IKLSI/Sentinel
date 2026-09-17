import Box from "@mui/material/Box";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { COMPARE_FEATURES } from "@/features/landing/constants";
import { SectionHeading } from "@/features/landing/pages/LandingPage/components/SectionHeading";

export const CompareTable = () => (
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
      background: "var(--s1)",
      overflow: "hidden",
    }}
  >
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        top: "10%",
        left: "-120px",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, color-mix(in srgb, var(--red) 10%, transparent) 0%, transparent 70%)",
        filter: "blur(20px)",
      }}
    />
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        bottom: "-100px",
        right: "5%",
        width: "460px",
        height: "460px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, color-mix(in srgb, var(--purple) 12%, transparent) 0%, transparent 70%)",
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
        title="Moins d'outils, plus de clarté."
        subtitle="Snyk, Dependabot ou Renovate surveillent chacun un signal isolé. Sentinel les croise pour donner un score de santé unique par projet, sans jongler entre plusieurs outils."
      />

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
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "0.9fr 1fr 1fr" },
          }}
        >
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              p: "18px 26px",
              borderBottom: "1px solid var(--border)",
            }}
          />
          <Box
            sx={{
              p: "18px 26px",
              borderBottom: "1px solid var(--border)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Outils spécialisés
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              p: "18px 26px",
              borderBottom: "2px solid var(--purple)",
              background: "var(--purple-subtle)",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--purple)",
            }}
          >
            Sentinel
          </Box>
        </Box>

        {COMPARE_FEATURES.map((row, index) => (
          <Box
            key={row.feature}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "0.9fr 1fr 1fr" },
              background: index % 2 === 1 ? "var(--s2)" : "transparent",
              "&:not(:last-of-type)": {
                borderBottom: "1px solid var(--border)",
              },
            }}
          >
            <Box
              sx={{
                p: { xs: "18px 20px 6px", md: "20px 26px" },
                display: "flex",
                alignItems: "center",
                fontWeight: 700,
                fontSize: "15px",
                color: "var(--text)",
              }}
            >
              {row.feature}
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                p: { xs: "8px 20px", md: "20px 26px" },
              }}
            >
              <CloseOutlined
                sx={{ fontSize: 15, color: "var(--red)", flexShrink: 0 }}
              />
              <Box
                sx={{
                  fontSize: "13.5px",
                  color: "var(--muted)",
                }}
              >
                {row.competitor}
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                p: { xs: "8px 20px 18px", md: "20px 26px" },
                background: "var(--purple-subtle)",
              }}
            >
              <CheckOutlined
                sx={{ fontSize: 16, color: "var(--purple)", flexShrink: 0 }}
              />
              <Box
                sx={{
                  fontSize: "14px",
                  color: "var(--text)",
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
);
