import React, { useState } from "react";
import { version } from "../../../../package.json";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useAuth } from "../../auth/hooks/useAuth";
import { useTheme } from "../../../store/ThemeContext";
import { useToast } from "../../../hooks/useToast";
import { updateMyProfile, updatePreferences } from "../api/users";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import { useT } from "../../../i18n/I18nContext";

const ROLE_LABEL_KEYS: Record<string, string> = {
  Admin: "profile.role.admin",
  Developer: "profile.role.developer",
};

const inp = {
  width: "100%",
  display: "block",
  boxSizing: "border-box",
  background: "var(--s2)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
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
  borderRadius: "12px",
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

  const [pf, setPf] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });
  const [savingPf, setSavingPf] = useState(false);

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
    } catch {
      showToast(t("profile.toast.update_error"), "error");
    } finally {
      setSavingPf(false);
    }
  };

  const handleThemeToggle = (mode: "dark" | "light") => {
    if (theme === mode) return;
    toggleTheme();
    updatePreferences({ theme: mode }).catch(() => {});
  };

  return (
    <Box
      className="page-enter"
      sx={{
        p: "36px 24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* ── Card Informations ── */}
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
                ROLE_LABEL_KEYS[user?.role ?? ""]
                  ? t(ROLE_LABEL_KEYS[user?.role ?? ""])
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
            sx={{ minWidth: "110px" }}
          >
            {savingPf ? t("profile.button.saving") : t("profile.button.save")}
          </Button>
        </Box>
      </Box>

      {/* ── Card Préférences ── */}
      <Box sx={CARD_SX}>
        <InnerDivider label={t("profile.section.preferences")} />

        <Box sx={{ px: "16px", py: "16px" }}>
          <Box
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text)",
              mb: "5px",
            }}
          >
            {t("profile.field.appearance")}
          </Box>
          <Box sx={{ display: "flex", gap: "8px" }}>
            {(["dark", "light"] as const).map((mode) => (
              <Box
                key={mode}
                component="button"
                type="button"
                onClick={() => handleThemeToggle(mode)}
                sx={{
                  all: "unset",
                  cursor: "pointer",
                  width: 80,
                  borderRadius: "7px",
                  overflow: "hidden",
                  border:
                    theme === mode
                      ? "2px solid var(--accent)"
                      : "2px solid var(--border)",
                  boxShadow:
                    theme === mode ? "0 0 0 2px var(--accent-subtle)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <Box
                  sx={{
                    height: 36,
                    background:
                      mode === "dark"
                        ? "linear-gradient(150deg,#0d1120 55%,#1a2340 100%)"
                        : "linear-gradient(150deg,#ffffff 55%,#f0f2f8 100%)",
                    p: "6px 8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  <Box
                    sx={{
                      height: 3,
                      width: "60%",
                      borderRadius: 2,
                      background: mode === "dark" ? "#263352" : "#dde3f2",
                    }}
                  />
                  <Box
                    sx={{
                      height: 3,
                      width: "80%",
                      borderRadius: 2,
                      background: mode === "dark" ? "#192036" : "#eaedfa",
                    }}
                  />
                  <Box
                    sx={{
                      height: 3,
                      width: "40%",
                      borderRadius: 2,
                      background:
                        mode === "dark"
                          ? "rgba(99,102,241,0.5)"
                          : "rgba(79,70,229,0.35)",
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    px: "8px",
                    py: "4px",
                    background: mode === "dark" ? "#080c14" : "#f0f2f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: "3px" }}
                  >
                    {mode === "dark" ? (
                      <DarkModeOutlined
                        sx={{ fontSize: 8, color: "rgba(230,234,246,0.4)" }}
                      />
                    ) : (
                      <LightModeOutlined
                        sx={{ fontSize: 8, color: "rgba(14,18,32,0.4)" }}
                      />
                    )}
                    <Box
                      sx={{
                        fontSize: "9px",
                        fontWeight: 600,
                        color:
                          mode === "dark"
                            ? "rgba(230,234,246,0.55)"
                            : "rgba(14,18,32,0.45)",
                      }}
                    >
                      {mode === "dark"
                        ? t("profile.theme.dark")
                        : t("profile.theme.light")}
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
