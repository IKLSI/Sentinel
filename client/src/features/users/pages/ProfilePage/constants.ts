import { UserRole } from "@/enums";
import { CARD_SX as BASE_CARD_SX } from "@/helpers/cardSx";

export const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  [UserRole.Admin]: "profile.role.admin",
  [UserRole.Developer]: "profile.role.developer",
};

export const GDPR_ACTION_SX = { minWidth: "160px" } as const;

export const CARD_SX = {
  ...BASE_CARD_SX,
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
} as const;

export const SCROLL_AREA_SX = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  pr: "4px",
} as const;
