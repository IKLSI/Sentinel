import type React from "react";
import { useOptimistic, useTransition } from "react";
import IconButton from "@mui/material/IconButton";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import { useT } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Theme } from "@/enums";

export const ThemeSwitch: React.FC = () => {
  const t = useT();
  const { theme, toggleTheme } = useTheme();
  const [, startTransition] = useTransition();
  const [shownTheme, setShownTheme] = useOptimistic(theme);
  const isDark = shownTheme === Theme.Dark;
  const Icon = isDark ? DarkModeOutlined : LightModeOutlined;

  const toggle = () =>
    startTransition(() => {
      setShownTheme(isDark ? Theme.Light : Theme.Dark);
      toggleTheme();
    });

  return (
    <IconButton
      onClick={toggle}
      aria-label={t(
        isDark
          ? "style_guide.theme.switch_to_light"
          : "style_guide.theme.switch_to_dark",
      )}
      sx={{
        p: "6px",
        color: "var(--muted2)",
        background: "transparent",
        transition: "color .2s",
        "&:hover": { color: "var(--text)", background: "transparent" },
        "&.Mui-focusVisible": {
          outline: "2px solid var(--accent)",
          outlineOffset: "2px",
        },
      }}
    >
      <Icon sx={{ fontSize: 20 }} />
    </IconButton>
  );
};
