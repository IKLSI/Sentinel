import type React from "react";
import { useT } from "@/contexts/I18nContext";
import { AuthShowcase } from "@/features/auth/components/AuthShowcase";

const STEP_KEYS = ["step1", "step2", "step3"] as const;

const STEP_ICON_STYLE: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "color-mix(in srgb, var(--auth-indigo-300) 15%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--auth-indigo-300) 30%, transparent)",
  color: "color-mix(in srgb, var(--auth-indigo-300) 90%, transparent)",
  fontSize: 11,
  fontWeight: 700,
};

export const InvitationShowcase: React.FC = () => {
  const t = useT();

  return (
    <AuthShowcase
      showLogo
      headline={t("auth.accept_invitation.headline_part1")}
      headlineAccent={t("auth.accept_invitation.headline_accent")}
      subtitle={t("auth.accept_invitation.headline_sub")}
      items={STEP_KEYS.map((step, index) => ({
        title: t(`auth.accept_invitation.${step}_title`),
        description: t(`auth.accept_invitation.${step}_desc`),
        iconStyle: STEP_ICON_STYLE,
        icon: index + 1,
      }))}
    />
  );
};
