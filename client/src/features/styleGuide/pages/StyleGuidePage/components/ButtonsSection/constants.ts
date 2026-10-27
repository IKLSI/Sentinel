import type { UsageRule } from "@/features/styleGuide/pages/StyleGuidePage/components/UsageRules";

export const BUTTON_ICON_SX = { fontSize: 16 } as const;

export const USAGE_RULES: readonly UsageRule[] = [
  { kind: "do", textKey: "style_guide.buttons.rule_primary" },
  { kind: "do", textKey: "style_guide.buttons.rule_cancel" },
  { kind: "do", textKey: "style_guide.buttons.rule_icon_label" },
];
