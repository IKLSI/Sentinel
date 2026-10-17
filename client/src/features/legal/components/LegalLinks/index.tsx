import type React from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { Link } from "@tanstack/react-router";
import { useT } from "@/contexts/I18nContext";
import { LEGAL_DOCUMENTS } from "@/features/legal/constants";

type Tone = "auth" | "app";

interface Props {
  tone: Tone;
  sx?: SxProps<Theme>;
}

const TONES = {
  auth: {
    color: "var(--auth-gray-400)",
    hover: "var(--auth-gray-900)",
    dot: "var(--auth-gray-300)",
  },
  app: {
    color: "var(--muted)",
    hover: "var(--text)",
    dot: "var(--border2)",
  },
} as const;

const BASE_SX = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
} as const;

export const LegalLinks: React.FC<Props> = ({ tone, sx }) => {
  const t = useT();
  const palette = TONES[tone];
  const labelSx = {
    fontSize: "10px",
    color: palette.color,
    textDecoration: "none",
    transition: "color 0.15s",
    "&:hover": { color: palette.hover },
  };
  const rootSx = [
    BASE_SX,
    ...(Array.isArray(sx) ? sx : [sx]),
  ] as SxProps<Theme>;

  return (
    <Box component="nav" sx={rootSx}>
      {LEGAL_DOCUMENTS.map((document, index) => (
        <Box
          key={document.id}
          sx={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          {index > 0 && (
            <Box
              sx={{
                width: "2px",
                height: "2px",
                borderRadius: "50%",
                background: palette.dot,
              }}
            />
          )}
          {tone === "app" ? (
            <Box
              component="a"
              href={document.to}
              target="_blank"
              rel="noopener noreferrer"
              sx={labelSx}
            >
              {t(document.labelKey)}
            </Box>
          ) : (
            <Link to={document.to} style={{ textDecoration: "none" }}>
              <Box sx={labelSx}>{t(document.labelKey)}</Box>
            </Link>
          )}
        </Box>
      ))}
    </Box>
  );
};
