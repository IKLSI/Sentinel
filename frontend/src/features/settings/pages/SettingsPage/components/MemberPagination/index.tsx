import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/i18n/I18nContext";
import { getPageNumbers, navBtnSx, pageBtnSx } from "../../helpers";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}

export const MemberPagination: React.FC<Props> = ({
  page,
  totalPages,
  total,
  onChange,
}) => {
  const pages = getPageNumbers(page, totalPages);
  const pageItems = pages.map((value, index) => ({
    value,
    key: value === "..." ? `ellipsis-${pages[index - 1]}` : `page-${value}`,
  }));
  const t = useT();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: "16px",
        py: "10px",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
        background: "var(--s2)",
      }}
    >
      <Box
        sx={{
          fontSize: "11px",
          color: "var(--muted)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {total}{" "}
        {total > 1
          ? t("settings.members.count_plural")
          : t("settings.members.count_singular")}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <Box
          component="button"
          sx={navBtnSx(page === 1)}
          onClick={() => onChange(page - 1)}
        >
          {t("settings.pagination.previous")}
        </Box>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: "2px", mx: "2px" }}
        >
          {pageItems.map(({ value, key }) =>
            value === "..." ? (
              <Box
                key={key}
                sx={{
                  minWidth: "24px",
                  textAlign: "center",
                  fontSize: "12px",
                  color: "var(--muted)",
                }}
              >
                ·
              </Box>
            ) : (
              <Box
                key={key}
                component="button"
                sx={pageBtnSx(value === page)}
                onClick={() => value !== page && onChange(value as number)}
              >
                {value}
              </Box>
            ),
          )}
        </Box>
        <Box
          component="button"
          sx={navBtnSx(page === totalPages)}
          onClick={() => onChange(page + 1)}
        >
          {t("settings.pagination.next")}
        </Box>
      </Box>
    </Box>
  );
};
