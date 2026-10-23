import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { getPageNumbers, navBtnSx, pageBtnSx } from "@/helpers/pagination";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
  previousLabel: string;
  nextLabel: string;
  countLabel: string;
}

export const Pagination: React.FC<Props> = ({
  page,
  totalPages,
  total,
  onChange,
  previousLabel,
  nextLabel,
  countLabel,
}) => {
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
        {total} {countLabel}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <ButtonBase
          sx={navBtnSx(page === 1)}
          onClick={() => onChange(page - 1)}
        >
          {previousLabel}
        </ButtonBase>

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
              <ButtonBase
                key={key}
                sx={pageBtnSx(value === page)}
                onClick={() => value !== page && onChange(value as number)}
              >
                {value}
              </ButtonBase>
            ),
          )}
        </Box>

        <ButtonBase
          sx={navBtnSx(page === totalPages)}
          onClick={() => onChange(page + 1)}
        >
          {nextLabel}
        </ButtonBase>
      </Box>
    </Box>
  );
};
