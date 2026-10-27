import type React from "react";
import Box from "@mui/material/Box";
import { SentinelWordmark } from "@/components/layout/SentinelWordmark";
import { riseInSx } from "@/features/auth/styles";

interface AuthShowcaseItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconStyle: React.CSSProperties;
}

const FIRST_ITEM_DELAY = 0.52;
const ITEM_DELAY_STEP = 0.1;

const ITEM_SX = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  padding: "15px 18px",
  borderRadius: "var(--r-md)",
  background: "rgba(48, 44, 96, 0.42)",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  backdropFilter: "blur(10px)",
} as const;

const ICON_SX = {
  width: 30,
  height: 30,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--r)",
} as const;

const HEADLINE_FONT =
  '"Bricolage Grotesque Variable", var(--font-ui), sans-serif';

const PANEL_SX = {
  width: "50%",
  flexShrink: 0,
  display: { xs: "none", md: "flex" },
  flexDirection: "column",
  justifyContent: "center",
  p: { md: "36px 44px", lg: "56px" },
  position: "relative",
  overflow: "hidden",
  color: "#fff",
  background: [
    "radial-gradient(60% 45% at 88% 8%, color-mix(in srgb, var(--auth-violet-400) 30%, transparent) 0%, transparent 60%)",
    "linear-gradient(160deg, rgba(24, 20, 62, 0.42) 0%, rgba(20, 17, 50, 0.34) 45%, rgba(14, 12, 38, 0.66) 100%)",
    "radial-gradient(75% 65% at 5% 22%, rgba(16, 13, 45, 0.5) 0%, transparent 62%)",
    "radial-gradient(80% 80% at 0% 100%, rgba(12, 10, 34, 0.42) 0%, transparent 60%)",
    "var(--auth-photo) 40% 42% / cover no-repeat",
    "var(--auth-indigo-950)",
  ].join(", "),
  "&::before": {
    content: '""',
    position: "absolute",
    top: -80,
    right: -80,
    width: 340,
    height: 340,
    background:
      "radial-gradient(ellipse, rgba(255, 255, 255, 0.1) 0%, transparent 65%)",
    pointerEvents: "none",
  },
} as const;

const DOT_GRID_SX = {
  position: "absolute",
  inset: 0,
  opacity: 0.18,
  pointerEvents: "none",
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.09) 1px, transparent 0)",
  backgroundSize: "28px 28px",
} as const;

const LOGO_SX = {
  position: "absolute",
  top: 44,
  left: 48,
  zIndex: 1,
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 14px 7px 9px",
  borderRadius: "var(--r-xl)",
  background: "rgba(255, 255, 255, 0.12)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  backdropFilter: "blur(8px)",
  ...riseInSx(0.3, 0.6),
} as const;

interface AuthShowcaseProps {
  headline: string;
  headlineLead?: string;
  headlineAccent: string;
  subtitle: string;
  items: AuthShowcaseItem[];
  decor?: React.ReactNode;
  showLogo?: boolean;
}

export const AuthShowcase: React.FC<AuthShowcaseProps> = ({
  headline,
  headlineLead,
  headlineAccent,
  subtitle,
  items,
  decor,
  showLogo = false,
}) => (
  <Box sx={PANEL_SX}>
    <Box sx={DOT_GRID_SX} aria-hidden />
    {decor}
    {showLogo && (
      <Box sx={LOGO_SX}>
        <SentinelWordmark height={14} />
      </Box>
    )}

    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "36px",
        position: "relative",
        zIndex: 1,
        ...riseInSx(0.38, 0.7),
      }}
    >
      <Box>
        <Box
          component="h1"
          sx={{
            m: "0 0 16px",
            fontFamily: HEADLINE_FONT,
            fontSize: { md: 34, lg: 38 },
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            textShadow: "0 1px 10px rgba(10, 10, 20, 0.5)",
          }}
        >
          {headline}
          <br />
          <Box component="span" sx={{ whiteSpace: "nowrap" }}>
            {headlineLead && `${headlineLead} `}
            <Box
              component="span"
              sx={{
                color:
                  "color-mix(in srgb, var(--auth-indigo-300) 72%, transparent)",
              }}
            >
              {headlineAccent}
            </Box>
          </Box>
        </Box>
        <Box
          component="p"
          sx={{
            m: 0,
            maxWidth: 340,
            fontSize: "13.5px",
            lineHeight: 1.65,
            color: "rgba(255, 255, 255, 0.78)",
            textShadow: "0 1px 8px rgba(10, 10, 20, 0.55)",
          }}
        >
          {subtitle}
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {items.map((item, index) => (
          <Box
            key={item.title}
            sx={{
              ...ITEM_SX,
              ...riseInSx(FIRST_ITEM_DELAY + index * ITEM_DELAY_STEP, 0.55, 6),
            }}
          >
            <Box sx={{ ...ICON_SX, ...item.iconStyle }}>{item.icon}</Box>
            <Box>
              <Box
                sx={{
                  mb: "2px",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "rgba(255, 255, 255, 0.9)",
                }}
              >
                {item.title}
              </Box>
              <Box
                sx={{
                  fontSize: "11.5px",
                  lineHeight: 1.5,
                  color: "rgba(255, 255, 255, 0.8)",
                }}
              >
                {item.description}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);
