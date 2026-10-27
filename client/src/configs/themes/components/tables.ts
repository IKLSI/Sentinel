export const tableComponents = {
  MuiTable: {
    styleOverrides: {
      root: { borderCollapse: "collapse" },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        padding: "9px 16px",
        borderBottom: "1px solid var(--border)",
        font: "inherit",
        letterSpacing: "inherit",
        color: "inherit",
        verticalAlign: "middle",
      },
      sizeSmall: { padding: "6px 12px" },
      head: {
        padding: 0,
        whiteSpace: "nowrap",
        background: "var(--s2)",
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        "tbody > &:last-of-type > td": { borderBottom: "none" },
        "&.MuiTableRow-hover": {
          "& > td": { transition: "background 0.12s ease" },
          "&:hover": { backgroundColor: "transparent" },
          "&:hover > td": { background: "var(--s2)" },
          "&:hover .row-actions": { opacity: "1 !important" },
        },
      },
    },
  },
};
