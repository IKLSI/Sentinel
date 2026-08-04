import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import type { Ticket } from "@/domains/tickets/types";
import {
  type DetailPalette,
  type buildPriorityConfig,
  typeLabelKeys,
} from "@/features/tickets/pages/TicketDetailPage/helpers";
import { statusLabel } from "@/features/tickets/constants";

interface Props {
  ticket: Ticket;
  palette: DetailPalette;
  priorityConfig: ReturnType<typeof buildPriorityConfig>;
}

export const PropertiesCard: React.FC<Props> = ({
  ticket,
  palette,
  priorityConfig,
}) => {
  const t = useT();
  const priority = priorityConfig[ticket.priority] ?? priorityConfig.medium;

  const valueSx = {
    color: palette.fieldValue,
    fontWeight: 400,
    fontSize: "12px",
  };
  const emptyValueSx = { ...valueSx, color: palette.muted };

  const rows = [
    {
      key: "status",
      label: t("tickets.detail.field_status"),
      value: <Box sx={valueSx}>{statusLabel(t, ticket.status)}</Box>,
    },
    {
      key: "priority",
      label: t("tickets.detail.field_priority"),
      value: <Box sx={valueSx}>{t(priority.labelKey)}</Box>,
    },
    {
      key: "type",
      label: t("tickets.detail.field_type"),
      value: (
        <Box sx={valueSx}>
          {typeLabelKeys[ticket.type]
            ? t(typeLabelKeys[ticket.type])
            : ticket.type}
        </Box>
      ),
    },
    {
      key: "assignee",
      label: t("tickets.detail.field_assignee"),
      value: ticket.assignedToName ? (
        <Box sx={valueSx}>{ticket.assignedToName}</Box>
      ) : (
        <Box sx={emptyValueSx}>{t("tickets.detail.unassigned")}</Box>
      ),
    },
    {
      key: "project",
      label: t("tickets.detail.field_project"),
      value: ticket.projectName ? (
        <Box sx={valueSx}>{ticket.projectName}</Box>
      ) : (
        <Box sx={emptyValueSx}>{t("tickets.detail.unassigned")}</Box>
      ),
    },
  ];

  return (
    <Box
      sx={{
        border: `1px solid ${palette.panelBorder}`,
        borderRadius: "var(--r-xl)",
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
            component="div"
            sx={{
              width: "100%",
              boxSizing: "border-box",
              py: "9px",
              px: "10px",
              display: "grid",
              gridTemplateColumns: "76px 1fr",
              alignItems: "center",
              gap: "8px",
              borderRadius: "var(--r)",
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
