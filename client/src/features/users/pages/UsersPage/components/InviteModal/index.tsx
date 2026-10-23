import type React from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import { AppModal } from "@/components/ui/common/AppModal";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/contexts/I18nContext";
import { useInviteUserMutation } from "@/domains/users/mutations";
import { UserRole } from "@/enums";
import { inp } from "@/features/settings/pages/SettingsPage/helpers";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import {
  inviteUserSchema,
  type InviteUserFormValues,
} from "@/features/users/pages/UsersPage/components/InviteModal/schemas";
import { resolveFieldError } from "@/helpers/validation/resolveFieldError";

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
        <>
          <Button
            variant="contained"
            size="small"
            color="inherit"
            onClick={handleClose}
          >
            {t("settings.invite.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            type="submit"
            form={formId}
            disabled={submitting}
          >
            {submitting
              ? t("settings.invite.sending")
              : t("settings.invite.send")}
          </Button>
        </>
      }
    >
      <Box
        component="form"
        id={formId}
        onSubmit={handleInvite}
        noValidate
        sx={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Box>
            <Box
              component="label"
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--muted2)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                display: "block",
                mb: "7px",
              }}
            >
              {t("settings.invite.email_label")}{" "}
              <Box component="span" sx={{ color: "var(--red)" }}>
                *
              </Box>
            </Box>
            <Box
              component="input"
              type="email"
              sx={{ ...inp, py: "9px", px: "12px", fontSize: "13px" }}
              placeholder={t("settings.invite.email_placeholder")}
              {...register("email")}
            />
            {errors.email && (
              <Box sx={{ mt: "6px", fontSize: "11.5px", color: "var(--red)" }}>
                {resolveFieldError(errors.email, t)}
              </Box>
            )}
          </Box>

          <Box>
            <Box
              component="label"
              sx={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--muted2)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                display: "block",
                mb: "7px",
              }}
            >
              {t("settings.invite.role_label")}
            </Box>
            <Box sx={{ position: "relative" }}>
              <Box
                component="select"
                sx={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  background: "var(--s2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-sm)",
                  px: "12px",
                  py: "9px",
                  pr: "36px",
                  fontSize: "13px",
                  color: "var(--text)",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  "&:focus": {
                    borderColor: "var(--accent-border)",
                    boxShadow: "0 0 0 3px var(--accent-subtle)",
                  },
                }}
                {...register("role")}
              >
                <option value={UserRole.Admin}>
                  {t("settings.role.admin")}
                </option>
                <option value={UserRole.Developer}>
                  {t("settings.role.developer")}
                </option>
              </Box>
              <KeyboardArrowDownOutlined
                sx={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 16,
                  color: "var(--muted)",
                  pointerEvents: "none",
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </AppModal>
  );
};
