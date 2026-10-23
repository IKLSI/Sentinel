import type React from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { AppModal } from "@/components/ui/common/AppModal";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useCreateApiKeyMutation } from "@/domains/apiKeys/mutations";
import type { CreatedApiKey } from "@/domains/apiKeys/types";
import {
  createApiKeySchema,
  type CreateApiKeyFormValues,
} from "@/features/settings/pages/SettingsPage/components/ApiKeyCreateDialog/schemas";
import {
  defaultExpirationDate,
  maxExpirationDate,
  minExpirationDate,
} from "@/features/settings/pages/SettingsPage/components/ApiKeyCreateDialog/helpers";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (created: CreatedApiKey) => void;
}

export const ApiKeyCreateDialog: React.FC<Props> = ({
  open,
  onClose,
  onCreated,
}) => {
  const t = useT();
  const onCreateError = useApiErrorToast("settings.api_keys.create_error");
  const formId = useId();

  const createKeyMutation = useCreateApiKeyMutation();
  const creating = createKeyMutation.isPending;

  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    formState: { isValid },
  } = useForm<CreateApiKeyFormValues>({
    resolver: zodResolver(createApiKeySchema),
    mode: "onChange",
    defaultValues: { name: "", expiresAt: defaultExpirationDate() },
  });

  const handleCreate = handleFormSubmit((data) => {
    createKeyMutation.mutate(
      { data: { name: data.name.trim(), expiresAt: data.expiresAt } },
      {
        onSuccess: (created) => {
          reset({ name: "", expiresAt: defaultExpirationDate() });
          onCreated(created);
        },
        onError: onCreateError,
      },
    );
  });

  const handleClose = () => {
    onClose();
    reset({ name: "", expiresAt: defaultExpirationDate() });
  };

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={t("settings.api_keys.modal_title")}
      maxWidth="xs"
      actions={
        <>
          <Button
            variant="contained"
            size="small"
            color="inherit"
            onClick={handleClose}
          >
            {t("settings.api_keys.modal_cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            type="submit"
            form={formId}
            disabled={creating || !isValid}
          >
            {creating
              ? t("settings.api_keys.modal_creating")
              : t("settings.api_keys.modal_create")}
          </Button>
        </>
      }
    >
      <Box
        component="form"
        id={formId}
        onSubmit={handleCreate}
        noValidate
        sx={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <FormTextField
          id={`${formId}-name`}
          label={t("settings.api_keys.modal_name_label")}
          registration={register("name")}
          placeholder={t("settings.api_keys.modal_name_placeholder")}
          autoFocus
        />
        <FormTextField
          id={`${formId}-expires`}
          label={t("settings.api_keys.modal_expires_label")}
          registration={register("expiresAt")}
          type="date"
          required
          inputProps={{ min: minExpirationDate(), max: maxExpirationDate() }}
        />
      </Box>
    </AppModal>
  );
};
