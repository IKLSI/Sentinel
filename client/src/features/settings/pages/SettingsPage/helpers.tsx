import { SettingsTab } from "@/enums";
import { CARD_SX } from "@/helpers/cardSx";

export { CARD_SX };

export type Tab = SettingsTab;
export { SettingsTab };

export const SEVERITY_VALUES = ["Critical", "High", "Medium", "Low"] as const;
