import type React from "react";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import { AppModal } from "@/components/ui/common/modal/AppModal";
import { ModalActions } from "@/components/ui/common/modal/ModalActions";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { useT } from "@/contexts/I18nContext";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useCreateApiKeyMutation } from "@/domains/apiKeys/mutations";
import type { CreatedApiKey } from "@/domains/apiKeys/types";
import { toLocalIsoDate } from "@/formatters/date";
import { z } from "zod";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (created: CreatedApiKey) => void;
}

const API_KEY_MAX_LIFETIME_DAYS = 365;
const API_KEY_DEFAULT_LIFETIME_DAYS = 90;

const isoDateInDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toLocalIsoDate(date);
};

const minExpirationDate = (): string => isoDateInDays(1);

const maxExpirationDate = (): string =>
  isoDateInDays(API_KEY_MAX_LIFETIME_DAYS - 1);

const defaultExpirationDate = (): string =>
  isoDateInDays(API_KEY_DEFAULT_LIFETIME_DAYS);

const createApiKeySchema = z.object({
  name: z.string().trim().min(1),
  expiresAt: z.string().min(1),
});
type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>;

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
        <ModalActions
          onCancel={handleClose}
          cancelLabel={t("settings.api_keys.modal_cancel")}
          confirmLabel={t("settings.api_keys.modal_create")}
          pendingLabel={t("settings.api_keys.modal_creating")}
          pending={creating}
          disabled={!isValid}
          formId={formId}
        />
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
