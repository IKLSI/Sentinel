import type React from "react";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { AppModal } from "@/components/ui/common/AppModal";
import { useT } from "@/contexts/I18nContext";
import { useSuppressVulnerabilityMutation } from "@/domains/projects/mutations";
import { SuppressionReason } from "@/enums";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import {
  JUSTIFICATION_MAX_LENGTH,
  type SuppressionFormValues,
  suppressionSchema,
} from "@/features/techHealth/pages/ProjectDetailPage/components/SuppressionModal/schemas";

interface Props {
  open: boolean;
  projectId: string;
  findingKey: string;
  vulnerabilityLabel: string;
  onClose: () => void;
}

const DEFAULT_VALUES: SuppressionFormValues = {
  reason: SuppressionReason.NotAffected,
  justification: "",
  expiresAt: "",
};

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

export const SuppressionModal: React.FC<Props> = ({
  open,
  projectId,
  findingKey,
  vulnerabilityLabel,
  onClose,
}) => {
  const t = useT();
  const formId = useId();
  const suppressMutation = useSuppressVulnerabilityMutation();
  const onSuppressError = useApiErrorToast("tech_health.suppression.error");

  const {
    control,
    register,
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
          justification: values.justification.trim(),
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
        <>
          <Button
            variant="contained"
            size="small"
            className="btn-cancel"
            onClick={handleClose}
            disabled={suppressMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            type="submit"
            form={formId}
            disabled={!isValid || suppressMutation.isPending}
          >
            {t("tech_health.suppression.confirm")}
          </Button>
        </>
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
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={3}
          label={t("tech_health.suppression.justification_label")}
          slotProps={{ htmlInput: { maxLength: JUSTIFICATION_MAX_LENGTH } }}
          {...register("justification")}
        />
        <TextField
          fullWidth
          size="small"
          type="date"
          label={t("tech_health.suppression.expires_label")}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { min: tomorrow() },
          }}
          {...register("expiresAt")}
        />
      </Box>
    </AppModal>
  );
};
