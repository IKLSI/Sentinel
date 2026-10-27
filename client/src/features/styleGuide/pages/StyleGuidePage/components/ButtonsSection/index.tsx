import type React from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import MoreHorizOutlined from "@mui/icons-material/MoreHorizOutlined";
import { ExportButton } from "@/components/ui/common/ExportButton";
import { ModalActions } from "@/components/ui/common/modal/ModalActions";
import { useT } from "@/contexts/I18nContext";
import {
  BUTTON_ICON_SX,
  USAGE_RULES,
} from "@/features/styleGuide/pages/StyleGuidePage/components/ButtonsSection/constants";
import { LabelledRow } from "@/features/styleGuide/pages/StyleGuidePage/components/LabelledRow";
import { Specimen } from "@/features/styleGuide/pages/StyleGuidePage/components/Specimen";
import { UsageRules } from "@/features/styleGuide/pages/StyleGuidePage/components/UsageRules";

const noop = () => undefined;

export const ButtonsSection: React.FC = () => {
  const t = useT();

  return (
    <>
      <Specimen
        title={t("style_guide.buttons.variants")}
        source="configs/themes/components/buttons.ts"
      >
        <LabelledRow label={t("style_guide.buttons.contained")}>
          <Button
            variant="contained"
            startIcon={<AddOutlined sx={BUTTON_ICON_SX} />}
          >
            {t("tickets.list.create_title")}
          </Button>
          <Button variant="contained" color="secondary">
            {t("projects.export")}
          </Button>
          <Button variant="contained" color="error">
            {t("common.delete")}
          </Button>
          <Button variant="contained" color="inherit">
            {t("common.cancel")}
          </Button>
        </LabelledRow>
        <LabelledRow label={t("style_guide.buttons.outlined")}>
          <Button variant="outlined">{t("common.edit")}</Button>
          <Button
            variant="outlined"
            endIcon={<KeyboardArrowDownOutlined sx={BUTTON_ICON_SX} />}
          >
            {t("tech_health.actions.menu")}
          </Button>
        </LabelledRow>
        <LabelledRow label={t("style_guide.buttons.icon_button")}>
          <IconButton size="small" aria-label={t("common.edit")}>
            <EditOutlined sx={BUTTON_ICON_SX} />
          </IconButton>
          <IconButton size="small" aria-label={t("tech_health.actions.menu")}>
            <MoreHorizOutlined sx={BUTTON_ICON_SX} />
          </IconButton>
          <IconButton size="small" aria-label={t("common.delete")}>
            <DeleteOutlined sx={BUTTON_ICON_SX} />
          </IconButton>
        </LabelledRow>
        <LabelledRow label={t("style_guide.buttons.export")}>
          <ExportButton
            onClick={noop}
            exporting={false}
            label={t("projects.export")}
          />
          <ExportButton onClick={noop} exporting label={t("projects.export")} />
        </LabelledRow>
      </Specimen>

      <Specimen
        title={t("style_guide.buttons.sizes_states")}
        note={t("style_guide.buttons.states_note")}
        source="components/ui/common/modal/ModalActions.tsx"
      >
        <LabelledRow label={t("style_guide.buttons.sizes")}>
          <Button variant="contained" size="small">
            {t("style_guide.buttons.size_small")}
          </Button>
          <Button variant="contained">
            {t("style_guide.buttons.size_medium")}
          </Button>
        </LabelledRow>
        <LabelledRow label={t("style_guide.buttons.disabled")}>
          <Button variant="contained" disabled>
            {t("common.save")}
          </Button>
          <Button variant="outlined" disabled>
            {t("common.edit")}
          </Button>
        </LabelledRow>
        <LabelledRow label={t("style_guide.buttons.pending")}>
          <ModalActions
            onCancel={noop}
            onConfirm={noop}
            pending
            confirmLabel={t("common.save")}
          />
        </LabelledRow>
      </Specimen>

      <UsageRules title={t("style_guide.buttons.rules")} rules={USAGE_RULES} />
    </>
  );
};
