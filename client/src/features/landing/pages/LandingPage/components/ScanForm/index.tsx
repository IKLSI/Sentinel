import type React from "react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";

interface ScanFormProps {
  tone: "light" | "dark";
}

export const ScanForm: React.FC<ScanFormProps> = ({ tone }) => {
  const t = useT();
  const navigate = useNavigate();
  const [repository, setRepository] = useState("");
  const isDark = tone === "dark";

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const repo = repository.trim();
    if (!repo) return;
    navigate({ to: ROUTES.SCAN, search: { repo } });
  };

  return (
    <Box
      component="form"
      role="search"
      onSubmit={onSubmit}
      sx={{
        display: "flex",
        gap: "6px",
        p: "6px",
        mx: isDark ? 0 : "auto",
        maxWidth: isDark ? 520 : 540,
        borderRadius: "999px",
        border: "1px solid",
        borderColor: isDark ? "rgba(255,255,255,.16)" : "var(--line)",
        background: isDark ? "rgba(255,255,255,.08)" : "#ffffff",
        boxShadow: isDark ? "none" : "0 8px 30px -12px rgba(16,17,36,.14)",
        transition: "border-color .2s, box-shadow .2s",
        "&:focus-within": {
          borderColor: isDark ? "rgba(255,255,255,.4)" : "#c9c6ff",
          boxShadow: isDark
            ? "0 0 0 4px rgba(255,255,255,.08)"
            : "0 0 0 4px var(--indigo-soft), 0 8px 30px -12px rgba(16,17,36,.14)",
        },
        "@media (max-width:560px)": {
          flexDirection: "column",
          borderRadius: "24px",
          mx: "auto",
        },
      }}
    >
      <Box
        component="input"
        aria-label={t("landing.scan.input_label")}
        type="text"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        value={repository}
        placeholder={t("landing.scan.placeholder")}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setRepository(event.target.value)
        }
        sx={{
          flex: 1,
          minWidth: 0,
          height: 46,
          border: 0,
          outline: 0,
          background: "transparent",
          font: "400 15px var(--font-text)",
          color: isDark ? "#ffffff" : "var(--ink)",
          px: "18px",
          "&::placeholder": {
            color: isDark ? "#9d9bd6" : "var(--ink-3)",
            opacity: 1,
          },
          "&:focus, &:focus-visible": { outline: 0, boxShadow: "none" },
          "@media (max-width:560px)": { flex: "none", textAlign: "center" },
        }}
      />
      <Box
        component="button"
        type="submit"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: 46,
          px: "24px",
          border: 0,
          borderRadius: "999px",
          cursor: "pointer",
          whiteSpace: "nowrap",
          font: "500 15px/1 var(--font-text)",
          color: isDark ? "#121236" : "#ffffff",
          background: isDark ? "#ffffff" : "var(--ink)",
          transition: "background .15s",
          "&:hover": { background: isDark ? "#e8e7ff" : "#2a2c48" },
          "&:focus-visible": {
            outline: `2px solid ${isDark ? "#ffffff" : "var(--indigo)"}`,
            outlineOffset: "3px",
          },
          "@media (max-width:560px)": { width: "100%" },
        }}
      >
        {t("landing.cta.scan_button")}
      </Box>
    </Box>
  );
};
