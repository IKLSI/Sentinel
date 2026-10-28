import type React from "react";
import Box from "@mui/material/Box";

interface Props {
  gitmoji: string;
  title: string;
  count: number;
  tone: string;
  children: React.ReactNode;
}

const GITMOJI_TILE_SIZE = 26;

export const timelineItemSx = (tone: string) =>
  ({
    position: "relative",
    py: "6px",
    fontSize: "13px",
    lineHeight: 1.5,
    color: "var(--text)",
    "&::before": {
      content: '""',
      position: "absolute",
      left: `-${GITMOJI_TILE_SIZE / 2 + 13}px`,
      top: "calc(6px + 0.75em - 4px)",
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: "var(--s1)",
      border: `2px solid ${tone}`,
      boxSizing: "border-box",
    },
  }) as const;

export const GitmojiSection: React.FC<Props> = ({
  gitmoji,
  title,
  count,
  tone,
  children,
}) => (
  <Box component="section" sx={{ mt: "20px" }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: "6px" }}>
      <Box
        component="span"
        aria-hidden
        sx={{
          width: GITMOJI_TILE_SIZE,
          textAlign: "center",
          fontSize: "18px",
          lineHeight: 1,
        }}
      >
        {gitmoji}
      </Box>
      <Box
        component="h4"
        sx={{ m: 0, fontSize: "14px", fontWeight: 700, color: "var(--text)" }}
      >
        {title}
      </Box>
      <Box
        sx={{
          fontSize: "11px",
          fontWeight: 700,
          color: tone,
          px: "7px",
          py: "1px",
          borderRadius: "999px",
          background: `color-mix(in srgb, ${tone} 12%, transparent)`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </Box>
    </Box>
    {children}
  </Box>
);

export const timelineListSx = (tone: string) =>
  ({
    listStyle: "none",
    m: 0,
    p: 0,
    ml: `${GITMOJI_TILE_SIZE / 2}px`,
    pl: `${GITMOJI_TILE_SIZE / 2 + 8}px`,
    borderLeft: `2px solid color-mix(in srgb, ${tone} 25%, transparent)`,
  }) as const;
