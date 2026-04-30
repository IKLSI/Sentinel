import React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/i18n/I18nContext";
import { TicketStatus } from "@/types";
import { columnMeta } from "../../helpers";

interface Props {
  colId: TicketStatus;
  count?: number;
  loading?: boolean;
}

export const KanbanColumnHeader: React.FC<Props> = ({
  colId,
  count,
  loading = false,
}) => {
  const t = useT();
  const meta = columnMeta[colId];

  return (
    <Box
      sx={{
        mb: "8px",
        padding: "11px 14px",
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderTop: `2px solid ${meta.color}`,
        borderRadius: "var(--r)",
        flexShrink: 0,
        ...(loading && {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }),
      }}
    >
      {loading ? (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: meta.color,
              }}
            />
            <Box
              sx={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {t(meta.labelKey)}
            </Box>
          </Box>
          <Box
            sx={{
              width: 22,
              height: 20,
              borderRadius: 99,
              background: "var(--s2)",
            }}
          />
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <Box
              sx={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: meta.color,
                flexShrink: 0,
              }}
            />
            <Box
              sx={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {t(meta.labelKey)}
            </Box>
          </Box>
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "22px",
              height: "20px",
              padding: "0 6px",
              borderRadius: "99px",
              background: meta.subtle,
              border: `1px solid ${meta.border}`,
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 700,
              color: meta.color,
            }}
          >
            {count}
          </Box>
        </Box>
      )}
    </Box>
  );
};
