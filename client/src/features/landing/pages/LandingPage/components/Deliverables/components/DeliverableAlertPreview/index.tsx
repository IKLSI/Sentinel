import type React from "react";
import Box from "@mui/material/Box";
import { useI18n } from "@/contexts/I18nContext";
import {
  SHOWCASE,
  SHOWCASE_VULNERABILITIES,
} from "@/features/landing/constants";
import {
  PREVIEW_CARD_SX,
  PREVIEW_TITLE_SX,
} from "@/features/landing/pages/LandingPage/components/Deliverables/constants";

export const DeliverableAlertPreview: React.FC = () => {
  const { t } = useI18n();

  return (
    <Box sx={{ ...PREVIEW_CARD_SX, p: "12px 14px" }}>
      <Box sx={{ fontSize: "11.5px", color: "var(--ink-3)", mb: "4px" }}>
        {t("landing.deliverables.mail.from")}
      </Box>
      <Box
        component="p"
        sx={{
          ...PREVIEW_TITLE_SX,
          fontSize: "13px",
          lineHeight: 1.3,
          mb: "6px",
        }}
      >
        {t("landing.deliverables.mail.subject", {
          count: SHOWCASE_VULNERABILITIES.length,
          project: SHOWCASE.onlineStore,
        })}
      </Box>
      {SHOWCASE_VULNERABILITIES.map(
        ({ packageName, cve, fixedVersion, severityKey, color }) => (
          <Box
            key={packageName}
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "1px 10px",
              py: "7px",
              borderTop: "1px solid var(--line)",
            }}
          >
            <Box
              component="b"
              sx={{ fontWeight: 500, fontSize: "12.5px", minWidth: 0 }}
            >
              <Box
                component="i"
                sx={{
                  display: "inline-block",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  mr: "6px",
                  verticalAlign: "1px",
                  background: color,
                }}
              />
              {packageName}
            </Box>
            <Box
              component="span"
              sx={{
                gridColumn: 1,
                fontSize: "11.5px",
                color: "var(--ink-3)",
              }}
            >
              {t(severityKey, { cve })}
            </Box>
            <Box
              component="em"
              sx={{
                gridRow: "1 / 3",
                gridColumn: 2,
                alignSelf: "center",
                fontStyle: "normal",
                fontSize: "11.5px",
                fontWeight: 600,
                color: "var(--success)",
                background: "var(--success-soft)",
                px: "8px",
                py: "2px",
                borderRadius: "999px",
              }}
            >
              {fixedVersion}
            </Box>
          </Box>
        ),
      )}
    </Box>
  );
};
