import type React from "react";
import Box from "@mui/material/Box";
import MailOutlineOutlined from "@mui/icons-material/MailOutlineOutlined";
import { useT } from "@/contexts/I18nContext";
import { useAppConfigQuery } from "@/domains/settings/queries";

export const LegalContactCard: React.FC = () => {
  const t = useT();
  const supportEmail = useAppConfigQuery().data?.supportEmail ?? "";

  return (
    <Box
      sx={{
        mt: "20px",
        p: { xs: "18px", md: "22px 24px" },
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "linear-gradient(135deg, var(--s2) 0%, var(--s1) 100%)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
      }}
    >
      <Box>
        <Box sx={{ fontSize: "13px", fontWeight: 600 }}>
          {t("legal.shell.contact_title")}
        </Box>
        <Box
          sx={{
            mt: "5px",
            whiteSpace: { md: "nowrap" },
            fontSize: "12px",
            lineHeight: 1.65,
            color: "var(--muted2)",
          }}
        >
          {t("legal.shell.contact_body")}
        </Box>
      </Box>
      {supportEmail && (
        <Box
          component="a"
          href={`mailto:${supportEmail}`}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--accent)",
            textDecoration: "none",
            border: "1px solid var(--accent-border)",
            background: "var(--accent-subtle)",
            borderRadius: "var(--r-sm)",
            px: "12px",
            py: "8px",
            whiteSpace: "nowrap",
            transition: "background 0.15s",
            "&:hover": {
              background: "color-mix(in srgb, var(--accent) 16%, transparent)",
            },
          }}
        >
          <MailOutlineOutlined sx={{ fontSize: 14 }} />
          {supportEmail}
        </Box>
      )}
    </Box>
  );
};
