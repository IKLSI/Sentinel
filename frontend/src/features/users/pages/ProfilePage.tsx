import React, { useState } from "react";
import { version } from "../../../../package.json";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useAuth } from "../../auth/hooks/useAuth";
import { useTheme } from "../../../store/ThemeContext";
import { useToast } from "../../../hooks/useToast";
import { updateMyProfile, updatePreferences, exportMyGdprData, deleteMyAccount } from "../api/users";
import { extractApiError } from "@/utils/apiError";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import TranslateOutlined from "@mui/icons-material/TranslateOutlined";
import { AppModal } from "@/components/AppModal";
import { useT, useI18n } from "../../../i18n/I18nContext";
import { Theme, Language, UserRole } from "../../../types/enums";
import { STORAGE_KEYS } from "@/constants/storage";
import { ROUTES } from "@/constants/routes";

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  [UserRole.Admin]: "profile.role.admin",
  [UserRole.Developer]: "profile.role.developer",
};

const inp = {
  width: "100%",
  display: "block",
  boxSizing: "border-box",
  background: "var(--s2)",
  border: "1px solid var(--border)",
  borderRadius: 'var(--r-sm)',
  padding: "6px 10px",
  fontSize: "12px",
  color: "var(--text)",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
} as const;

const inpRo = { ...inp, color: "var(--muted2)", cursor: "default" } as const;

const CARD_SX = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: 'var(--r-md)',
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
} as const;

