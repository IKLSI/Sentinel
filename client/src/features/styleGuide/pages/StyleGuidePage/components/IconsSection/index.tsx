import type React from "react";
import Box from "@mui/material/Box";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";
import { useT } from "@/contexts/I18nContext";
import { ICONS } from "@/features/styleGuide/pages/StyleGuidePage/components/IconsSection/constants";
import { Specimen } from "@/features/styleGuide/pages/StyleGuidePage/components/Specimen";

export const IconsSection: React.FC = () => {
  const t = useT();

  return (
    <Specimen
      title={t("style_guide.icons.library")}
      source="@mui/icons-material/<Nom>Outlined"
    >
      <Box
        component="ul"
        sx={{
          m: 0,
          p: 0,
          listStyle: "none",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
          gap: "8px",
        }}
      >
        {ICONS.map(({ name, Icon, meaningKey }) => (
          <AppTooltip key={name} title={t(meaningKey)}>
            <Box
              component="li"
              tabIndex={0}
              aria-label={`${name}Outlined, ${t(meaningKey)}`}
              sx={{
                minWidth: 0,
                height: 64,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                px: "8px",
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                color: "var(--text-secondary)",
                transition: "border-color 0.15s, color 0.15s",
                "&:hover": {
                  borderColor: "var(--border2)",
                  color: "var(--text)",
                },
              }}
            >
              <Icon
                aria-hidden
                sx={{
                  fontSize: 20,
                }}
              />
              <Box
                component="code"
                sx={{
                  maxWidth: "100%",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--muted2)",
                  ...TEXT_ELLIPSIS_SX,
                }}
              >
                {name}
              </Box>
            </Box>
          </AppTooltip>
        ))}
      </Box>
    </Specimen>
  );
};
