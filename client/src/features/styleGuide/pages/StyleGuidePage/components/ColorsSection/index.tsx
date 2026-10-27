import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { ColorSwatch } from "@/features/styleGuide/pages/StyleGuidePage/components/ColorsSection/components/ColorSwatch";
import { GroupHeading } from "@/features/styleGuide/pages/StyleGuidePage/components/ColorsSection/components/GroupHeading";
import {
  ALL_COLOR_TOKENS,
  COLOR_GROUPS,
  STATUS_TONES,
  SWATCH_GRID_SX,
  statusTokensOf,
} from "@/features/styleGuide/pages/StyleGuidePage/components/ColorsSection/constants";
import { Specimen } from "@/features/styleGuide/pages/StyleGuidePage/components/Specimen";
import { useResolvedCssVars } from "@/features/styleGuide/pages/StyleGuidePage/hooks";

const GROUP_SX = {
  "& + &": { mt: "24px", pt: "24px", borderTop: "1px solid var(--border)" },
} as const;

export const ColorsSection: React.FC = () => {
  const t = useT();
  const values = useResolvedCssVars(ALL_COLOR_TOKENS);

  return (
    <Specimen
      title={t("style_guide.colors.palette")}
      source="configs/themes/cssVars.ts"
      canvasSx={{ backgroundColor: "var(--s1)", backgroundImage: "none" }}
    >
      {COLOR_GROUPS.map(({ titleKey, hintKey, tokens }) => (
        <Box key={titleKey} sx={GROUP_SX}>
          <GroupHeading title={t(titleKey)} hint={t(hintKey)} />
          <Box sx={SWATCH_GRID_SX}>
            {tokens.map((token) => (
              <ColorSwatch key={token} token={token} value={values[token]} />
            ))}
          </Box>
        </Box>
      ))}
      <Box sx={GROUP_SX}>
        <GroupHeading
          title={t("style_guide.colors.status")}
          hint={t("style_guide.colors.status_hint")}
        />
        <Box sx={{ display: "grid", gap: "12px" }}>
          {STATUS_TONES.map((tone) => (
            <Box key={tone.name} sx={SWATCH_GRID_SX}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "var(--text)",
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 8,
                    height: 8,
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: `var(--${tone.name})`,
                  }}
                />
                {t(`style_guide.colors.role.${tone.name}`)}
              </Box>
              {statusTokensOf(tone).map((token) => (
                <ColorSwatch key={token} token={token} value={values[token]} />
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Specimen>
  );
};
