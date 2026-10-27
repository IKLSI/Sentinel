import type React from "react";
import Box from "@mui/material/Box";
import { Link } from "@tanstack/react-router";
import { ROUTES } from "@/constants/routes";
import { SentinelWordmark } from "@/components/layout/SentinelWordmark";
import { useT } from "@/contexts/I18nContext";
import {
  LEGAL_CONTENT_SX,
  LEGAL_HEADER_HEIGHT,
} from "@/features/legal/constants";

export const LegalHeader: React.FC = () => {
  const t = useT();

  return (
    <Box
      component="header"
      className="legal-no-print"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid var(--border)",
        background: "color-mix(in srgb, var(--bg) 86%, transparent)",
        backdropFilter: "blur(14px)",
      }}
    >
      <Box
        sx={{
          ...LEGAL_CONTENT_SX,
          height: `${LEGAL_HEADER_HEIGHT}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Link
          to={ROUTES.HOME}
          aria-label={t("legal.shell.back_home")}
          style={{
            display: "flex",
            alignItems: "center",
            color: "var(--text)",
          }}
        >
          <SentinelWordmark height={18} />
        </Link>

        <Box
          sx={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--muted)",
            whiteSpace: "nowrap",
          }}
        >
          {t("legal.shell.eyebrow")}
        </Box>
      </Box>
    </Box>
  );
};
