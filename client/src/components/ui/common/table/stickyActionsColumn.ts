export const OVERFLOWING_ATTRIBUTE = "data-x-overflow";

export const ROW_ACTIONS_CELL_SX = {
  padding: "6px 20px 6px 0",
  whiteSpace: "nowrap",
  overflow: "visible",
} as const;

export const STICKY_ACTIONS_COLUMN_SX = {
  "& th:last-child, & td:last-child": {
    position: "sticky",
    right: 0,
    zIndex: 1,
  },
  "& tbody tr:not(:hover) > td:last-child": { background: "var(--s1)" },
  [`[${OVERFLOWING_ATTRIBUTE}="true"] & th:last-child, [${OVERFLOWING_ATTRIBUTE}="true"] & td:last-child`]:
    { boxShadow: "inset 1px 0 0 var(--border)" },
} as const;
