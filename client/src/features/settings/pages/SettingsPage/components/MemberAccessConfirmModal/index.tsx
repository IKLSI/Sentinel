import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { AppModal } from "@/components/ui/common/AppModal";
import { useT } from "@/contexts/I18nContext";
import type { User } from "@/domains/users/types";

export type PendingMemberChange =
  | { kind: "suspend"; member: User }
  | { kind: "role"; member: User; role: string };

interface Props {
  change: PendingMemberChange | null;
  roleLabels: Record<string, string>;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const MemberAccessConfirmModal: React.FC<Props> = ({
  change,
  roleLabels,
  saving,
  onClose,
  onConfirm,
}) => {
  const t = useT();
  const name = change
    ? `${change.member.firstName} ${change.member.lastName}`
    : "";

  return (
    <AppModal
      open={change !== null}
      onClose={() => !saving && onClose()}
      title={
        change?.kind === "role"
          ? t("settings.members.role_confirm_title")
          : t("settings.members.suspend_confirm_title")
      }
      maxWidth="xs"
      actions={
        <>
          <Button
            variant="contained"
            size="small"
            className="btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            color={change?.kind === "suspend" ? "error" : "primary"}
            onClick={onConfirm}
            disabled={saving}
          >
            {saving
              ? t("settings.members.confirming")
              : t("settings.members.confirm")}
          </Button>
        </>
      }
    >
      <Box
        sx={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          lineHeight: 1.65,
        }}
      >
        {change?.kind === "role"
          ? t("settings.members.role_confirm_message", {
              name,
              role: roleLabels[change.role] ?? change.role,
            })
          : t("settings.members.suspend_confirm_message", { name })}
      </Box>
    </AppModal>
  );
};
