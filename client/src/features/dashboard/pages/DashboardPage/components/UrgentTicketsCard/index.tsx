import type React from "react";
import Box from "@mui/material/Box";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import { useNavigate } from "@tanstack/react-router";
import { EmptyState } from "@/components/ui/common/EmptyState";
import { useI18n } from "@/contexts/I18nContext";
import type { UrgentTicket } from "@/domains/dashboard/types";
import { CardLink } from "@/features/dashboard/pages/DashboardPage/components/CardLink";
import { DashboardCard } from "@/features/dashboard/pages/DashboardPage/components/DashboardCard";
import { typeLabelKeys } from "@/features/tickets/pages/TicketDetailPage/helpers";
import { UrgentTicketRow } from "@/features/dashboard/pages/DashboardPage/components/UrgentTicketRow";

interface Props {
  tickets: UrgentTicket[];
}

export const UrgentTicketsCard: React.FC<Props> = ({ tickets }) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const summary = [
    ...tickets
      .reduce(
        (counts, ticket) =>
          counts.set(ticket.type, (counts.get(ticket.type) ?? 0) + 1),
        new Map<string, number>(),
      )
      .entries(),
  ]
    .map(([type, count]) => {
      const labelKey = typeLabelKeys[type];
      return `${count} ${labelKey ? t(labelKey) : type}`;
    })
    .join(" · ");

  return (
    <DashboardCard
      title={t("dashboard.tickets.title")}
      subtitle={summary || undefined}
      action={
        <CardLink
          label={t("dashboard.tickets.see_all")}
          onClick={() => navigate({ to: "/tickets" })}
        />
      }
    >
      {tickets.length === 0 ? (
        <EmptyState
          icon={ConfirmationNumberOutlined}
          title={t("dashboard.tickets.empty_title")}
          subtitle={t("dashboard.tickets.empty_subtitle")}
          sx={{ flex: 1 }}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {tickets.map((ticket) => (
            <UrgentTicketRow key={ticket.id} ticket={ticket} />
          ))}
        </Box>
      )}
    </DashboardCard>
  );
};
