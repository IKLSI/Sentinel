import type React from "react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputBase from "@mui/material/InputBase";
import { ROUTES } from "@/constants/routes";
import { useT } from "@/contexts/I18nContext";

const TONES = {
  light: {
    mx: "auto",
    maxWidth: 540,
    border: "var(--line)",
    background: "var(--page)",
    shadow: "0 8px 30px -12px color-mix(in srgb, var(--ink) 14%, transparent)",
    focusBorder: "var(--indigo-300)",
    focusShadow:
      "0 0 0 4px var(--indigo-soft), 0 8px 30px -12px color-mix(in srgb, var(--ink) 14%, transparent)",
    text: "var(--ink)",
    placeholder: "var(--ink-3)",
    buttonColor: "var(--on-dark)",
    buttonBackground: "var(--ink)",
    buttonHover: "var(--ink-hover)",
    buttonOutline: "var(--indigo)",
  },
  dark: {
    mx: 0,
    maxWidth: 520,
    border: "color-mix(in srgb, var(--on-dark) 16%, transparent)",
    background: "color-mix(in srgb, var(--on-dark) 8%, transparent)",
    shadow: "none",
    focusBorder: "color-mix(in srgb, var(--on-dark) 40%, transparent)",
    focusShadow: "0 0 0 4px color-mix(in srgb, var(--on-dark) 8%, transparent)",
    text: "var(--on-dark)",
    placeholder: "var(--night-muted)",
    buttonColor: "var(--night)",
    buttonBackground: "var(--page)",
    buttonHover: "var(--indigo-100)",
    buttonOutline: "var(--on-dark)",
  },
} as const;

interface ScanFormProps {
  tone: "light" | "dark";
}

export const ScanForm: React.FC<ScanFormProps> = ({ tone }) => {
  const t = useT();
  const navigate = useNavigate();
  const [repository, setRepository] = useState("");
  const palette = TONES[tone];

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
        mx: palette.mx,
        maxWidth: palette.maxWidth,
        borderRadius: "999px",
        border: "1px solid",
        borderColor: palette.border,
        background: palette.background,
        boxShadow: palette.shadow,
        transition: "border-color .2s, box-shadow .2s",
        "&:focus-within": {
          borderColor: palette.focusBorder,
          boxShadow: palette.focusShadow,
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
          color: palette.text,
          "& .MuiInputBase-input::placeholder": {
            color: palette.placeholder,
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
          color: palette.buttonColor,
          background: palette.buttonBackground,
          transition: "background .15s",
          "&:hover": { background: palette.buttonHover },
          "&:focus-visible": {
            outline: `2px solid ${palette.buttonOutline}`,
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
