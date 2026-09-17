import { Link } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import { ROUTES } from "@/constants/routes";
import { PRICING_PLANS } from "@/features/landing/constants";
import { SectionHeading } from "@/features/landing/pages/LandingPage/components/SectionHeading";

export const PricingSection = () => (
  <Box
    component="section"
    id="pricing"
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
        top: "6%",
        left: "-100px",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 70%)",
        filter: "blur(20px)",
      }}
    />
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        bottom: "-120px",
        right: "-60px",
        width: "460px",
        height: "460px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, color-mix(in srgb, var(--green) 12%, transparent) 0%, transparent 70%)",
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
        title="Une tarification transparente."
        subtitle="Commencez gratuitement, évoluez au rythme de vos projets."
        emphasis="Aucune carte bancaire requise pour démarrer."
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: "32px",
          mt: "48px",
          alignItems: "start",
        }}
      >
        {PRICING_PLANS.map((plan) => (
          <Box
            key={plan.id}
            sx={{
              position: "relative",
              background: plan.featured
                ? "linear-gradient(165deg, var(--s2) 0%, var(--s1) 55%)"
                : "var(--s1)",
              border: plan.featured
                ? "1px solid var(--accent-border)"
                : "1px solid var(--border)",
              borderRadius: "22px",
              p: { xs: "28px 22px 22px", md: "36px 32px 32px" },
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: plan.featured ? "var(--sh-3)" : "none",
              transform: { md: plan.featured ? "translateY(-12px)" : "none" },
            }}
          >
            {plan.featured && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(ellipse 420px 220px at 50% 0%, var(--accent-subtle) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
            )}

            <Box
              sx={{
                position: "relative",
                mb: "14px",
              }}
            >
              <Box
                sx={{
                  fontSize: "24px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  backgroundImage: plan.featured
                    ? "linear-gradient(135deg, var(--text) 0%, var(--accent) 130%)"
                    : "none",
                  backgroundClip: plan.featured ? "text" : "unset",
                  WebkitBackgroundClip: plan.featured ? "text" : "unset",
                  color: plan.featured ? "transparent" : "var(--text)",
                }}
              >
                {plan.name}
              </Box>
            </Box>
            <Box
              sx={{
                position: "relative",
                fontSize: "14px",
                color: "var(--text-secondary)",
                mb: "8px",
                lineHeight: 1.55,
              }}
            >
              {plan.desc}
            </Box>

            <Box
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
              }}
            >
              <Box
                sx={{
                  fontSize: "52px",
                  fontWeight: 800,
                  letterSpacing: "-0.045em",
                  backgroundImage: plan.featured
                    ? "linear-gradient(135deg, var(--text) 0%, var(--accent) 120%)"
                    : "none",
                  backgroundClip: plan.featured ? "text" : "unset",
                  WebkitBackgroundClip: plan.featured ? "text" : "unset",
                  color: plan.featured ? "transparent" : "var(--text)",
                }}
              >
                {plan.price}€
              </Box>
              {plan.price > 0 && (
                <Box
                  sx={{
                    fontSize: "14px",
                    color: "var(--muted)",
                    fontWeight: 500,
                  }}
                >
                  / mois
                </Box>
              )}
            </Box>
            <Box
              sx={{
                position: "relative",
                fontSize: "13px",
                color: "var(--muted)",
                mt: "10px",
              }}
            >
              {plan.billing}
            </Box>

            <Box
              component="ul"
              sx={{
                position: "relative",
                listStyle: "none",
                m: "28px 0",
                p: 0,
                pt: "24px",
                borderTop: "1px solid var(--border)",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "13px",
              }}
            >
              {plan.features.map((feature) => (
                <Box
                  component="li"
                  key={feature}
                  sx={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "11px",
                    lineHeight: 1.5,
                  }}
                >
                  <CheckOutlined
                    sx={{
                      fontSize: 18,
                      color: plan.featured ? "var(--bg)" : "var(--text)",
                      background: plan.featured
                        ? "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, var(--purple)) 100%)"
                        : "var(--s3)",
                      borderRadius: "50%",
                      p: "3px",
                      flexShrink: 0,
                    }}
                  />
                  {feature}
                </Box>
              ))}
            </Box>

            <Button
              component={Link}
              to={ROUTES.LOGIN}
              variant={plan.featured ? "contained" : "outlined"}
              size="large"
              fullWidth
              sx={{
                position: "relative",
                py: "13px",
                fontSize: "15px",
                borderRadius: "var(--r-lg)",
                boxShadow: plan.featured
                  ? "0 12px 32px -8px var(--accent-border)"
                  : "none",
              }}
            >
              {plan.cta}
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);
