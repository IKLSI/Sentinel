import type React from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useUpdateMyProfileMutation } from "@/domains/users/mutations";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useT } from "@/contexts/I18nContext";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { UserRole } from "@/enums";
import { CARD_SX } from "@/features/users/pages/ProfilePage/constants";
import { CardHeader } from "@/components/ui/common/CardHeader";
import {
  profileInfoSchema,
  type ProfileInfoFormValues,
} from "@/features/users/schemas";

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  [UserRole.Admin]: "profile.role.admin",
  [UserRole.Developer]: "profile.role.developer",
};

export const InfoCard: React.FC = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const t = useT();
  const fieldId = useId();
  const onUpdateError = useApiErrorToast("profile.toast.update_error");

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<ProfileInfoFormValues>({
    resolver: zodResolver(profileInfoSchema),
    values: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
  });

  const updateProfile = useUpdateMyProfileMutation();
  const savingPf = updateProfile.isPending;

  const handleSave = handleSubmit(
    (values) =>
      updateProfile.mutate(
        { data: values },
        {
          onSuccess: (updated) => {
            if (user)
              setUser({
                ...user,
                firstName: updated.firstName,
                lastName: updated.lastName,
              });
            showToast(t("profile.toast.updated"), "success");
          },
          onError: onUpdateError,
        },
      ),
    () => showToast(t("profile.toast.name_required"), "warning"),
  );

  return (
    <Box sx={CARD_SX}>
      <CardHeader label={t("profile.section.info")} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          px: "16px",
          py: "8px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <FormTextField
          id={`${fieldId}-first_name`}
          label={t("profile.field.first_name")}
          registration={register("firstName")}
        />
        <FormTextField
          id={`${fieldId}-last_name`}
          label={t("profile.field.last_name")}
          registration={register("lastName")}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          px: "16px",
          py: "8px",
          pb: "12px",
        }}
      >
        <FormTextField
          id={`${fieldId}-email`}
          label={t("profile.field.email")}
          type="email"
          value={user?.email ?? ""}
          readOnly
        />
        <FormTextField
          id={`${fieldId}-role`}
          label={t("profile.field.role")}
          value={
            user?.role && ROLE_LABEL_KEYS[user.role as UserRole]
              ? t(ROLE_LABEL_KEYS[user.role as UserRole])
              : (user?.role ?? "")
          }
          readOnly
        />
      </Box>

      <Box
        sx={{
          px: "16px",
          py: "8px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          disabled={savingPf || !isDirty}
          sx={{ minWidth: "110px" }}
        >
          {savingPf ? t("profile.button.saving") : t("profile.button.save")}
        </Button>
      </Box>
    </Box>
  );
};
