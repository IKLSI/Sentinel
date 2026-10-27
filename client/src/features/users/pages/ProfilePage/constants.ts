import { CARD_SX as BASE_CARD_SX } from "@/helpers/cardSx";

export const CARD_SX = {
  ...BASE_CARD_SX,
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
} as const;
