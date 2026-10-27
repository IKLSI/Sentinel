import type React from "react";
import Box from "@mui/material/Box";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { useT } from "@/contexts/I18nContext";
import {
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  TOKEN_LABEL_SX,
  radiusUsageKeyOf,
  shadowRoleKeyOf,
} from "@/features/styleGuide/pages/StyleGuidePage/components/RadiusElevationSection/constants";
import { CopyToken } from "@/features/styleGuide/pages/StyleGuidePage/components/CopyToken";
import { Specimen } from "@/features/styleGuide/pages/StyleGuidePage/components/Specimen";
import { useResolvedCssVars } from "@/features/styleGuide/pages/StyleGuidePage/hooks";

const SOURCE = "configs/themes/cssVars.ts";

export const RadiusElevationSection: React.FC = () => {
  const t = useT();
  const values = useResolvedCssVars(RADIUS_TOKENS);

  return (
    <>
      <Specimen title={t("style_guide.radius.scale")} source={SOURCE}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "16px",
          }}
        >
          {RADIUS_TOKENS.map((token) => (
            <Box key={token} sx={{ minWidth: 0 }}>
              <AppTooltip title={t(radiusUsageKeyOf(token))}>
                <Box
                  role="img"
                  tabIndex={0}
                  aria-label={`--${token}`}
                  sx={{
                    height: 56,
                    background: "var(--s1)",
                    border: "1px solid var(--border2)",
                    borderRadius: `var(--${token})`,
                    boxShadow: "var(--sh-1)",
                    cursor: "help",
                  }}
                />
              </AppTooltip>
              <Box sx={{ ...TOKEN_LABEL_SX, mt: "8px" }}>
                <CopyToken token={token} />
                <Box sx={{ color: "var(--muted2)" }}>{values[token]}</Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Specimen>

      <Specimen
        title={t("style_guide.elevation.levels")}
        note={t("style_guide.elevation.levels_note")}
        source={SOURCE}
        canvasSx={{ backgroundColor: "var(--bg)", backgroundImage: "none" }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(3, minmax(0, 1fr))",
            },
            gap: "24px",
          }}
        >
          {SHADOW_TOKENS.map((token) => (
            <Box
              key={token}
              sx={{
                minWidth: 0,
                height: 88,
                p: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "space-between",
                background: "var(--s1)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                boxShadow: `var(--${token})`,
              }}
            >
              <CopyToken token={token} />
              <Box sx={{ fontSize: "12px", color: "var(--muted2)" }}>
                {t(shadowRoleKeyOf(token))}
              </Box>
            </Box>
          ))}
        </Box>
      </Specimen>
    </>
  );
};
