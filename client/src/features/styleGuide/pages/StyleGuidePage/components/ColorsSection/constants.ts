export const usageKeyOf = (token: string) =>
  `style_guide.colors.usage.${token.replace(/-/g, "_")}`;

export const COLOR_GROUPS = [
  {
    titleKey: "style_guide.colors.surfaces",
    hintKey: "style_guide.colors.surfaces_hint",
    tokens: ["bg", "s1", "s2", "s3", "border", "border2"],
  },
  {
    titleKey: "style_guide.colors.text",
    hintKey: "style_guide.colors.text_hint",
    tokens: ["text", "text-secondary", "muted2", "muted"],
  },
  {
    titleKey: "style_guide.colors.accent",
    hintKey: "style_guide.colors.accent_hint",
    tokens: [
      "accent",
      "accent2",
      "accent-fill",
      "accent-subtle",
      "accent-border",
    ],
  },
] as const;

export const STATUS_TONES = [
  { name: "green", fill: "green-fill" },
  { name: "yellow" },
  { name: "orange" },
  { name: "red", fill: "red-fill" },
  { name: "cyan" },
  { name: "purple" },
] as const;

export const statusTokensOf = (tone: (typeof STATUS_TONES)[number]) => [
  tone.name,
  `${tone.name}-subtle`,
  ...("fill" in tone ? [tone.fill] : []),
];

export const ALL_COLOR_TOKENS = [
  ...COLOR_GROUPS.flatMap((group) => group.tokens),
  ...STATUS_TONES.flatMap(statusTokensOf),
];

export const SWATCH_GRID_SX = {
  display: "grid",
  gridTemplateColumns: {
    xs: "repeat(2, minmax(0, 1fr))",
    md: "repeat(4, minmax(0, 1fr))",
  },
  gap: "12px 16px",
} as const;
