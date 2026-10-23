export function getPageNumbers(
  page: number,
  totalPages: number,
): { value: number | "..."; key: string }[] {
  const pages: (number | "...")[] =
    totalPages <= 3
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : [1, 2];
  if (totalPages > 3) {
    if (page > 3) pages.push("...");
    if (page > 2 && page < totalPages) pages.push(page);
    if (page < totalPages - 1) pages.push("...");
    if (!pages.includes(totalPages)) pages.push(totalPages);
  }
  let ellipsisIndex = 0;
  return pages.map((value) => {
    if (value === "...") {
      const key = `ellipsis-${ellipsisIndex}`;
      ellipsisIndex += 1;
      return { value, key };
    }
    return { value, key: `page-${value}` };
  });
}

export const navBtnSx = (disabled: boolean) => ({
  font: "inherit",
  textAlign: "inherit",
  cursor: disabled ? "default" : "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  height: "32px",
  px: "12px",
  borderRadius: "var(--r)",
  fontSize: "12px",
  fontWeight: 600,
  color: disabled ? "var(--muted)" : "var(--text-secondary)",
  background: "var(--s2)",
  border: "1px solid var(--border)",
  opacity: disabled ? 0.4 : 1,
  pointerEvents: disabled ? "none" : "auto",
  transition: "background 0.12s, border-color 0.12s, color 0.12s",
  ...(!disabled && {
    "&:hover": {
      background: "var(--s3)",
      borderColor: "var(--border2)",
      color: "var(--text)",
    },
  }),
});

export const pageBtnSx = (active: boolean) => ({
  font: "inherit",
  textAlign: "inherit",
  cursor: active ? "default" : "pointer",
  minWidth: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--r)",
  fontSize: "12px",
  fontWeight: active ? 700 : 500,
  color: active ? "var(--s1)" : "var(--text-secondary)",
  background: active ? "var(--accent)" : "transparent",
  boxShadow: active ? "0 2px 8px var(--accent-border)" : "none",
  transition: "background 0.12s, color 0.12s, box-shadow 0.12s",
  ...(!active && {
    "&:hover": { background: "var(--s2)", color: "var(--text)" },
  }),
});