function InnerDivider({ label }: { label: string }) {
  return (
    <Box
      sx={{
        px: "16px",
        minHeight: "44px",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid var(--border)",
        background: "var(--s2)",
      }}
    >
      <Box
        sx={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const t = useT();
  const { culture, setLanguage } = useI18n();

  const [pf, setPf] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });
  const [savingPf, setSavingPf] = useState(false);
  const [exportingGdpr, setExportingGdpr] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const pfUnchanged =
    pf.firstName === user?.firstName && pf.lastName === user?.lastName;

  const handleSave = async () => {
    if (pfUnchanged) return;
    if (!pf.firstName.trim() || !pf.lastName.trim()) {
      showToast(t("profile.toast.name_required"), "warning");
      return;
    }
    setSavingPf(true);
    try {
      const updated = await updateMyProfile(pf);
      setUser({ ...user!, ...updated });
      showToast(t("profile.toast.updated"), "success");
    } catch (err) {
      showToast(extractApiError(err, t("profile.toast.update_error")), "error");
    } finally {
      setSavingPf(false);
    }
  };

  const handleThemeToggle = (mode: Theme) => {
    if (theme === mode) return;
    toggleTheme();
    updatePreferences({ theme: mode }).catch(() => {});
  };

  const handleExportGdpr = async () => {
    setExportingGdpr(true);
    try {
      const data = await exportMyGdprData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sentinel-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(extractApiError(err, t("profile.gdpr.export_error")), "error");
    } finally {
      setExportingGdpr(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) return;
    setDeletingAccount(true);
    try {
      await deleteMyAccount(deletePassword);
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
      window.location.href = "/login";
    } catch (err) {
      showToast(extractApiError(err, t("profile.gdpr.delete_error")), "error");
      setDeletingAccount(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    if (culture === lang) return;
    setLanguage(lang);
    setUser({ ...user!, language: lang });
    updatePreferences({ language: lang }).catch(() => {});
  };

  return (
    <Box
      className="page-enter"
      sx={{
        p: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Box sx={CARD_SX}>
        <InnerDivider label={t("profile.section.info")} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            px: "16px",
            py: "9px",
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
            py: "9px",
            pb: "16px",
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
                user?.role && ROLE_LABEL_KEYS[user.role]
                  ? t(ROLE_LABEL_KEYS[user.role])
                  : (user?.role ?? "")
              }
              readOnly
            />
          </Box>
        </Box>

        <Box
          sx={{
            px: "16px",
            py: "10px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            disabled={savingPf || pfUnchanged}
            sx={{ minWidth: "110px", background: "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 92%, white) 100%)", boxShadow: "none", "&:hover": { background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 85%, black) 0%, var(--accent) 100%)", boxShadow: "none", transform: "none" } }}
          >
            {savingPf ? t("profile.button.saving") : t("profile.button.save")}
          </Button>
        </Box>
      </Box>

      <Box sx={CARD_SX}>
        <InnerDivider label={t("profile.section.preferences")} />

        <Box sx={{ px: "16px", py: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Langue */}
          <Box>
            <Box sx={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", mb: "8px" }}>
              {t("profile.field.language")}
            </Box>
            <Box sx={{ display: "flex", gap: "8px" }}>
              {([
                { code: Language.Fr, flag: "🇫🇷", label: t("profile.language.fr"), bg: "linear-gradient(150deg,var(--flag-1) 55%,var(--flag-2) 100%)" },
                { code: Language.En, flag: "🇬🇧", label: t("profile.language.en"), bg: "linear-gradient(150deg,var(--flag-1) 45%,var(--flag-3) 100%)" },
              ]).map(({ code, flag, label, bg }) => (
                <Box
                  key={code}
                  component="button"
                  type="button"
                  onClick={() => handleLanguageChange(code)}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    width: 100,
                    boxSizing: "border-box",
                    borderRadius: "var(--r-sm)",
                    overflow: "hidden",
                    border: culture === code ? "2px solid var(--accent)" : "2px solid var(--border)",
                    boxShadow: culture === code ? "0 0 0 2px var(--accent-subtle)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <Box
                    sx={{
                      height: 48,
                      background: bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box component="span" sx={{ fontSize: "18px", lineHeight: "18px", display: "block", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}>
                      {flag}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: "8px",
                      py: "4px",
                      background: "var(--s2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <TranslateOutlined sx={{ fontSize: 8, color: "var(--muted)" }} />
                      <Box sx={{ fontSize: "9px", fontWeight: 600, color: "var(--muted)" }}>
                        {label}
                      </Box>
                    </Box>
                    {culture === code && (
                      <Box
                        sx={{
                          width: 11,
                          height: 11,
                          borderRadius: "50%",
                          background: "var(--accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckOutlined sx={{ fontSize: 7, color: "var(--s1)" }} />
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Apparence */}
          <Box>
            <Box sx={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", mb: "8px" }}>
              {t("profile.field.appearance")}
            </Box>
            <Box sx={{ display: "flex", gap: "8px" }}>
              {([Theme.Dark, Theme.Light] as const).map((mode) => (
                <Box
                  key={mode}
                  component="button"
                  type="button"
                  onClick={() => handleThemeToggle(mode)}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    width: 100,
                    boxSizing: "border-box",
                    borderRadius: "var(--r-sm)",
                    overflow: "hidden",
                    border: theme === mode ? "2px solid var(--accent)" : "2px solid var(--border)",
                    boxShadow: theme === mode ? "0 0 0 2px var(--accent-subtle)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <Box
                    sx={{
                      height: 48,
                      background:
                        mode === Theme.Dark
                          ? "linear-gradient(150deg,var(--preview-dk-surface) 55%,var(--preview-dk-surface2) 100%)"
                          : "linear-gradient(150deg,#fff 55%,var(--preview-lt-bg) 100%)",
                      p: "6px 8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    <Box sx={{ height: 3, width: "60%", borderRadius: "var(--r-xs)", background: mode === "dark" ? "var(--preview-dk-bar1)" : "var(--preview-lt-bar1)" }} />
                    <Box sx={{ height: 3, width: "80%", borderRadius: "var(--r-xs)", background: mode === "dark" ? "var(--preview-dk-bar2)" : "var(--preview-lt-bar2)" }} />
                    <Box sx={{ height: 3, width: "40%", borderRadius: "var(--r-xs)", background: mode === "dark" ? "var(--preview-dk-accent)" : "var(--preview-lt-accent)" }} />
                  </Box>
                  <Box
                    sx={{
                      px: "8px",
                      py: "4px",
                      background: mode === "dark" ? "var(--preview-dk-bg)" : "var(--preview-lt-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      {mode === "dark" ? (
                        <DarkModeOutlined sx={{ fontSize: 8, color: "var(--preview-dk-text-soft)" }} />
                      ) : (
                        <LightModeOutlined sx={{ fontSize: 8, color: "var(--preview-lt-text-soft)" }} />
                      )}
                      <Box
                        sx={{
                          fontSize: "9px",
                          fontWeight: 600,
                          color: mode === "dark" ? "var(--preview-dk-text-strong)" : "var(--preview-lt-text-strong)",
                        }}
                      >
                        {mode === "dark" ? t("profile.theme.dark") : t("profile.theme.light")}
                      </Box>
                    </Box>
                    {theme === mode && (
                      <Box
                        sx={{
                          width: 11,
                          height: 11,
                          borderRadius: "50%",
                          background: "var(--accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckOutlined sx={{ fontSize: 7, color: "var(--s1)" }} />
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={CARD_SX}>
        <InnerDivider label={t("profile.section.gdpr")} />

        {/* Export row */}
        <Box
          sx={{
            px: "16px",
            py: "14px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", mb: "2px" }}>
              {t("profile.gdpr.export_label")}
            </Box>
            <Box sx={{ fontSize: "11px", color: "var(--muted)" }}>
              {t("profile.gdpr.export_help")}
            </Box>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={handleExportGdpr}
            disabled={exportingGdpr}
            sx={{ "&:hover": { transform: "none" } }}
          >
            {exportingGdpr ? t("profile.gdpr.exporting") : t("profile.gdpr.export_button")}
          </Button>
        </Box>

        {/* Danger zone */}
        <Box
          sx={{
            px: "16px",
            py: "14px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: "transparent",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ fontSize: "12px", fontWeight: 600, color: "var(--red)", mb: "2px" }}>
              {t("profile.gdpr.delete_label")}
            </Box>
            <Box sx={{ fontSize: "11px", color: "var(--muted)" }}>
              {t("profile.gdpr.delete_help")}
            </Box>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => setDeleteDialogOpen(true)}
            sx={{
              background: "linear-gradient(135deg, var(--red) 0%, color-mix(in srgb, var(--red) 92%, white) 100%)",
              boxShadow: "none",
              "&:hover": {
                background: "linear-gradient(135deg, color-mix(in srgb, var(--red) 85%, black) 0%, var(--red) 100%)",
                boxShadow: "none",
                transform: "none",
              },
            }}
          >
            {t("profile.gdpr.delete_button")}
          </Button>
        </Box>

        <Box
          sx={{
            px: "16px",
            py: "10px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <a
            href={ROUTES.PRIVACY}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--muted2)",
              fontSize: "11px",
              fontFamily: "inherit",
              textDecoration: "underline",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted2)")}
          >
            {t("privacy.title")}
          </a>
        </Box>
      </Box>

      <AppModal
        open={deleteDialogOpen}
        onClose={() => { if (!deletingAccount) { setDeleteDialogOpen(false); setDeletePassword(""); } }}
        title={t("profile.gdpr.delete_confirm_title")}
        maxWidth="xs"
        actions={
          <>
            <Button
              variant="contained"
              size="small"
              className="btn-cancel"
              onClick={() => { setDeleteDialogOpen(false); setDeletePassword(""); }}
              disabled={deletingAccount}
            >
              {t("profile.gdpr.cancel")}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleDeleteAccount}
              disabled={deletingAccount || !deletePassword.trim()}
              sx={{
                background: "linear-gradient(135deg, var(--red) 0%, color-mix(in srgb, var(--red) 92%, white) 100%)",
                boxShadow: "none",
                "&:hover": {
                  background: "linear-gradient(135deg, color-mix(in srgb, var(--red) 85%, black) 0%, var(--red) 100%)",
                  boxShadow: "none",
                  transform: "none",
                },
                "&:disabled": { background: "var(--red)", opacity: 0.6 },
              }}
            >
              {deletingAccount ? t("profile.gdpr.deleting") : t("profile.gdpr.delete_confirm")}
            </Button>
          </>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Box
            sx={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: 1.65,
            }}
          >
            {t("profile.gdpr.delete_confirm_body")}
          </Box>
          <Box>
            <Box sx={{ fontSize: "11px", fontWeight: 600, color: "var(--muted2)", letterSpacing: "0.06em", textTransform: "uppercase", mb: "7px" }}>
              {t("profile.gdpr.delete_password_label")}
            </Box>
            <Box
              component="input"
              type="password"
              sx={{ ...inp, py: "9px", px: "12px", fontSize: "13px" }}
              value={deletePassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeletePassword(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" && deletePassword.trim()) handleDeleteAccount(); }}
              autoFocus
            />
          </Box>
        </Box>
      </AppModal>

      <Box
        sx={{
          position: "fixed",
          bottom: "10px",
          right: "14px",
          fontSize: "10px",
          color: "var(--muted)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.04em",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        v{version}
      </Box>
    </Box>
  );
};
