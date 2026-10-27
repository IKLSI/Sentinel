import type React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import BoltOutlined from "@mui/icons-material/BoltOutlined";
import BugReportOutlined from "@mui/icons-material/BugReportOutlined";
import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import PersonOffOutlined from "@mui/icons-material/PersonOffOutlined";
import SecurityOutlined from "@mui/icons-material/SecurityOutlined";
import { useNavigate } from "@tanstack/react-router";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";
import { PRIORITY_TONES } from "@/constants/severities";
import { useI18n } from "@/contexts/I18nContext";
import type { UrgentTicket } from "@/domains/dashboard/types";
import { CardLink } from "@/features/dashboard/pages/DashboardPage/components/CardLink";
import { DashboardCard } from "@/features/dashboard/pages/DashboardPage/components/DashboardCard";
import {
  DASHBOARD_ROW_SUBTITLE_SX,
  DASHBOARD_ROW_SX,
  DASHBOARD_ROW_TITLE_SX,
} from "@/features/dashboard/pages/DashboardPage/constants";

interface Props {
  tickets: UrgentTicket[];
}

const TYPE_ICONS = {
  security: { Icon: SecurityOutlined, color: "var(--red)" },
  performance: { Icon: BoltOutlined, color: "var(--yellow)" },
} as const;

const DEFAULT_TYPE_ICON = { Icon: BugReportOutlined, color: "var(--muted2)" };

const INITIALS_LENGTH = 2;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, INITIALS_LENGTH)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const avatarSx = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
} as const;

export const UrgentTicketsCard: React.FC<Props> = ({ tickets }) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <DashboardCard
      title={t("dashboard.tickets.title")}
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {tickets.map((ticket) => {
            const { Icon, color: iconColor } =
              TYPE_ICONS[ticket.type as keyof typeof TYPE_ICONS] ??
              DEFAULT_TYPE_ICON;

            return (
              <ButtonBase
                key={ticket.id}
                onClick={() =>
                  navigate({ to: "/tickets/$id", params: { id: ticket.id } })
                }
                sx={{
                  ...DASHBOARD_ROW_SX,
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Icon sx={{ fontSize: 16, color: iconColor, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                  <Box
                    sx={{
                      ...DASHBOARD_ROW_TITLE_SX,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      minWidth: 0,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Box component="span" sx={{ flexShrink: 0 }}>
                      {ticket.reference}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        flexShrink: 0,
                        textTransform: "uppercase",
                        color: PRIORITY_TONES[ticket.priority],
                      }}
                    >
                      • {t(`dashboard.tickets.priority.${ticket.priority}`)}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      ...DASHBOARD_ROW_SUBTITLE_SX,
                      ...TEXT_ELLIPSIS_SX,
                    }}
                    title={ticket.title}
                  >
                    {ticket.projectName ?? ticket.title}
                  </Box>
                </Box>
                <AppTooltip
                  title={
                    ticket.assignedToName ?? t("dashboard.tickets.unassigned")
                  }
                >
                  {ticket.assignedToName ? (
                    <Box
                      sx={{
                        ...avatarSx,
                        background: "var(--accent-subtle)",
                        color: "var(--accent)",
                        fontWeight: 700,
                        fontSize: "10px",
                      }}
                    >
                      {initials(ticket.assignedToName)}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        ...avatarSx,
                        border: "1.5px dashed var(--border2)",
                        color: "var(--muted2)",
                      }}
                    >
                      <PersonOffOutlined sx={{ fontSize: 14 }} />
                    </Box>
                  )}
                </AppTooltip>
              </ButtonBase>
            );
          })}
        </Box>
      )}
    </DashboardCard>
  );
};
