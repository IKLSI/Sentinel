import type React from "react";
import Box from "@mui/material/Box";
import { riseInSx } from "@/features/auth/styles";

const glowSx = (color: string, size: number) => ({
  content: '""',
  position: "absolute",
  width: size,
  height: size,
  background: `radial-gradient(circle, color-mix(in srgb, ${color}) 0%, transparent 60%)`,
  pointerEvents: "none",
});

const ROOT_SX = {
  width: "100%",
  height: "100dvh",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  background: "var(--auth-bg)",
  "&::before": {
    ...glowSx("var(--auth-indigo-500) 8%, transparent", 700),
    top: -200,
    left: -200,
  },
  "&::after": {
    ...glowSx("var(--auth-indigo-400) 6%, transparent", 600),
    bottom: -200,
    right: -200,
  },
} as const;

const CARD_SX = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  flexDirection: { xs: "column", md: "row" },
  width: "calc(100% - 48px)",
  maxWidth: { xs: 440, md: 860, lg: 1020 },
  height: { xs: "auto", md: 560, lg: 600 },
  borderRadius: "var(--r-xl)",
  overflow: "hidden",
  boxShadow: [
    "0 0 0 1px color-mix(in srgb, var(--auth-indigo-500) 10%, transparent)",
    "0 8px 32px color-mix(in srgb, var(--auth-indigo-500) 8%, transparent)",
    "0 40px 80px color-mix(in srgb, var(--auth-shadow) 12%, transparent)",
  ].join(", "),
  ...riseInSx(0.1, 0.7, 20),
} as const;

const PANEL_SX = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  overflowY: "auto",
  p: { xs: "36px 28px", md: "36px 48px", lg: "56px 64px" },
  background: "var(--auth-surface)",
  fontFamily: '"Plus Jakarta Sans", var(--font-ui), sans-serif',
} as const;

interface AuthLayoutProps {
  children: React.ReactNode;
  aside?: React.ReactNode;
  footer?: React.ReactNode;
  formMaxWidth?: number;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  aside,
  footer,
  formMaxWidth = 360,
}) => (
  <Box sx={ROOT_SX}>
    <Box sx={CARD_SX}>
      {aside}
      <Box sx={PANEL_SX}>
        <Box
          sx={{
            width: "100%",
            maxWidth: formMaxWidth,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 1,
          }}
        >
          {children}
        </Box>
        {footer}
      </Box>
    </Box>
  </Box>
);
