import type React from "react";
import Box from "@mui/material/Box";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import { useT } from "@/contexts/I18nContext";
import { Theme } from "@/enums";

interface Props {
  theme: Theme;
  onChange: (mode: Theme) => void;
}

export const AppearancePicker: React.FC<Props> = ({ theme, onChange }) => {
  const t = useT();
  return (
    <Box>
      <Box
        sx={{
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--text)",
          mb: "8px",
        }}
      >
        {t("profile.field.appearance")}
      </Box>
      <Box sx={{ display: "flex", gap: "8px" }}>
        {([Theme.Light, Theme.Dark] as const).map((mode) => (
          <Box
            key={mode}
            component="button"
            type="button"
            onClick={() => onChange(mode)}
            sx={{
              all: "unset",
              cursor: "pointer",
              width: 100,
              boxSizing: "border-box",
              borderRadius: "var(--r-sm)",
              overflow: "hidden",
              border:
                theme === mode
                  ? "2px solid var(--accent)"
                  : "2px solid var(--border)",
              boxShadow:
                theme === mode ? "0 0 0 2px var(--accent-subtle)" : "none",
              transition: "all 0.15s",
            }}
          >
            <Box
              sx={{
                height: 40,
                background:
                  mode === Theme.Dark
                    ? "linear-gradient(150deg,var(--preview-dk-surface) 55%,var(--preview-dk-surface2) 100%)"
                    : "linear-gradient(150deg,#fff 55%,var(--preview-lt-bg) 100%)",
                p: "6px 8px",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <Box
                sx={{
                  height: 3,
                  width: "60%",
                  borderRadius: "var(--r-xs)",
                  background:
                    mode === "dark"
                      ? "var(--preview-dk-bar1)"
                      : "var(--preview-lt-bar1)",
                }}
              />
              <Box
                sx={{
                  height: 3,
                  width: "80%",
                  borderRadius: "var(--r-xs)",
                  background:
                    mode === "dark"
                      ? "var(--preview-dk-bar2)"
                      : "var(--preview-lt-bar2)",
                }}
              />
              <Box
                sx={{
                  height: 3,
                  width: "40%",
                  borderRadius: "var(--r-xs)",
                  background:
                    mode === "dark"
                      ? "var(--preview-dk-accent)"
                      : "var(--preview-lt-accent)",
                }}
              />
            </Box>
            <Box
              sx={{
                px: "8px",
                py: "4px",
                background:
                  mode === "dark"
                    ? "var(--preview-dk-bg)"
                    : "var(--preview-lt-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                {mode === "dark" ? (
                  <DarkModeOutlined
                    sx={{
                      fontSize: 8,
                      color: "var(--preview-dk-text-soft)",
                    }}
                  />
                ) : (
                  <LightModeOutlined
                    sx={{
                      fontSize: 8,
                      color: "var(--preview-lt-text-soft)",
                    }}
                  />
                )}
                <Box
                  sx={{
                    fontSize: "9px",
                    fontWeight: 600,
                    color:
                      mode === "dark"
                        ? "var(--preview-dk-text-strong)"
                        : "var(--preview-lt-text-strong)",
                  }}
                >
                  {mode === "dark"
                    ? t("profile.theme.dark")
                    : t("profile.theme.light")}
                </Box>
              </Box>
              {theme === mode && (
                <Box
                  sx={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckOutlined sx={{ fontSize: 7, color: "var(--s1)" }} />
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
