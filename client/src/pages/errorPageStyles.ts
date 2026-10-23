import { keyframes } from "@mui/material/styles";

const breathe = keyframes`
  0%, 100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.65;
    transform: translate(-50%, -50%) scale(1.1);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-14px);
  }
`;

const enter = keyframes`
  from {
    opacity: 0;
    transform: translateY(22px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const DOT_GRID_MASK =
  "radial-gradient(ellipse 80% 70% at center, black 30%, transparent 100%)";

const glow = (color: string, size: string, fade: number) => ({
  content: '""',
  position: "absolute",
  width: size,
  height: size,
  background: `radial-gradient(circle, color-mix(in srgb, ${color}) 0%, transparent ${fade}%)`,
});

export const ERROR_ROOT_SX = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  background: "var(--bg)",
} as const;

export const ERROR_GLOW_SX = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  "&::before": {
    ...glow("var(--accent) 7%, transparent", "70vw", 60),
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    animation: `${breathe} 5s ease-in-out infinite`,
  },
  "&::after": {
    ...glow("var(--purple) 4%, transparent", "40vw", 65),
    bottom: "-10%",
    right: "-10%",
    animation: `${breathe} 7s ease-in-out infinite reverse`,
  },
} as const;

export const ERROR_DOT_GRID_SX = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.35,
  backgroundImage:
    "radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)",
  backgroundSize: "36px 36px",
  maskImage: DOT_GRID_MASK,
  WebkitMaskImage: DOT_GRID_MASK,
} as const;

export const ERROR_GHOST_SX = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  fontFamily: "var(--font-mono)",
  fontSize: {
    xs: "clamp(100px, 38vw, 180px)",
    sm: "clamp(140px, 26vw, 380px)",
  },
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: "-0.06em",
  whiteSpace: "nowrap",
  color: "transparent",
  WebkitTextStroke: "1px var(--border2)",
  opacity: 0.6,
  userSelect: "none",
  pointerEvents: "none",
  animation: `${float} 7s ease-in-out infinite`,
} as const;

export const ERROR_CONTENT_SX = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  maxWidth: 480,
  px: "24px",
  animation: `${enter} 0.9s cubic-bezier(0.16, 1, 0.3, 1) both`,
} as const;

export const ERROR_TITLE_SX = {
  mb: "10px",
  fontSize: "clamp(20px, 2.8vw, 26px)",
  fontWeight: 800,
  lineHeight: 1.15,
  letterSpacing: "-0.04em",
  color: "var(--text)",
} as const;

export const ERROR_SUBTITLE_SX = {
  mb: "32px",
  maxWidth: { xs: 260, sm: 300 },
  fontSize: "13.5px",
  lineHeight: 1.7,
  color: "var(--muted)",
} as const;

export const ERROR_DIVIDER_SX = {
  width: "100%",
  mb: "28px",
  fontFamily: "var(--font-mono)",
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--muted)",
} as const;

export const ERROR_SUPPORT_SX = {
  mt: "20px",
  fontSize: "11.5px",
  color: "var(--muted)",
} as const;

export const ERROR_SUPPORT_LINK_SX = {
  color: "var(--muted2)",
  textUnderlineOffset: "3px",
  textDecorationColor: "var(--border2)",
  "&:hover": { color: "var(--accent)", textDecoration: "none" },
} as const;
