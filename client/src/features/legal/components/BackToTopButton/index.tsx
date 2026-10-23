import type React from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import KeyboardArrowUpOutlined from "@mui/icons-material/KeyboardArrowUpOutlined";
import { useT } from "@/contexts/I18nContext";
import { useReadingProgress } from "@/hooks/useReadingProgress";

const SCROLLED_THRESHOLD = 320;

export const BackToTopButton: React.FC = () => {
  const t = useT();
  const { scrolled } = useReadingProgress(SCROLLED_THRESHOLD);

  return (
    <Tooltip title={t("legal.shell.back_to_top")} arrow placement="left">
      <Box
        component="button"
        type="button"
        className="legal-no-print"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        sx={{
          position: "fixed",
          right: { xs: "16px", md: "28px" },
          bottom: { xs: "16px", md: "28px" },
          zIndex: 25,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: "color-mix(in srgb, var(--s1) 88%, transparent)",
          backdropFilter: "blur(10px)",
          boxShadow: "var(--sh-2)",
          color: "var(--muted2)",
          cursor: "pointer",
          opacity: scrolled ? 1 : 0,
          pointerEvents: scrolled ? "auto" : "none",
          transform: scrolled ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.2s, transform 0.2s, color 0.15s",
          "&:hover": { color: "var(--accent)" },
        }}
      >
        <KeyboardArrowUpOutlined sx={{ fontSize: 20 }} />
      </Box>
    </Tooltip>
  );
};
