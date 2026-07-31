import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import {
  getPageNumbers,
  navBtnSx,
  pageBtnSx,
} from "@/features/tickets/pages/TicketsPage/helpers";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}

export const Pagination: React.FC<Props> = ({
  page,
  totalPages,
  total,
  onChange,
}) => {
  const t = useT();
  const pages = getPageNumbers(page, totalPages);
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
          letterSpacing: "0.04em",
        }}
      >
        {total}{" "}
        {total > 1
          ? t("tickets.list.count_plural")
          : t("tickets.list.count_singular")}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Box
          component="button"
          sx={navBtnSx(page === 1)}
          onClick={() => onChange(page - 1)}
        >
          {t("tickets.list.previous")}
        </Box>

        <Box
          sx={{ display: "flex", alignItems: "center", gap: "2px", mx: "4px" }}
        >
          {pages.map(({ value, key }) =>
            value === "..." ? (
              <Box
                key={key}
                sx={{
                  minWidth: "28px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "var(--muted)",
                  pb: "2px",
                }}
              >
                ···
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
          {t("tickets.list.next")}
        </Box>
      </Box>
    </Box>
  );
};
