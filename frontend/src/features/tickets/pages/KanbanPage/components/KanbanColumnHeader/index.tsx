import React, { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { DeleteModal } from "@/components/DeleteModal";
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    if (colDef.isDefault) return;
    setDeleting(true);
    try {
      await onDelete(colDef.id);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
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
                {colDef.name}
              </Box>
            </Box>
            <Box
              sx={{
                width: 22,
                height: 20,
                borderRadius: '50%',
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
                {colDef.name}
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
                  borderRadius: '50%',
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
            {onDelete && !colDef.isDefault && (
              <Tooltip title={t("tickets.kanban.column.delete_tooltip")} placement="top" arrow>
                <IconButton
                  size="small"
                  onClick={() => setDeleteOpen(true)}
                  sx={{
                    opacity: hovered ? 0.7 : 0,
                    transition: "opacity 0.15s",
                    width: 20,
                    height: 20,
                    backgroundColor: "transparent",
                    color: "var(--muted2)",
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: "var(--red)",
                      opacity: 1,
                    },
                  }}
                >
                  <DeleteOutlined sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      <DeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title={t("tickets.kanban.column.delete_title")}
      >
        {t("tickets.kanban.column.delete_prefix")}<strong>{colDef.name}</strong>{t("tickets.kanban.column.delete_suffix")}<br />{t("common.action_irreversible_before")}<b>{t("common.action_irreversible_word")}</b>{t("common.action_irreversible_after")}
      </DeleteModal>
    </>
  );
};
