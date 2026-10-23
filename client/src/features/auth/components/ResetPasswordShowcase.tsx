import type React from "react";
import { useT } from "@/contexts/I18nContext";
import { AuthShowcase } from "@/features/auth/components/AuthShowcase";
import { tint } from "@/features/auth/styles";
import { ResetPasswordDecor } from "@/features/auth/components/ResetPasswordDecor";

export const ResetPasswordShowcase: React.FC = () => {
  const t = useT();

  return (
    <AuthShowcase
      showLogo
      decor={<ResetPasswordDecor />}
      headline={t("auth.reset_password.headline_part1")}
      headlineAccent={t("auth.reset_password.headline_accent")}
      subtitle={t("auth.reset_password.headline_sub")}
      items={[
        {
          title: t("auth.reset_password.feature1_title"),
          description: t("auth.reset_password.feature1_desc"),
          iconStyle: {
            background: tint("var(--auth-indigo-300)", 11),
            color: tint("var(--auth-indigo-300)", 90),
          },
          icon: (
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="6"
                width="10"
                height="7"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          ),
        },
        {
          title: t("auth.reset_password.feature2_title"),
          description: t("auth.reset_password.feature2_desc"),
          iconStyle: {
            background: tint("var(--auth-amber-400)", 11),
            color: tint("var(--auth-amber-400)", 85),
          },
          icon: (
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 1.5L12.5 4v4c0 2.8-2.5 5.2-5.5 6C3.5 13.2 1 10.8 1 8V4L7 1.5z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 7l2 2 3-3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        },
      ]}
    />
  );
};
