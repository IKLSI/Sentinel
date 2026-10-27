export const PREVIEW_CARD_SX = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--page)",
  borderRadius: "14px",
  boxShadow:
    "0 0 0 1px var(--line), 0 12px 30px -16px color-mix(in srgb, var(--ink) 18%, transparent)",
  fontSize: "13px",
} as const;

export const PREVIEW_TITLE_SX = {
  m: 0,
  fontSize: "14.5px",
  fontWeight: 600,
} as const;

export const PREVIEW_TAG_SX = {
  fontSize: "12px",
  px: "10px",
  py: "3px",
  borderRadius: "999px",
  background: "var(--tint)",
  color: "var(--ink-2)",
} as const;
