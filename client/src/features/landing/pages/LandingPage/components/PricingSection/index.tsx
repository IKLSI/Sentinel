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
        title="Une tarification transparente."
        subtitle="Commencez gratuitement, évoluez au rythme de vos projets."
        emphasis="Aucune carte bancaire requise pour démarrer."
        accent="var(--green)"
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: "32px",
          mt: "40px",
        }}
      >
        {PRICING_PLANS.map((plan) => (
          <Box
            key={plan.id}
            sx={{
              position: "relative",
              background: "var(--s1)",
              border: plan.featured
                ? "2px solid var(--accent)"
                : "1px solid var(--border)",
              borderRadius: "22px",
              p: "36px 32px 32px",
              display: "flex",
              flexDirection: "column",
              boxShadow: plan.featured ? "var(--sh-3)" : "none",
            }}
          >
            {plan.badge && (
              <Box
                sx={{
                  position: "absolute",
                  top: -16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  px: "16px",
                  py: "7px",
                  borderRadius: "999px",
                  background: "var(--accent)",
                  color: "var(--bg)",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {plan.badge}
              </Box>
            )}

            <Box
              sx={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text)",
                mb: "14px",
              }}
            >
              {plan.name}
            </Box>
            <Box
              sx={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                mb: "12px",
                lineHeight: 1.55,
              }}
            >
              {plan.desc}
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <Box
                sx={{
                  fontSize: "52px",
                  fontWeight: 700,
                  letterSpacing: "-0.045em",
                  color: "var(--text)",
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
            <Box sx={{ fontSize: "13px", color: "var(--muted)", mt: "10px" }}>
              {plan.billing}
            </Box>

            <Box
              component="ul"
              sx={{
                listStyle: "none",
                m: "28px 0",
                p: 0,
                pt: "24px",
                borderTop: "1px solid var(--border)",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
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
                      background: plan.featured ? "var(--accent)" : "var(--s3)",
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
            >
              {plan.cta}
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);
