import type React from "react";
import Box from "@mui/material/Box";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { useT } from "@/contexts/I18nContext";

export interface UsageRule {
  kind: "do" | "dont";
  textKey: string;
}

interface Props {
  title: string;
  rules: readonly UsageRule[];
}

const RULE_STYLES = {
  do: {
    Icon: CheckOutlined,
    color: "var(--green)",
    labelKey: "style_guide.rules.do",
  },
  dont: {
    Icon: CloseOutlined,
    color: "var(--red)",
    labelKey: "style_guide.rules.dont",
  },
} as const;

export const UsageRules: React.FC<Props> = ({ title, rules }) => {
  const t = useT();

  return (
    <Box
      sx={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        background: "var(--s1)",
        px: "16px",
        py: "14px",
      }}
    >
      <Box
        component="h3"
        sx={{ m: 0, fontSize: "13px", fontWeight: 600, color: "var(--text)" }}
      >
        {title}
      </Box>
      <Box
        component="ul"
        sx={{
          m: 0,
          mt: "10px",
          p: 0,
          listStyle: "none",
          display: "grid",
          gap: "8px",
        }}
      >
        {rules.map(({ kind, textKey }) => {
          const { Icon, color, labelKey } = RULE_STYLES[kind];
          return (
            <Box
              component="li"
              key={textKey}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                fontSize: "13px",
                lineHeight: 1.55,
                color: "var(--text-secondary)",
              }}
            >
              <Icon
                titleAccess={t(labelKey)}
                sx={{ mt: "2px", fontSize: 15, flexShrink: 0, color }}
              />
              {t(textKey)}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
