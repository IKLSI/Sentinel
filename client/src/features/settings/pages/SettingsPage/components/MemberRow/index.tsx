import type React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import BlockOutlined from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import { formatRelativeToNow } from "@/formatters/date";
import { RowActions } from "@/components/ui/common/RowActions";
import { useI18n } from "@/contexts/I18nContext";
import type { User } from "@/domains/users/types";
import { UserAccessStatus } from "@/enums";

interface Props {
  member: User;
  roleLabel: string;
  isCurrentUser: boolean;
  toggling: boolean;
  onToggleAccessStatus: (memberId: string, currentStatus: string) => void;
}

export const MemberRow: React.FC<Props> = ({
  member,
  roleLabel,
  isCurrentUser,
  toggling,
  onToggleAccessStatus,
}) => {
  const { t, culture } = useI18n();
  const isActive = member.accessStatus === UserAccessStatus.Active;

  return (
    <Box
      component="tr"
      sx={{
        borderBottom: "1px solid var(--border)",
        "&:last-child": { borderBottom: "none" },
        "&:hover": { background: "var(--s2)" },
        "&:hover .row-actions": { opacity: "1 !important" },
        transition: "background 0.1s",
      }}
    >
      <Box component="td" sx={{ px: "16px", py: "10px" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                fontWeight: 600,
                color: "var(--text)",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {member.firstName} {member.lastName}
            </Box>
            <Box
              sx={{
                color: "var(--muted2)",
                fontSize: "11px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {member.email}
            </Box>
          </Box>
        </Box>
      </Box>
      <Box component="td" sx={{ px: "16px", py: "10px" }}>
        <Box
          sx={{
            fontWeight: 400,
            color: "var(--text)",
            lineHeight: 1.3,
          }}
        >
          {roleLabel}
        </Box>
      </Box>
      <Box component="td" sx={{ px: "16px", py: "10px" }}>
        <Box
          sx={{
            fontWeight: 400,
            color: "var(--text)",
            lineHeight: 1.3,
          }}
        >
          {isActive
            ? t("settings.members.status_active")
            : t("settings.members.status_suspended")}
        </Box>
      </Box>
      <Box
        component="td"
        sx={{
          px: "16px",
          py: "10px",
          color: "var(--muted2)",
          fontSize: "11px",
        }}
      >
        {member.lastLoginAt
          ? formatRelativeToNow(member.lastLoginAt, culture)
          : "—"}
      </Box>
      <Box component="td" sx={{ px: "16px", py: "10px", textAlign: "center" }}>
        {!isCurrentUser &&
          (toggling ? (
            <CircularProgress size={13} />
          ) : (
            <RowActions
              actions={[
                {
                  icon: isActive ? (
                    <BlockOutlined sx={{ fontSize: 13 }} />
                  ) : (
                    <CheckCircleOutlineOutlined sx={{ fontSize: 13 }} />
                  ),
                  label: isActive
                    ? t("settings.members.suspend")
                    : t("settings.members.reactivate"),
                  onClick: () =>
                    onToggleAccessStatus(member.id, member.accessStatus),
                  color: isActive ? "red" : "green",
                },
              ]}
            />
          ))}
      </Box>
    </Box>
  );
};
