import type React from "react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { toLocalIsoDate } from "@/formatters/date";
import { AppModal } from "@/components/ui/common/modal/AppModal";
import { ModalActions } from "@/components/ui/common/modal/ModalActions";
import { useT } from "@/contexts/I18nContext";
import { useSuppressVulnerabilityMutation } from "@/domains/projects/mutations";
import { SuppressionReason } from "@/enums";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import {
  type SuppressionFormValues,
  suppressionSchema,
} from "@/features/projects/schemas";
import { useFindingActions } from "@/features/projects/pages/ProjectDetailPage/findingActions";

interface Props {
  open: boolean;
  findingKey: string;
  vulnerabilityLabel: string;
  onClose: () => void;
}

const DEFAULT_VALUES: SuppressionFormValues = {
  reason: SuppressionReason.NotAffected,
  expiresAt: "",
};

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toLocalIsoDate(date);
};

export const SuppressionModal: React.FC<Props> = ({
  open,
  findingKey,
  vulnerabilityLabel,
  onClose,
}) => {
  const t = useT();
  const { projectId } = useFindingActions();
  const formId = useId();
  const [dateFocused, setDateFocused] = useState(false);
  const suppressMutation = useSuppressVulnerabilityMutation();
  const onSuppressError = useApiErrorToast("tech_health.suppression.error");

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<SuppressionFormValues>({
    resolver: zodResolver(suppressionSchema),
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  const handleClose = () => {
    if (suppressMutation.isPending) return;
    reset(DEFAULT_VALUES);
    onClose();
  };

  const onSubmit = handleSubmit((values) => {
    suppressMutation.mutate(
      {
        id: projectId,
        data: {
          findingKey,
          reason: values.reason,
          expiresAt: values.expiresAt || null,
        },
      },
      {
        onSuccess: () => {
          reset(DEFAULT_VALUES);
          onClose();
        },
        onError: onSuppressError,
      },
    );
  });

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={t("tech_health.suppression.title", {
        reference: vulnerabilityLabel,
      })}
      maxWidth="xs"
      actions={
        <ModalActions
          onCancel={handleClose}
          cancelDisabled={suppressMutation.isPending}
          formId={formId}
          pending={suppressMutation.isPending}
          pendingLabel={t("tech_health.suppression.confirm")}
          disabled={!isValid}
          confirmLabel={t("tech_health.suppression.confirm")}
        />
      }
    >
      <Box
        component="form"
        id={formId}
        onSubmit={onSubmit}
        noValidate
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          pt: "6px",
        }}
      >
        <Controller
          name="reason"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              fullWidth
              size="small"
              label={t("tech_health.suppression.reason_label")}
            >
              {Object.values(SuppressionReason).map((reason) => (
                <MenuItem key={reason} value={reason}>
                  {t(`tech_health.suppression.reason.${reason}`)}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="expiresAt"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              size="small"
              type={field.value || dateFocused ? "date" : "text"}
              label={t("tech_health.suppression.expires_label")}
              onFocus={() => setDateFocused(true)}
              onBlur={() => {
                setDateFocused(false);
                field.onBlur();
              }}
              slotProps={{ htmlInput: { min: tomorrow() } }}
            />
          )}
        />
      </Box>
    </AppModal>
  );
};
