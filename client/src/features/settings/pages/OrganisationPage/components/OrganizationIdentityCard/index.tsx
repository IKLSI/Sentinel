import type React from "react";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { useToast } from "@/hooks/useToast";
import { CardHeader } from "@/components/ui/common/CardHeader";
import { LoadingRegion } from "@/components/ui/common/feedback/LoadingRegion";
import { FormSelectField } from "@/components/ui/forms/FormSelectField";
import { FormTextField } from "@/components/ui/forms/FormTextField";
import { useT } from "@/contexts/I18nContext";
import type { VulnerabilitySeverity } from "@/enums";
import { useUpdateOrganizationSettingsMutation } from "@/domains/settings/mutations";
import { useOrganizationSettingsQuery } from "@/domains/settings/queries";
import { CARD_SX } from "@/helpers/cardSx";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useWarnFirstError } from "@/features/settings/pages/OrganisationPage/hooks";
import {
  type OrganizationFormValues,
  organizationSchema,
} from "@/features/settings/pages/OrganisationPage/schemas";

const SEVERITY_VALUES = ["Critical", "High", "Medium", "Low"] as const;

const ALERTS_DISABLED_VALUE = "None";

const ORGANIZATION_FIELD_SKELETONS = ["name", "severity"];

const ORGANIZATION_FIELDS_SX = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
  px: "16px",
  py: "12px",
} as const;

const ORGANIZATION_FOOTER_SX = {
  px: "16px",
  py: "10px",
  display: "flex",
  justifyContent: "flex-end",
} as const;

const DEFAULT_ORGANIZATION_FORM: OrganizationFormValues = {
  name: "",
  securityAlertsEnabled: true,
  alertMinSeverity: "High",
};

export const OrganizationIdentityCard: React.FC = () => {
  const { showToast } = useToast();
  const t = useT();
  const fieldId = useId();
  const onOrgUpdateError = useApiErrorToast("settings.toast.org_update_error");
  const warnFirstError = useWarnFirstError();

  const severities = [ALERTS_DISABLED_VALUE, ...SEVERITY_VALUES].map(
    (value) => ({ value, label: t(`settings.severity.${value}`) }),
  );

  const organizationQuery = useOrganizationSettingsQuery();
  const org = organizationQuery.data ?? null;
  const updateOrg = useUpdateOrganizationSettingsMutation();
  const savingOrg = updateOrg.isPending;

  const orgForm = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: DEFAULT_ORGANIZATION_FORM,
  });
  const resetOrgForm = orgForm.reset;

  useEffect(() => {
    if (!org) return;
    resetOrgForm(
      {
        name: org.name,
        securityAlertsEnabled: org.securityAlertsEnabled,
        alertMinSeverity: org.alertMinSeverity,
      },
      { keepDirtyValues: true },
    );
  }, [org, resetOrgForm]);

  const handleSaveOrg = orgForm.handleSubmit((values) => {
    updateOrg.mutate(
      {
        data: {
          name: values.name,
          securityAlertsEnabled: values.securityAlertsEnabled,
          alertMinSeverity: values.alertMinSeverity as VulnerabilitySeverity,
        },
      },
      {
        onSuccess: () => showToast(t("settings.toast.org_updated"), "success"),
        onError: onOrgUpdateError,
      },
    );
  }, warnFirstError);

  const securityAlertsEnabled = orgForm.watch("securityAlertsEnabled");
  const alertMinSeverity = orgForm.watch("alertMinSeverity");

  const handleSeverityChange = (value: string) => {
    const enabled = value !== ALERTS_DISABLED_VALUE;
    orgForm.setValue("securityAlertsEnabled", enabled, { shouldDirty: true });
    if (enabled)
      orgForm.setValue("alertMinSeverity", value, { shouldDirty: true });
  };

  return (
    <Box sx={CARD_SX}>
      <CardHeader label={t("settings.org.identity")} />
      {organizationQuery.isLoading ? (
        <LoadingRegion label={t("settings.org.loading")}>
          <Box sx={ORGANIZATION_FIELDS_SX}>
            {ORGANIZATION_FIELD_SKELETONS.map((field) => (
              <Box
                key={field}
                sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <Skeleton variant="rounded" width={140} height={12} />
                <Skeleton variant="rounded" height={38} />
              </Box>
            ))}
          </Box>
          <Box sx={ORGANIZATION_FOOTER_SX}>
            <Skeleton variant="rounded" width={110} height={30} />
          </Box>
        </LoadingRegion>
      ) : (
        <>
          <Box sx={ORGANIZATION_FIELDS_SX}>
            <FormTextField
              id={`${fieldId}-name`}
              label={t("settings.org.name_label")}
              registration={orgForm.register("name")}
            />
            <FormSelectField
              id={`${fieldId}-severity`}
              label={t("settings.org.alert_min_severity_label")}
              value={
                securityAlertsEnabled ? alertMinSeverity : ALERTS_DISABLED_VALUE
              }
              onValueChange={handleSeverityChange}
            >
              {severities.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </FormSelectField>
          </Box>

          <Box sx={ORGANIZATION_FOOTER_SX}>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveOrg}
              disabled={savingOrg || !orgForm.formState.isDirty}
              sx={{ minWidth: "110px" }}
            >
              {savingOrg ? t("settings.org.saving") : t("settings.org.save")}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};
