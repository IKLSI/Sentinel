import React from "react";
import Box from "@mui/material/Box";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import { useT } from "@/i18n/I18nContext";
import { Ticket } from "@/types";
import {
  DetailPalette,
  buildPriorityConfig,
  buildStatusConfig,
  typeLabelKeys,
} from "../../helpers";
import StatusPriorityBadge from "@/features/tickets/components/StatusPriorityBadge";
import { priorityColor, statusDotColor } from "../../../TicketsPage/helpers";

interface Props {
  ticket: Ticket;
  palette: DetailPalette;
  statusConfig: ReturnType<typeof buildStatusConfig>;
  priorityConfig: ReturnType<typeof buildPriorityConfig>;
}

export const PropertiesCard: React.FC<Props> = ({
  ticket,
  palette,
  statusConfig,
  priorityConfig,
}) => {
  const t = useT();
  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority] ?? priorityConfig.medium;

  const rows = [
    {
      key: "status",
      label: t("tickets.detail.field_status"),
      value: (
        <StatusPriorityBadge
          dotColor={statusDotColor[ticket.status]}
          label={t(status.labelKey)}
          noGlow={ticket.status === "closed"}
        />
      ),
    },
    {
      key: "priority",
      label: t("tickets.detail.field_priority"),
      value: (
        <StatusPriorityBadge
          dotColor={priorityColor[ticket.priority]}
          label={t(priority.labelKey)}
        />
      ),
    },
    {
      key: "type",
      label: t("tickets.detail.field_type"),
      value: (
        <>
          <ShieldOutlined sx={{ fontSize: 14, color: palette.typeIcon }} />
          <Box
            sx={{
              color: palette.fieldValue,
              fontWeight: 400,
              fontSize: "12px",
            }}
          >
            {typeLabelKeys[ticket.type]
              ? t(typeLabelKeys[ticket.type])
              : ticket.type}
          </Box>
        </>
      ),
    },
    {
      key: "assignee",
      label: t("tickets.detail.field_assignee"),
      value: ticket.assignee ? (
        <Box
          sx={{ color: palette.fieldValue, fontWeight: 400, fontSize: "12px" }}
        >
          {ticket.assignee.firstName} {ticket.assignee.lastName}
        </Box>
      ) : (
        <Box sx={{ color: palette.muted, fontWeight: 400, fontSize: "12px" }}>
          {t("tickets.detail.unassigned")}
        </Box>
      ),
    },
    {
      key: "project",
      label: t("tickets.detail.field_project"),
      value: (
        <>
          <FolderOutlined sx={{ fontSize: 14, color: palette.folderIcon }} />
          <Box
            sx={{
              color: palette.fieldValue,
              fontWeight: 400,
              fontSize: "12px",
            }}
          >
            {ticket.projectName ?? "—"}
          </Box>
        </>
      ),
    },
  ];

  return (
    <Box
      sx={{
        border: `1px solid ${palette.panelBorder}`,
        borderRadius: "20px",
        background: palette.panelBg,
        boxShadow: palette.panelShadow,
        p: "8px 6px 4px",
      }}
    >
      <Box
        sx={{
          px: "10px",
          pt: "4px",
          pb: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontWeight: 800,
          color: palette.muted,
          fontSize: "10px",
        }}
      >
        {t("tickets.detail.section_properties")}
      </Box>
      {rows.map((row, idx, arr) => (
        <Box key={row.key}>
          <Box
            component="button"
            sx={{
              all: "unset",
              width: "100%",
              boxSizing: "border-box",
              py: "9px",
              px: "10px",
              display: "grid",
              gridTemplateColumns: "76px 1fr",
              alignItems: "center",
              gap: "8px",
              borderRadius: "8px",
              cursor: "pointer",
              "&:hover": { background: palette.fieldRowHover },
            }}
          >
            <Box
              sx={{
                color: palette.fieldLabel,
                fontSize: "11px",
                fontWeight: 400,
              }}
            >
              {row.label}
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
              }}
            >
              {row.value}
            </Box>
          </Box>
          {idx < arr.length - 1 && (
            <Box
              sx={{ mx: "8px", height: "1px", background: palette.fieldSep }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
};
