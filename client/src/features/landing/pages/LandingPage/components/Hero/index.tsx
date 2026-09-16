import type React from "react";
import Box from "@mui/material/Box";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";

interface AlertConfig {
  icon: React.ElementType;
  color: string;
  background: string;
  border: string;
  title: string;
  repo: string;
  time: string;
  cve?: string;
}

const ALERTS: AlertConfig[] = [
  {
    icon: WarningAmberOutlined,
    color: "var(--red)",
    background: "var(--red-subtle)",
    border: "color-mix(in srgb, var(--red) 30%, transparent)",
    title: "Vulnérabilité critique détectée",
    repo: "legacy-tools",
    time: "il y a 4 min",
    cve: "CVE-2025-1842",
  },
  {
    icon: AccessTimeOutlined,
    color: "var(--yellow)",
    background: "var(--yellow-subtle)",
    border: "color-mix(in srgb, var(--yellow) 35%, transparent)",
    title: "Runtime Node 14 en fin de support",
    repo: "legacy-tools",
    time: "il y a 2 h",
  },
  {
    icon: CheckOutlined,
    color: "var(--green)",
    background: "var(--green-subtle)",
    border: "color-mix(in srgb, var(--green) 30%, transparent)",
    title: "sentinel-api · 0 vulnérabilité",
    repo: "Scan complet",
    time: "il y a 8 h",
  },
];

export const Hero = () => (
  <Box
    component="section"
    sx={{
      minHeight: "calc(100dvh - 88px)",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      py: { xs: "48px", md: "88px" },
      borderBottom: "1px solid var(--border)",
    }}
  >
    <Box
      sx={{
        width: "100%",
        maxWidth: 1160,
        mx: "auto",
        px: { xs: "20px", md: "32px" },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1.05fr" },
        gap: { xs: "40px", md: "72px" },
        alignItems: "center",
      }}
    >
      <Box sx={{ maxWidth: 680 }}>
        <Box
          component="h1"
          sx={{
            m: 0,
            fontSize: { xs: "38px", md: "58px" },
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "var(--text)",
            mb: "22px",
          }}
        >
          Ne laissez plus une dépendance devenir une faille.
        </Box>
        <Box
          component="p"
          sx={{
            m: 0,
            fontSize: { xs: "15px", md: "17px" },
            lineHeight: 1.55,
            color: "var(--text-secondary)",
          }}
        >
          Connectez vos dépôts GitHub et GitLab, Sentinel s'occupe du reste.
          Vulnérabilités, dépendances obsolètes et configurations à risque sont
          repérées avant de devenir un incident en production.
        </Box>
      </Box>

      <Box
        sx={{
          background: "var(--s1)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--sh-2)",
          p: { xs: "20px", md: "28px" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: "18px",
            mb: "20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--green)",
                boxShadow: "0 0 0 3px var(--green-subtle)",
              }}
            />
            Dernières détections
          </Box>
          <Box
            sx={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--muted)",
              border: "1px solid var(--border)",
              borderRadius: "999px",
              px: "8px",
              py: "3px",
            }}
          >
            last 24h
          </Box>
        </Box>

        {ALERTS.map((alert) => (
          <Box
            key={alert.title}
            sx={{
              display: "flex",
              gap: "14px",
              alignItems: "flex-start",
              p: "16px",
              borderRadius: "12px",
              background: alert.background,
              border: `1px solid ${alert.border}`,
              mb: "12px",
              "&:last-of-type": { mb: 0 },
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "9px",
                background: alert.color,
                color: "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <alert.icon sx={{ fontSize: 16 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box
                sx={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}
              >
                {alert.title}
              </Box>
              <Box
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--muted)",
                  mt: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {alert.cve && (
                  <>
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 700,
                        color: alert.color,
                        background: alert.background,
                        borderRadius: "4px",
                        px: "6px",
                        py: "1px",
                      }}
                    >
                      {alert.cve}
                    </Box>
                    <span>·</span>
                  </>
                )}
                <span>{alert.repo}</span>
                <span>·</span>
                <span>{alert.time}</span>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);
