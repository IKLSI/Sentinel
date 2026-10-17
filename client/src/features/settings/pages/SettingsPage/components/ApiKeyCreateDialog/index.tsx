import type React from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { AppModal } from "@/components/ui/common/AppModal";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useCreateApiKeyMutation } from "@/domains/apiKeys/mutations";
import type { CreatedApiKey } from "@/domains/apiKeys/types";
import {
  FieldLabel,
  inp,
} from "@/features/settings/pages/SettingsPage/helpers";
import {
  createApiKeySchema,
  type CreateApiKeyFormValues,
} from "@/features/settings/pages/SettingsPage/components/ApiKeyCreateDialog/schemas";

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
    defaultValues: { name: "", expiresAt: "" },
  });

  const handleCreate = handleFormSubmit((data) => {
    createKeyMutation.mutate(
      { data: { name: data.name.trim(), expiresAt: data.expiresAt || null } },
      {
        onSuccess: (created) => {
          reset({ name: "", expiresAt: "" });
          onCreated(created);
        },
        onError: onCreateError,
      },
    );
  });

  const handleClose = () => {
    onClose();
    reset({ name: "", expiresAt: "" });
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
            className="btn-cancel"
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
        <Box>
          <FieldLabel>{t("settings.api_keys.modal_name_label")}</FieldLabel>
          <Box
            component="input"
            autoFocus
            placeholder={t("settings.api_keys.modal_name_placeholder")}
            sx={inp}
            {...register("name")}
          />
        </Box>
        <Box>
          <FieldLabel>{t("settings.api_keys.modal_expires_label")}</FieldLabel>
          <Box
            component="input"
            type="date"
            min={new Date().toISOString().split("T")[0]}
            sx={{ ...inp, colorScheme: "dark" }}
            {...register("expiresAt")}
          />
        </Box>
      </Box>
    </AppModal>
  );
};
