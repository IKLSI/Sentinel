import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { useAppConfigQuery } from "@/domains/settings/queries";
import { ROUTES } from "@/constants/routes";

interface Section {
  titleKey: string;
  bodyKey: string;
  extra?: React.ReactNode;
}

export const PrivacyPage: React.FC = () => {
  const t = useT();
  const supportEmail = useAppConfigQuery().data?.supportEmail ?? "";

  const sections: Section[] = [
    {
      titleKey: "privacy.section.controller",
      bodyKey: "privacy.controller.body",
    },
    { titleKey: "privacy.section.data", bodyKey: "privacy.data.body" },
    { titleKey: "privacy.section.purpose", bodyKey: "privacy.purpose.body" },
    {
      titleKey: "privacy.section.retention",
      bodyKey: "privacy.retention.body",
    },
    {
      titleKey: "privacy.section.rights",
      bodyKey: "privacy.rights.body",
      extra: (
        <a
          href={ROUTES.PROFILE}
          style={{
            display: "inline-block",
            marginTop: 10,
            color: "var(--accent)",
            fontSize: 12,
            textDecoration: "underline",
            fontFamily: "inherit",
          }}
        >
          {t("privacy.rights.profile_link")}
        </a>
      ),
    },
    { titleKey: "privacy.section.security", bodyKey: "privacy.security.body" },
    { titleKey: "privacy.section.contact", bodyKey: "privacy.contact.body" },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        justifyContent: "center",
        py: 6,
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 680 }}>
        <Box
          sx={{
            background: "var(--s1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              borderBottom: "1px solid var(--border)",
              background: "var(--s2)",
              px: 3,
              py: 2.5,
            }}
          >
            <Box sx={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
              {t("privacy.title")}
            </Box>
            <Box sx={{ fontSize: 11, color: "var(--muted)", mt: 0.5 }}>
              {t("privacy.updated")}
            </Box>
          </Box>

          <Box
            sx={{
              px: 3,
              py: 3,
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {sections.map((s) => (
              <Box key={s.titleKey}>
                <Box
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text)",
                    mb: 1,
                  }}
                >
                  {t(s.titleKey)}
                </Box>
                <Box
                  sx={{
                    fontSize: 12,
                    color: "var(--muted)",
                    lineHeight: 1.7,
                  }}
                >
                  {t(s.bodyKey)}
                </Box>
                {s.extra}
              </Box>
            ))}

            {supportEmail && (
              <Box
                sx={{
                  pt: 2,
                  borderTop: "1px solid var(--border)",
                  fontSize: 11,
                  color: "var(--muted2)",
                }}
              >
                <a
                  href={`mailto:${supportEmail}`}
                  style={{ color: "var(--accent)", textDecoration: "none" }}
                >
                  {supportEmail}
                </a>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
