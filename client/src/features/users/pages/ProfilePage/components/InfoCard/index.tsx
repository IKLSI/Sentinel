import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useUpdateMyProfileMutation } from "@/domains/users/mutations";
import { useApiErrorToast } from "@/hooks/useApiErrorToast";
import { useT } from "@/contexts/I18nContext";
import type { UserRole } from "@/enums";
import {
  CARD_SX,
  inp,
  inpRo,
  ROLE_LABEL_KEYS,
} from "@/features/users/pages/ProfilePage/constants";
import { InnerDivider } from "@/features/users/pages/ProfilePage/components/InnerDivider";

export const InfoCard: React.FC = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const t = useT();
  const onUpdateError = useApiErrorToast("profile.toast.update_error");

  const [pf, setPf] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });

  const updateProfile = useUpdateMyProfileMutation();
  const savingPf = updateProfile.isPending;

  const pfUnchanged =
    pf.firstName === user?.firstName && pf.lastName === user?.lastName;

  const handleSave = () => {
    if (pfUnchanged) return;
    if (!pf.firstName.trim() || !pf.lastName.trim()) {
      showToast(t("profile.toast.name_required"), "warning");
      return;
    }
    updateProfile.mutate(
      { data: pf },
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
    );
  };

  return (
    <Box sx={CARD_SX}>
      <InnerDivider label={t("profile.section.info")} />

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
        <Box>
          <Box
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text)",
              mb: "5px",
            }}
          >
            {t("profile.field.first_name")}
          </Box>
          <Box
            component="input"
            type="text"
            sx={inp}
            value={pf.firstName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPf((f) => ({ ...f, firstName: e.target.value }))
            }
          />
        </Box>
        <Box>
          <Box
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text)",
              mb: "5px",
            }}
          >
            {t("profile.field.last_name")}
          </Box>
          <Box
            component="input"
            type="text"
            sx={inp}
            value={pf.lastName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPf((f) => ({ ...f, lastName: e.target.value }))
            }
          />
        </Box>
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
        <Box>
          <Box
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text)",
              mb: "5px",
            }}
          >
            {t("profile.field.email")}
          </Box>
          <Box
            component="input"
            type="email"
            sx={inpRo}
            value={user?.email ?? ""}
            readOnly
          />
        </Box>
        <Box>
          <Box
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text)",
              mb: "5px",
            }}
          >
            {t("profile.field.role")}
          </Box>
          <Box
            component="input"
            type="text"
            sx={inpRo}
            value={
              user?.role && ROLE_LABEL_KEYS[user.role as UserRole]
                ? t(ROLE_LABEL_KEYS[user.role as UserRole])
                : (user?.role ?? "")
            }
            readOnly
          />
        </Box>
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
          disabled={savingPf || pfUnchanged}
          sx={{ minWidth: "110px" }}
        >
          {savingPf ? t("profile.button.saving") : t("profile.button.save")}
        </Button>
      </Box>
    </Box>
  );
};
