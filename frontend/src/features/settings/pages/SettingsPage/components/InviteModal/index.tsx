import type React from "react";
import { useId, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import { AppModal } from "@/components/AppModal";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/I18nContext";
import { useInviteUser } from "@/features/users/hooks/useUsers";
import { UserRole } from "@/types/enums";
import { inp } from "../../helpers";
import { extractApiError } from "@/utils/apiError";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<Props> = ({ open, onClose }) => {
  const { showToast } = useToast();
  const t = useT();
  const formId = useId();

  const [inv, setInv] = useState<{ email: string; role: UserRole }>({
    email: "",
    role: UserRole.Developer,
  });
  const inviteMutation = useInviteUser();
  const submitting = inviteMutation.isPending;

  const handleClose = () => {
    onClose();
    setInv({ email: "", role: UserRole.Developer as UserRole });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inv.email) {
      showToast(t("settings.toast.required_fields"), "warning");
      return;
    }
    inviteMutation.mutate(inv, {
      onSuccess: () => {
        showToast(t("settings.toast.invite_sent"), "success");
        handleClose();
      },
      onError: (err) =>
        showToast(
          extractApiError(err, t("settings.toast.invite_error")),
          "error",
        ),
    });
  };

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
            className="btn-cancel"
            onClick={handleClose}
          >
            {t("settings.invite.cancel")}
          </Button>
          <Button
            variant="contained"
            size="small"
            type="submit"
            form={formId}
            disabled={submitting || !inv.email.trim()}
            sx={{
              textTransform: "none",
              background:
                "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)",
              boxShadow: "none",
              "&:hover": {
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)",
                boxShadow: "none",
                transform: "none",
              },
            }}
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
        sx={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            p: "16px",
            borderRadius: "var(--r-md)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 9%, transparent) 0%, color-mix(in srgb, var(--accent) 3%, transparent) 100%)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "var(--r-md)",
              flexShrink: 0,
              background:
                "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 60%, white) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px var(--accent-border)",
            }}
          >
            <EmailOutlined sx={{ fontSize: 20, color: "var(--s1)" }} />
          </Box>
          <Box>
            <Box
              sx={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.02em",
                mb: "3px",
              }}
            >
              {t("settings.invite.banner_title")}
            </Box>
            <Box
              sx={{
                fontSize: "12px",
                color: "var(--muted2)",
                lineHeight: 1.55,
              }}
            >
              {t("settings.invite.banner_line1")}
              <br />
              {t("settings.invite.banner_line2")}
            </Box>
          </Box>
        </Box>

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
              value={inv.email}
              placeholder={t("settings.invite.email_placeholder")}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInv((f) => ({ ...f, email: e.target.value }))
              }
            />
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
                value={inv.role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setInv((f) => ({ ...f, role: e.target.value as UserRole }))
                }
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
