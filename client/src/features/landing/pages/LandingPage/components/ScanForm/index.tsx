import type React from "react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputBase from "@mui/material/InputBase";
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
        borderColor: isDark
          ? "color-mix(in srgb, var(--on-dark) 16%, transparent)"
          : "var(--line)",
        background: isDark
          ? "color-mix(in srgb, var(--on-dark) 8%, transparent)"
          : "var(--page)",
        boxShadow: isDark
          ? "none"
          : "0 8px 30px -12px color-mix(in srgb, var(--ink) 14%, transparent)",
        transition: "border-color .2s, box-shadow .2s",
        "&:focus-within": {
          borderColor: isDark
            ? "color-mix(in srgb, var(--on-dark) 40%, transparent)"
            : "var(--indigo-300)",
          boxShadow: isDark
            ? "0 0 0 4px color-mix(in srgb, var(--on-dark) 8%, transparent)"
            : "0 0 0 4px var(--indigo-soft), 0 8px 30px -12px color-mix(in srgb, var(--ink) 14%, transparent)",
        },
        "@media (max-width:560px)": {
          flexDirection: "column",
          borderRadius: "24px",
          mx: "auto",
        },
      }}
    >
      <InputBase
        type="text"
        autoComplete="off"
        value={repository}
        placeholder={t("landing.scan.placeholder")}
        onChange={(event) => setRepository(event.target.value)}
        inputProps={{
          "aria-label": t("landing.scan.input_label"),
          inputMode: "url",
          spellCheck: false,
        }}
        sx={{
          flex: 1,
          minWidth: 0,
          height: 46,
          px: "18px",
          font: "400 15px var(--font-text)",
          color: isDark ? "var(--on-dark)" : "var(--ink)",
          "& .MuiInputBase-input::placeholder": {
            color: isDark ? "var(--night-muted)" : "var(--ink-3)",
            opacity: 1,
          },
          "@media (max-width:560px)": {
            flex: "none",
            "& .MuiInputBase-input": { textAlign: "center" },
          },
        }}
      />
      <ButtonBase
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
          color: isDark ? "var(--night)" : "var(--on-dark)",
          background: isDark ? "var(--page)" : "var(--ink)",
          transition: "background .15s",
          "&:hover": {
            background: isDark ? "var(--indigo-100)" : "var(--ink-hover)",
          },
          "&:focus-visible": {
            outline: `2px solid ${isDark ? "var(--on-dark)" : "var(--indigo)"}`,
            outlineOffset: "3px",
          },
          "@media (max-width:560px)": { width: "100%" },
        }}
      >
        {t("landing.cta.scan_button")}
      </ButtonBase>
    </Box>
  );
};
