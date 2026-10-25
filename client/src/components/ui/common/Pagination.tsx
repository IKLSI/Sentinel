import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import ChevronLeftOutlined from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import { useT } from "@/contexts/I18nContext";
import {
  getPageNumbers,
  navBtnSx,
  pageBtnSx,
  pageSizeGroupSx,
  pageSizeOptionSx,
} from "@/helpers/pagination";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
  countLabel: string;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (size: number) => void;
}

const captionSx = {
  fontSize: "11px",
  color: "var(--muted)",
  fontFamily: "var(--font-mono)",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
} as const;

export const Pagination: React.FC<Props> = ({
  page,
  totalPages,
  total,
  onChange,
  countLabel,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}) => {
  const t = useT();
  const pages = getPageNumbers(page, totalPages);
  const hasPageSizeMenu =
    pageSize !== undefined && !!pageSizeOptions && !!onPageSizeChange;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: "16px",
        py: "8px",
        borderTop: "1px solid var(--border)",
        flexShrink: 0,
        background: "var(--s2)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Box sx={captionSx}>
          {total} {countLabel}
        </Box>

        {hasPageSizeMenu && (
          <>
            <Box sx={captionSx} aria-hidden="true">
              ·
            </Box>
            <Box
              role="group"
              aria-label={t("pagination.rows_per_page")}
              sx={pageSizeGroupSx}
            >
              {pageSizeOptions.map((option) => (
                <ButtonBase
                  key={option}
                  sx={pageSizeOptionSx(option === pageSize)}
                  aria-pressed={option === pageSize}
                  onClick={() =>
                    option !== pageSize && onPageSizeChange(option)
                  }
                >
                  {option}
                </ButtonBase>
              ))}
            </Box>
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <IconButton
          sx={navBtnSx(page === 1)}
          disabled={page === 1}
          aria-label={t("pagination.previous")}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeftOutlined fontSize="small" />
        </IconButton>

        {pages.map(({ value, key }) =>
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
              …
            </Box>
          ) : (
            <ButtonBase
              key={key}
              sx={pageBtnSx(value === page)}
              aria-current={value === page ? "page" : undefined}
              onClick={() => value !== page && onChange(value as number)}
            >
              {value}
            </ButtonBase>
          ),
        )}

        <IconButton
          sx={navBtnSx(page >= totalPages)}
          disabled={page >= totalPages}
          aria-label={t("pagination.next")}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRightOutlined fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};
