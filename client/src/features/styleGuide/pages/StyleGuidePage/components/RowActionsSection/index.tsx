import type React from "react";
import Box from "@mui/material/Box";
import BlockOutlined from "@mui/icons-material/BlockOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import { RowActions } from "@/components/ui/common/table/RowActions";
import { useT } from "@/contexts/I18nContext";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { SubLabel } from "@/features/styleGuide/pages/StyleGuidePage/components/SubLabel";

const noop = () => undefined;

export const RowActionsSection: React.FC = () => {
  const t = useT();

  return (
    <Section
      title={t("style_guide.section.row_actions")}
      desc={t("style_guide.section.row_actions_desc")}
    >
      <SubLabel>RowActions</SubLabel>
      <Box
        sx={{
          display: "inline-flex",
          p: "8px 12px",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          "& .row-actions": { opacity: 1 },
        }}
      >
        <RowActions
          actions={[
            {
              icon: <EditOutlined sx={{ fontSize: 15 }} />,
              label: t("common.edit"),
              onClick: noop,
              color: "accent",
            },
            {
              icon: <RefreshOutlined sx={{ fontSize: 15 }} />,
              label: t("projects.action.scan"),
              onClick: noop,
              color: "yellow",
            },
            {
              icon: <BlockOutlined sx={{ fontSize: 15 }} />,
              label: t("style_guide.row_actions.disabled"),
              onClick: noop,
              color: "orange",
              disabled: true,
            },
            {
              icon: <DeleteOutlineOutlined sx={{ fontSize: 15 }} />,
              label: t("common.delete"),
              onClick: noop,
              color: "red",
            },
          ]}
        />
      </Box>
    </Section>
  );
};
