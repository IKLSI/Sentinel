import type React from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import { AppModal } from "@/components/ui/common/AppModal";
import { ModalActions } from "@/components/ui/common/ModalActions";
import { FormSelectField } from "@/components/ui/forms/FormSelectField";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import { useInviteUserMutation } from "@/domains/users/mutations";
import { UserRole } from "@/enums";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import {
  inviteUserSchema,
  type InviteUserFormValues,
} from "@/features/users/pages/UsersPage/components/InviteModal/schemas";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<Props> = ({ open, onClose }) => {
  const { showToast } = useToast();
  const t = useT();
  const onError = useApiErrorToast("settings.toast.invite_error");
  const formId = useId();

  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", role: UserRole.Developer },
  });
  const inviteMutation = useInviteUserMutation();
  const submitting = inviteMutation.isPending;

  const handleClose = () => {
    onClose();
    reset({ email: "", role: UserRole.Developer });
  };

  const handleInvite = handleFormSubmit((data) => {
    inviteMutation.mutate(
      { data },
      {
        onSuccess: () => {
          showToast(t("settings.toast.invite_sent"), "success");
          handleClose();
        },
        onError,
      },
    );
  });

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={t("settings.invite.title")}
      actions={
        <ModalActions
          onCancel={handleClose}
          cancelLabel={t("settings.invite.cancel")}
          confirmLabel={t("settings.invite.send")}
          pendingLabel={t("settings.invite.sending")}
          pending={submitting}
          formId={formId}
        />
      }
    >
      <Box
        component="form"
        id={formId}
        onSubmit={handleInvite}
        noValidate
        sx={{ display: "flex", flexDirection: "column", gap: "14px" }}
      >
        <FormTextField
          id={`${formId}-email`}
          label={t("settings.invite.email_label")}
          registration={register("email")}
          error={errors.email}
          t={t}
          type="email"
          placeholder={t("settings.invite.email_placeholder")}
          required
        />

        <FormSelectField
          id={`${formId}-role`}
          label={t("settings.invite.role_label")}
          registration={register("role")}
        >
          <option value={UserRole.Admin}>{t("settings.role.admin")}</option>
          <option value={UserRole.Developer}>
            {t("settings.role.developer")}
          </option>
        </FormSelectField>
      </Box>
    </AppModal>
  );
};
