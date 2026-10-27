import type React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import BlockOutlined from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import { formatRelativeToNow } from "@/formatters/date";
import { RowActions } from "@/components/ui/common/table/RowActions";
import { useI18n } from "@/contexts/I18nContext";
import type { User } from "@/domains/users/types";
import { UserAccessStatus, UserRole } from "@/enums";
import { TEXT_ELLIPSIS_SX } from "@/constants/display";

interface Props {
  member: User;
  roleLabels: Record<string, string>;
  isCurrentUser: boolean;
  busy: boolean;
  onToggleAccessStatus: (member: User) => void;
  onRoleChange: (member: User, role: string) => void;
}

export const MemberRow: React.FC<Props> = ({
  member,
  roleLabels,
  isCurrentUser,
  busy,
  onToggleAccessStatus,
  onRoleChange,
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
      <Box component="td" sx={{ px: "16px", py: "8px" }}>
        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              fontWeight: 600,
              color: "var(--text)",
              lineHeight: 1.3,
              ...TEXT_ELLIPSIS_SX,
            }}
          >
            {member.firstName} {member.lastName}
          </Box>
          <Box
            sx={{
              color: "var(--muted2)",
              fontSize: "11px",
              ...TEXT_ELLIPSIS_SX,
            }}
          >
            {member.email}
          </Box>
        </Box>
      </Box>
      <Box component="td" sx={{ px: "16px", py: "6px" }}>
        {isCurrentUser ? (
          <Box sx={{ color: "var(--text)", lineHeight: 1.3 }}>
            {roleLabels[member.role] ?? member.role}
          </Box>
        ) : (
          <TextField
            select
            size="small"
            fullWidth
            value={member.role}
            onChange={(e) => onRoleChange(member, e.target.value)}
            disabled={busy}
            slotProps={{
              htmlInput: { "aria-label": t("settings.members.col_role") },
            }}
            sx={{ "& .MuiSelect-select": { fontSize: "12px", py: "4px" } }}
          >
            {Object.values(UserRole).map((role) => (
              <MenuItem key={role} value={role} sx={{ fontSize: "12px" }}>
                {roleLabels[role] ?? role}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>
      <Box component="td" sx={{ px: "16px", py: "8px" }}>
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
          py: "8px",
          color: "var(--muted2)",
          fontSize: "11px",
        }}
      >
        {member.lastLoginAt
          ? formatRelativeToNow(member.lastLoginAt, culture)
          : "—"}
      </Box>
      <Box component="td" sx={{ px: "16px", py: "8px", textAlign: "center" }}>
        {!isCurrentUser &&
          (busy ? (
            <CircularProgress size={13} />
          ) : (
            <RowActions
              actions={[
                {
                  icon: isActive ? (
                    <BlockOutlined sx={{ fontSize: 15 }} />
                  ) : (
                    <CheckCircleOutlineOutlined sx={{ fontSize: 15 }} />
                  ),
                  label: isActive
                    ? t("settings.members.suspend")
                    : t("settings.members.reactivate"),
                  onClick: () => onToggleAccessStatus(member),
                  color: isActive ? "red" : "green",
                },
              ]}
            />
          ))}
      </Box>
    </Box>
  );
};
