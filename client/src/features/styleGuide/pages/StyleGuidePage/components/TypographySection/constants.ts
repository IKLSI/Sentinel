import type { typographyVariants } from "@/configs/themes/typography";

export const FONT_FAMILIES = [
  {
    token: "font-ui",
    name: "Inter",
    usageKey: "style_guide.typography.family.ui",
  },
  {
    token: "font-mono",
    name: "JetBrains Mono",
    usageKey: "style_guide.typography.family.mono",
  },
] as const;

export interface TypeStep {
  size: number;
  weight: number;
  roleKey: string;
  exampleKey: string;
  mono?: boolean;
}

const step = (size: number, weight: number, key: string, mono = false) => ({
  size,
  weight,
  roleKey: `style_guide.typography.role.${key}`,
  exampleKey: `style_guide.typography.example.${key}`,
  mono,
});

export const TYPE_SCALE: readonly TypeStep[] = [
  step(28, 800, "figure"),
  step(24, 700, "page_title"),
  step(20, 700, "entity_title"),
  step(15, 700, "dialog_title"),
  step(14, 400, "reading"),
  step(13, 500, "body"),
  step(12, 400, "secondary"),
  step(11, 400, "meta", true),
];

export type ThemeVariantName = keyof typeof typographyVariants;

const variant = (name: ThemeVariantName, key: string) => ({
  name,
  exampleKey: `style_guide.typography.example.${key}`,
});

export const THEME_VARIANTS = [
  variant("cardTitle", "card_title"),
  variant("label", "label"),
  variant("monoLabel", "mono_label"),
  variant("monoCaption", "mono_caption"),
];
