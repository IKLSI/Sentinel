import type React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import SwapHorizOutlined from "@mui/icons-material/SwapHorizOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { FormSelectField } from "@/components/ui/forms/FormSelectField";
import { useT } from "@/contexts/I18nContext";
import type { ReleaseRefs } from "@/domains/deployments/types";
import { AnalysisInfo } from "@/features/deployments/components/AnalysisInfo";

interface Props {
  refs: ReleaseRefs | undefined;
  base: string | undefined;
  head: string | undefined;
  onCompare: (base: string, head: string) => void;
}

const FIELD_SX = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  minWidth: 0,
} as const;

const CAPTION_SX = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  typography: "monoCaption",
  color: "var(--muted)",
  whiteSpace: "nowrap",
} as const;

const SELECT_SX = { width: { xs: "100%", sm: "220px" } } as const;

export const DeploymentToolbar: React.FC<Props> = ({
  refs,
  base,
  head,
  onCompare,
}) => {
  const t = useT();
  const selectedBase = base ?? "";
  const selectedHead = head ?? "";
  const disabled = !refs?.available;

  const selectBase = (value: string) =>
    onCompare(value, value === selectedHead ? selectedBase : selectedHead);

  const selectHead = (value: string) =>
    onCompare(value === selectedBase ? selectedHead : selectedBase, value);

  const referenceOptions = (
    <>
      <option value="" disabled>
        {t("deployments.selector.choose_reference")}
      </option>
      {(refs?.tags.length ?? 0) > 0 && (
        <optgroup label={t("deployments.selector.tags")}>
          {refs?.tags.map((tag) => (
            <option key={`tag:${tag}`} value={tag}>
              {tag}
            </option>
          ))}
        </optgroup>
      )}
      <optgroup label={t("deployments.selector.branches")}>
        {refs?.branches.map((branch) => (
          <option key={`branch:${branch}`} value={branch}>
            {branch}
          </option>
        ))}
      </optgroup>
    </>
  );

  return (
    <Box
      component="section"
      aria-label={t("deployments.selector.label")}
      sx={{
        display: "flex",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "12px 20px",
        mb: "16px",
        flexShrink: 0,
        px: "20px",
        py: "14px",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border)",
        boxShadow: "var(--sh-1)",
        background: "var(--s1)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "12px",
          minWidth: 0,
        }}
      >
        <Box sx={FIELD_SX}>
          <Box component="label" htmlFor="deployment-base" sx={CAPTION_SX}>
            {t("deployments.selector.base")}
          </Box>
          <FormSelectField
            id="deployment-base"
            value={selectedBase}
            onValueChange={selectBase}
            disabled={disabled}
            sx={SELECT_SX}
          >
            {referenceOptions}
          </FormSelectField>
        </Box>

        <AppTooltip title={t("deployments.selector.swap")}>
          <span>
            <IconButton
              size="small"
              aria-label={t("deployments.selector.swap")}
              disabled={disabled || !selectedBase || !selectedHead}
              onClick={() => onCompare(selectedHead, selectedBase)}
              sx={{
                mb: "3px",
                border: "1px solid var(--border)",
                background: "var(--s2)",
              }}
            >
              <SwapHorizOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </AppTooltip>

        <Box sx={FIELD_SX}>
          <Box component="label" htmlFor="deployment-head" sx={CAPTION_SX}>
            {t("deployments.selector.head")}
          </Box>
          <FormSelectField
            id="deployment-head"
            value={selectedHead}
            onValueChange={selectHead}
            disabled={disabled}
            sx={SELECT_SX}
          >
            {referenceOptions}
          </FormSelectField>
        </Box>
      </Box>

      <Box sx={{ ml: "auto", alignSelf: "flex-start", mt: "-6px", mr: "-8px" }}>
        <AnalysisInfo />
      </Box>
    </Box>
  );
};
