import type React from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";

interface Props {
  title: string;
  source?: string;
  note?: string;
  canvasSx?: SxProps<Theme>;
  children: React.ReactNode;
}

const CANVAS_DOT = "color-mix(in srgb, var(--text) 9%, transparent)";

export const Specimen: React.FC<Props> = ({
  title,
  source,
  note,
  canvasSx,
  children,
}) => (
  <Box
    component="figure"
    sx={{
      m: 0,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      background: "var(--s1)",
      overflow: "hidden",
    }}
  >
    <Box
      component="figcaption"
      sx={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: "16px",
        px: "16px",
        py: "10px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
          {title}
        </Box>
        {note && (
          <Box
            sx={{
              mt: "2px",
              fontSize: "12px",
              lineHeight: 1.5,
              color: "var(--muted2)",
            }}
          >
            {note}
          </Box>
        )}
      </Box>
      {source && (
        <Box
          component="code"
          sx={{
            flexShrink: 0,
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--muted2)",
            ...TEXT_ELLIPSIS_SX,
          }}
        >
          {source}
        </Box>
      )}
    </Box>
    <Box
      sx={{
        flex: 1,
        p: { xs: "16px", md: "20px" },
        backgroundColor: "var(--s2)",
        backgroundImage: `radial-gradient(${CANVAS_DOT} 1px, transparent 1px)`,
        backgroundSize: "16px 16px",
        backgroundPosition: "-8px -8px",
        ...canvasSx,
      }}
    >
      {children}
    </Box>
  </Box>
);
