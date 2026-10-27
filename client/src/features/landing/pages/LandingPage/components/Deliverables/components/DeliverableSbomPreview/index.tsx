import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import { SHOWCASE } from "@/features/landing/constants";
import { PREVIEW_CARD_SX } from "@/features/landing/pages/LandingPage/components/Deliverables/constants";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";

export const DeliverableSbomPreview: React.FC = () => {
  const { t } = useI18n();

  return (
    <Box
      sx={{
        ...PREVIEW_CARD_SX,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        p: "12px 14px",
      }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{
          width: 36,
          height: 36,
          flex: "none",
          borderRadius: "10px",
          display: "grid",
          placeItems: "center",
          background: "var(--indigo-soft)",
          color: "var(--indigo)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6M9 17h4" />
        </svg>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          component="b"
          sx={{
            display: "block",
            fontSize: "13px",
            fontWeight: 600,
            ...TEXT_ELLIPSIS_SX,
          }}
        >
          {SHOWCASE.sbomFile}
        </Box>
        <Box component="small" sx={{ fontSize: "12px", color: "var(--ink-3)" }}>
          {t("landing.deliverables.sbom.meta", {
            count: SHOWCASE.sbomComponents,
          })}
        </Box>
      </Box>
      <Box
        component="span"
        aria-hidden
        sx={{
          width: 30,
          height: 30,
          flex: "none",
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: "var(--ink)",
          color: "var(--on-dark)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        </svg>
      </Box>
    </Box>
  );
};
