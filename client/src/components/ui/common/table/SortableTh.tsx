import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import ArrowDownwardOutlined from "@mui/icons-material/ArrowDownwardOutlined";
import type { CellAlign } from "@/components/ui/common/table/VirtualTable/TableCells";

interface SortableThProps {
  children?: React.ReactNode;
  align?: CellAlign;
  sortable?: boolean;
  active?: boolean;
  ascending?: boolean;
  onSort?: () => void;
  width?: string;
}

const JUSTIFY_BY_ALIGN: Record<CellAlign, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

const IDLE_ARROW_OPACITY = 0.45;

const SORTABLE_LABEL_SX = {
  textAlign: "inherit",
  transition: "color 0.12s",
  "&:hover": { color: "var(--text-secondary)" },
  "&:focus-visible": { color: "var(--accent)" },
} as const;
const ARROW_CLASS = "SortableTh-arrow";

export const SortableTh: React.FC<SortableThProps> = ({
  children,
  align = "left",
  sortable = false,
  active = false,
  ascending = true,
  onSort,
  width,
}) => {
  const sorted = sortable && active;
  const labelSx = {
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: JUSTIFY_BY_ALIGN[align],
    gap: "5px",
    width: "100%",
    padding: "10px 16px",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: sorted ? "var(--accent)" : "var(--muted)",
    userSelect: "none",
  } as const;

  const arrow = (
    <ArrowDownwardOutlined
      className={ARROW_CLASS}
      sx={{
        fontSize: 12,
        flexShrink: 0,
        opacity: sorted ? 1 : 0,
        transform: sorted && ascending ? "rotate(180deg)" : "none",
        transition: "opacity 0.12s, transform 0.12s",
        ...(align === "center" && {
          position: "absolute",
          left: "100%",
          top: "50%",
          ml: "5px",
          mt: "-6px",
        }),
      }}
    />
  );

  return (
    <Box
      component="th"
      scope="col"
      aria-sort={
        sorted
          ? ascending
            ? "ascending"
            : "descending"
          : sortable
            ? "none"
            : undefined
      }
      sx={{
        padding: 0,
        width,
        whiteSpace: "nowrap",
        background: "var(--s2)",
        borderBottom: "1px solid var(--border)",
        [`&:hover .${ARROW_CLASS}`]: {
          opacity: sorted ? 1 : IDLE_ARROW_OPACITY,
        },
      }}
    >
      {sortable ? (
        <ButtonBase onClick={onSort} sx={{ ...labelSx, ...SORTABLE_LABEL_SX }}>
          {align === "center" ? (
            <Box component="span" sx={{ position: "relative" }}>
              {children}
              {arrow}
            </Box>
          ) : (
            <>
              {children}
              {arrow}
            </>
          )}
        </ButtonBase>
      ) : (
        <Box sx={labelSx}>{children}</Box>
      )}
    </Box>
  );
};
