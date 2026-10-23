import type React from "react";
import { useT } from "@/contexts/I18nContext";
import { AuthShowcase } from "@/features/auth/components/AuthShowcase";
import { tint } from "@/features/auth/styles";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  width: "20",
  height: "20",
  stroke: "currentColor",
} as const;

export const LoginShowcase: React.FC = () => {
  const t = useT();

  return (
    <AuthShowcase
      headline={t("auth.login.headline_part1")}
      headlineLead={t("auth.login.headline_part2")}
      headlineAccent={t("auth.login.headline_accent")}
      subtitle={t("auth.login.headline_sub")}
      items={[
        {
          title: t("auth.login.feature1_title"),
          description: t("auth.login.feature1_desc"),
          iconStyle: {
            background: tint("var(--auth-indigo-300)", 11),
            color: tint("var(--auth-indigo-300)", 90),
          },
          icon: (
            <svg aria-hidden="true" {...ICON_PROPS}>
              <path d="M4 20a8 8 0 1 1 16 0" />
              <path d="M12 20l4.5-5.5" />
              <path d="M4.5 15.5h.01M7 10.5h.01M12 8.5h.01M17 10.5h.01" />
            </svg>
          ),
        },
        {
          title: t("auth.login.feature2_title"),
          description: t("auth.login.feature2_desc"),
          iconStyle: {
            background: tint("var(--auth-pink-300)", 11),
            color: tint("var(--auth-pink-300)", 85),
          },
          icon: (
            <svg aria-hidden="true" {...ICON_PROPS}>
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          ),
        },
        {
          title: t("auth.login.feature3_title"),
          description: t("auth.login.feature3_desc"),
          iconStyle: {
            background: tint("var(--auth-amber-400)", 11),
            color: tint("var(--auth-amber-400)", 85),
          },
          icon: (
            <svg aria-hidden="true" {...ICON_PROPS}>
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          ),
        },
      ]}
    />
  );
};
