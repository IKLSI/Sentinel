import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import TrendingUpOutlined from "@mui/icons-material/TrendingUpOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import { useT } from "@/contexts/I18nContext";

const DASHBOARD_PREVIEW = {
  src: "/landing/dashboard-preview.png",
  width: 2000,
  height: 1148,
} as const;

const fadeUp = {
  "@keyframes heroFadeUp": {
    from: { opacity: 0, transform: "translateY(16px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
};

export const Hero = () => {
  const t = useT();

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        minHeight: "calc(100dvh - 88px)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: { xs: "48px", md: "88px" },
        borderBottom: "1px solid var(--border)",
        background: "#eef2ff",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: "20px",
          left: "-80px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--accent) 14%, transparent) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          bottom: "-160px",
          right: "-100px",
          width: "440px",
          height: "440px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--purple) 26%, transparent) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 1240,
          mx: "auto",
          px: { xs: "20px", md: "32px" },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1.15fr" },
          gap: { xs: "40px", md: "72px" },
          alignItems: "center",
        }}
      >
        <Box sx={{ maxWidth: 680 }}>
          <Box
            component="h1"
            sx={{
              ...fadeUp,
              m: 0,
              fontSize: { xs: "38px", md: "58px" },
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "var(--text)",
              mb: "22px",
              animation: "heroFadeUp 0.6s ease 0.08s both",
            }}
          >
            {t("landing.hero.title")}
          </Box>
          <Box
            component="p"
            sx={{
              ...fadeUp,
              m: 0,
              fontSize: { xs: "15px", md: "17px" },
              lineHeight: 1.55,
              color: "var(--text-secondary)",
              mb: "32px",
              animation: "heroFadeUp 0.6s ease 0.16s both",
            }}
          >
            {t("landing.hero.description")}
          </Box>
          <Box
            sx={{
              ...fadeUp,
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              animation: "heroFadeUp 0.6s ease 0.24s both",
            }}
          >
            <Button
              component="a"
              href="#essai"
              variant="contained"
              size="large"
              sx={{
                px: "28px",
                py: "13px",
                fontSize: "15px",
                borderRadius: "var(--r-lg)",
                boxShadow: "0 12px 32px -8px var(--accent-border)",
              }}
            >
              {t("landing.hero.cta_primary")}
            </Button>
            <Button
              component="a"
              href="#fonctionnalites"
              variant="outlined"
              size="large"
              sx={{
                px: "24px",
                py: "13px",
                fontSize: "15px",
                borderRadius: "var(--r-lg)",
                borderColor: "var(--border2)",
                color: "var(--text)",
              }}
            >
              {t("landing.hero.cta_secondary")}
            </Button>
          </Box>
          <Box
            sx={{
              ...fadeUp,
              display: "flex",
              alignItems: "center",
              gap: "18px",
              flexWrap: "wrap",
              mt: "24px",
              fontSize: "13px",
              color: "var(--muted)",
              animation: "heroFadeUp 0.6s ease 0.3s both",
            }}
          >
            {["benefit_no_card", "benefit_fast_scan"].map((benefit) => (
              <Box
                key={benefit}
                sx={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <CheckOutlined sx={{ fontSize: 15, color: "var(--green)" }} />
                {t(`landing.hero.${benefit}`)}
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            position: "relative",
            width: "100%",
            perspective: "1400px",
            animation: "heroFadeUp 0.7s ease 0.15s both",
            ...fadeUp,
          }}
        >
          <Box
            sx={{
              width: "100%",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              overflow: "hidden",
              transform: "rotateY(-14deg) rotateX(4deg)",
              boxShadow:
                "40px 55px 70px -30px rgba(15, 23, 42, 0.45), 90px 70px 90px -50px rgba(15, 23, 42, 0.3)",
            }}
          >
            <img
              src={DASHBOARD_PREVIEW.src}
              width={DASHBOARD_PREVIEW.width}
              height={DASHBOARD_PREVIEW.height}
              fetchPriority="high"
              alt={t("landing.hero.image_alt")}
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </Box>

          <Box
            sx={{
              position: "absolute",
              top: "8%",
              left: { xs: "-6px", md: "-32px" },
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              boxShadow: "var(--sh-3)",
              p: "12px 16px",
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: "var(--red-subtle)",
                color: "var(--red)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <WarningAmberOutlined sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Box
                sx={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}
              >
                {t("landing.hero.score_badge_title")}
              </Box>
              <Box sx={{ fontSize: "11.5px", color: "var(--muted)" }}>
                {t("landing.hero.score_badge_subtitle")}
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              position: "absolute",
              bottom: "20%",
              right: { xs: "-6px", md: "-80px" },
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--s1)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              boxShadow: "var(--sh-3)",
              p: "12px 16px",
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: "var(--accent-subtle)",
                color: "var(--accent2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <TrendingUpOutlined sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Box
                sx={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}
              >
                {t("landing.hero.detected_title")}
              </Box>
              <Box sx={{ fontSize: "11.5px", color: "var(--muted)" }}>
                {t("landing.hero.detected_subtitle")}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
