import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import {
  SHOWCASE,
  SHOWCASE_VULNERABILITIES,
} from "@/features/landing/constants";
import {
  PREVIEW_CARD_SX,
  PREVIEW_TAG_SX,
  PREVIEW_TITLE_SX,
} from "@/features/landing/pages/LandingPage/components/Deliverables/constants";

export const DeliverableTicketPreview: React.FC = () => {
  const { t } = useI18n();

  return (
    <Box sx={{ ...PREVIEW_CARD_SX, p: "16px", display: "grid", gap: "12px" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "var(--ink-3)",
        }}
      >
        <span>{SHOWCASE.mailTicket}</span>
        <span>{t("landing.deliverables.ticket.age")}</span>
      </Box>
      <Box component="p" sx={{ ...PREVIEW_TITLE_SX, lineHeight: 1.35 }}>
        {t("landing.deliverables.ticket.subject", {
          package: SHOWCASE_VULNERABILITIES[0].packageName,
          version: SHOWCASE_VULNERABILITIES[0].fixedVersion,
        })}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        <Box
          component="span"
          sx={{
            ...PREVIEW_TAG_SX,
            background: "var(--danger-soft)",
            color: "var(--danger)",
            fontWeight: 500,
          }}
        >
          {t("landing.deliverables.ticket.critical")}
        </Box>
        <Box component="span" sx={PREVIEW_TAG_SX}>
          {t("landing.deliverables.ticket.security")}
        </Box>
        <Box component="span" sx={PREVIEW_TAG_SX}>
          {SHOWCASE.onlineStore}
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12.5px",
          color: "var(--ink-2)",
          pt: "10px",
          borderTop: "1px solid var(--line)",
        }}
      >
        <Box
          component="i"
          sx={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "var(--indigo-300)",
          }}
        />
        {t("landing.deliverables.ticket.assignee", {
          name: SHOWCASE.assignee,
        })}
      </Box>
    </Box>
  );
};
