import React, { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { useT } from "@/i18n/I18nContext";
import { KanbanColumnDef } from "../../helpers";

interface Props {
  colDef: KanbanColumnDef;
  count?: number;
  loading?: boolean;
  onDelete?: (id: string) => void;
}

export const KanbanColumnHeader: React.FC<Props> = ({
  colDef,
  count,
  loading = false,
  onDelete,
}) => {
  const t = useT();
  const [hovered, setHovered] = useState(false);
  const label = colDef.labelKey ? t(colDef.labelKey) : colDef.name;

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        mb: "8px",
        padding: "11px 14px",
        background: "var(--s1)",
        border: "1px solid var(--border)",
        borderTop: `2px solid ${colDef.color}`,
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
                background: colDef.color,
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
              {label}
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
                background: colDef.color,
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
              {label}
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {!colDef.isSystem && onDelete && (
              <IconButton
                size="small"
                onClick={() => onDelete(colDef.id)}
                sx={{
                  opacity: hovered ? 0.7 : 0,
                  transition: "opacity 0.15s",
                  width: 20,
                  height: 20,
                  color: "var(--muted2)",
                  "&:hover": { color: "var(--red)", opacity: 1 },
                }}
              >
                <DeleteOutlined sx={{ fontSize: 13 }} />
              </IconButton>
            )}
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
                background: colDef.subtle,
                border: `1px solid ${colDef.border}`,
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                color: colDef.color,
              }}
            >
              {count}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
