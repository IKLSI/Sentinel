export const RADIUS_TOKENS = [
  "r-xs",
  "r-sm",
  "r",
  "r-md",
  "r-lg",
  "r-xl",
] as const;

export const radiusUsageKeyOf = (token: string) =>
  `style_guide.radius.usage.${token.replace(/-/g, "_")}`;

export const SHADOW_TOKENS = ["sh-1", "sh-2", "sh-3"] as const;

export const shadowRoleKeyOf = (token: string) =>
  `style_guide.elevation.role.${token.replace(/-/g, "_")}`;

export const TOKEN_LABEL_SX = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "8px",
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
} as const;
