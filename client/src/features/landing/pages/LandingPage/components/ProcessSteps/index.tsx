import type React from "react";
import Box from "@mui/material/Box";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import AutorenewOutlined from "@mui/icons-material/AutorenewOutlined";
import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import { PROCESS_STEPS } from "@/features/landing/constants";
import { SectionHeading } from "@/features/landing/pages/LandingPage/components/SectionHeading";

const ICONS: Record<(typeof PROCESS_STEPS)[number]["id"], React.ElementType> = {
  connect: LinkOutlined,
  scan: AutorenewOutlined,
  act: NotificationsActiveOutlined,
};

export const ProcessSteps = () => (
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
        title="Trois étapes vous séparent de la première alerte."
        subtitle="Pas d'intégration lourde, pas d'agent à installer. Sentinel se branche sur vos dépôts, croise vos dépendances avec les bases de vulnérabilités et calcule votre score de santé en continu."
        accent="var(--blue)"
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: { xs: "16px", md: "32px" },
        }}
      >
        {PROCESS_STEPS.map((step, index) => {
          const Icon = ICONS[step.id];
          return (
            <Box
              key={step.id}
              sx={{
                position: "relative",
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "22px",
                p: "32px 30px 34px",
              }}
            >
              {index < PROCESS_STEPS.length - 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    right: -29,
                    transform: "translateY(-50%)",
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "var(--s1)",
                    border: "1px solid var(--border2)",
                    display: { xs: "none", md: "flex" },
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--muted)",
                    zIndex: 2,
                  }}
                >
                  <ChevronRightOutlined sx={{ fontSize: 15 }} />
                </Box>
              )}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  mb: "22px",
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "14px",
                    background: step.color,
                    color: "var(--bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon sx={{ fontSize: 22 }} />
                </Box>
                <Box
                  sx={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: step.color,
                  }}
                >
                  {`Étape 0${index + 1}`}
                </Box>
              </Box>
              <Box
                component="h3"
                sx={{
                  m: 0,
                  fontSize: "21px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--text)",
                  mb: "10px",
                }}
              >
                {step.title}
              </Box>
              <Box
                component="p"
                sx={{
                  m: 0,
                  fontSize: "14.5px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {step.desc}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  </Box>
);
