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
  width: "28px",
  height: "28px",
  borderRadius: "var(--r-sm)",
  color: "var(--muted2)",
  opacity: disabled ? 0.35 : 1,
  pointerEvents: disabled ? "none" : "auto",
});

export const pageBtnSx = (active: boolean) => ({
  font: "inherit",
  textAlign: "inherit",
  cursor: active ? "default" : "pointer",
  minWidth: "28px",
  height: "28px",
  px: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--r-sm)",
  fontSize: "12px",
  fontWeight: active ? 700 : 500,
  color: active ? "var(--accent)" : "var(--muted2)",
  background: active ? "var(--accent-subtle)" : "transparent",
  transition: "background 0.12s, color 0.12s",
  ...(!active && {
    "&:hover": { background: "var(--s3)", color: "var(--text)" },
  }),
});

export const pageSizeGroupSx = {
  display: "flex",
  alignItems: "center",
  gap: "2px",
  p: "2px",
  borderRadius: "var(--r-sm)",
  border: "1px solid var(--border)",
  background: "var(--s1)",
};

export const pageSizeOptionSx = (active: boolean) => ({
  font: "inherit",
  cursor: active ? "default" : "pointer",
  minWidth: "30px",
  height: "22px",
  px: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "calc(var(--r-sm) - 2px)",
  fontSize: "11px",
  fontFamily: "var(--font-mono)",
  fontWeight: active ? 700 : 500,
  color: active ? "var(--text)" : "var(--muted)",
  background: active ? "var(--s3)" : "transparent",
  transition: "background 0.12s, color 0.12s",
  ...(!active && { "&:hover": { color: "var(--text)" } }),
});
