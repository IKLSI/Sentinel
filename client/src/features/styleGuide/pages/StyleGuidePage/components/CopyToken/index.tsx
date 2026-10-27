import type React from "react";
import ButtonBase from "@mui/material/ButtonBase";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import { useT } from "@/contexts/I18nContext";
import { useCopyToken } from "@/features/styleGuide/pages/StyleGuidePage/hooks";

export const CopyToken: React.FC<{ token: string }> = ({ token }) => {
  const t = useT();
  const copy = useCopyToken();

  return (
    <ButtonBase
      onClick={() => void copy(token)}
      aria-label={t("style_guide.copy_token", { token: `--${token}` })}
      sx={{
        gap: "6px",
        px: "6px",
        py: "2px",
        mx: "-6px",
        borderRadius: "var(--r-sm)",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        color: "var(--text)",
        "& svg": { opacity: 0, transition: "opacity 0.15s" },
        "&:hover, &.Mui-focusVisible": { background: "var(--accent-subtle)" },
        "&:hover svg, &.Mui-focusVisible svg": { opacity: 1 },
      }}
    >
      --{token}
      <ContentCopyOutlined sx={{ fontSize: 12, color: "var(--muted2)" }} />
    </ButtonBase>
  );
};
