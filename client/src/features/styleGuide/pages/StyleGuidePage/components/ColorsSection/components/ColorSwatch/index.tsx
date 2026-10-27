import type React from "react";
import Box from "@mui/material/Box";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";
import { useT } from "@/contexts/I18nContext";
import { usageKeyOf } from "@/features/styleGuide/pages/StyleGuidePage/components/ColorsSection/constants";
import { CopyToken } from "@/features/styleGuide/pages/StyleGuidePage/components/CopyToken";

interface Props {
  token: string;
  value?: string;
}

export const ColorSwatch: React.FC<Props> = ({ token, value }) => {
  const t = useT();

  return (
    <Box
      sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: "12px" }}
    >
      <AppTooltip title={t(usageKeyOf(token))}>
        <Box
          role="img"
          tabIndex={0}
          aria-label={`--${token}`}
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: "var(--r)",
            background: `var(--${token})`,
            boxShadow:
              "inset 0 0 0 1px color-mix(in srgb, var(--text) 12%, transparent)",
            cursor: "help",
          }}
        />
      </AppTooltip>
      <Box
        sx={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <CopyToken token={token} />
        <Box
          title={value}
          sx={{
            maxWidth: "100%",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--muted2)",
            ...TEXT_ELLIPSIS_SX,
          }}
        >
          {value?.replace(/\s+/g, "")}
        </Box>
      </Box>
    </Box>
  );
};
