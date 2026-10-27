import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import type { Ticket } from "@/domains/tickets/types";
import { FindingKind } from "@/enums";
import {
  DETAIL_PALETTE,
  PRIORITY_CONFIG,
  typeLabelKeys,
} from "@/features/tickets/pages/TicketDetailPage/constants";
import { statusLabel } from "@/features/tickets/constants";

const findingKindLabelKeys: Record<string, string> = {
  [FindingKind.Vulnerability]: "tickets.finding_kind.vulnerability",
  [FindingKind.OutdatedDependency]: "tickets.finding_kind.outdated_dependency",
  [FindingKind.EolRuntime]: "tickets.finding_kind.eol_runtime",
};

interface Props {
  ticket: Ticket;
}

interface PropertyRow {
  key: string;
  label: string;
  value: string | null | undefined;
}

const valueSx = {
  color: DETAIL_PALETTE.fieldValue,
  fontWeight: 400,
  fontSize: "12px",
};

const emptyValueSx = { ...valueSx, color: DETAIL_PALETTE.muted };

export const PropertiesCard: React.FC<Props> = ({ ticket }) => {
  const t = useT();
  const priority = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.medium;

  const rows: PropertyRow[] = [
    {
      key: "status",
      label: t("tickets.detail.field_status"),
      value: statusLabel(t, ticket.status),
    },
    {
      key: "priority",
      label: t("tickets.detail.field_priority"),
      value: t(priority.labelKey),
    },
    {
      key: "type",
      label: t("tickets.detail.field_type"),
      value: typeLabelKeys[ticket.type]
        ? t(typeLabelKeys[ticket.type])
        : ticket.type,
    },
    {
      key: "assignee",
      label: t("tickets.detail.field_assignee"),
      value: ticket.assignedToName,
    },
    {
      key: "project",
      label: t("tickets.detail.field_project"),
      value: ticket.projectName,
    },
    ...(ticket.findingKind && findingKindLabelKeys[ticket.findingKind]
      ? [
          {
            key: "finding",
            label: t("tickets.detail.field_finding"),
            value: t(findingKindLabelKeys[ticket.findingKind]),
          },
        ]
      : []),
  ];

  return (
    <Box
      sx={{
        border: `1px solid ${DETAIL_PALETTE.panelBorder}`,
        borderRadius: "var(--r-xl)",
        background: DETAIL_PALETTE.panelBg,
        boxShadow: DETAIL_PALETTE.panelShadow,
        p: "8px 6px 4px",
      }}
    >
      <Box
        sx={{
          px: "10px",
          pt: "4px",
          pb: "6px",
          typography: "label",
          color: DETAIL_PALETTE.muted,
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
                color: DETAIL_PALETTE.fieldLabel,
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
              <Box sx={row.value ? valueSx : emptyValueSx}>
                {row.value || t("tickets.detail.unassigned")}
              </Box>
            </Box>
          </Box>
          {idx < arr.length - 1 && (
            <Box
              sx={{
                mx: "8px",
                height: "1px",
                background: DETAIL_PALETTE.fieldSep,
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
};
