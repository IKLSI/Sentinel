import { memo } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import AddTaskOutlined from "@mui/icons-material/AddTaskOutlined";
import { useNavigate } from "@tanstack/react-router";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { StatusChip } from "@/components/ui/common/StatusChip";
import { useT } from "@/contexts/I18nContext";
import type { FindingTicket } from "@/domains/projects/types";
import { type FindingKind, TicketStatus } from "@/enums";
import { statusLabel } from "@/features/tickets/constants";
import { useFindingActions } from "@/features/techHealth/pages/ProjectDetailPage/findingActions";
import { NO_VALUE } from "@/constants/display";

const createButtonSx = {
  all: "unset",
  cursor: "pointer",
  width: 26,
  height: 26,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--r-sm)",
  color: "var(--muted)",
  transition: "color 0.12s",
  "&:hover": { color: "var(--accent)" },
  "&:disabled": { cursor: "default", opacity: 0.5 },
} as const;

const referenceSx = {
  all: "unset",
  cursor: "pointer",
  display: "inline-flex",
  fontFamily: "var(--font-mono)",
} as const;

const variantOf = (status: string) => {
  if (status === TicketStatus.Resolved) return "green";
  if (status === TicketStatus.Closed) return "gray";
  return "blue";
};

interface Props {
  kind: FindingKind;
  findingKey: string;
  linkedTicket?: FindingTicket | null;
  actionable: boolean;
}

export const FindingTicketCell = memo<Props>(
  ({ kind, findingKey, linkedTicket, actionable }) => {
    const t = useT();
    const navigate = useNavigate();
    const { createTicket, creatingFindingKey } = useFindingActions();
    const creating = creatingFindingKey === findingKey;

    const openTicket = (ticketId: string) =>
      navigate({ to: "/tickets/$id", params: { id: ticketId } });

    if (linkedTicket) {
      return (
        <AppTooltip title={statusLabel(t, linkedTicket.status)}>
          <Box
            component="button"
            type="button"
            onClick={() => openTicket(linkedTicket.id)}
            sx={referenceSx}
          >
            <StatusChip variant={variantOf(linkedTicket.status)}>
              {linkedTicket.reference}
            </StatusChip>
          </Box>
        </AppTooltip>
      );
    }

    if (!actionable) {
      return (
        <Box component="span" sx={{ color: "var(--muted)" }}>
          {NO_VALUE}
        </Box>
      );
    }

    return (
      <AppTooltip title={t("tech_health.ticket.create")}>
        <Box
          component="button"
          type="button"
          aria-label={t("tech_health.ticket.create")}
          disabled={creatingFindingKey !== null}
          onClick={() => createTicket(kind, findingKey)}
          sx={createButtonSx}
        >
          {creating ? (
            <CircularProgress size={14} />
          ) : (
            <AddTaskOutlined sx={{ fontSize: 16 }} />
          )}
        </Box>
      </AppTooltip>
    );
  },
);
FindingTicketCell.displayName = "FindingTicketCell";
