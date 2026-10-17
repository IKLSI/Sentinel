import type React from "react";
import Box from "@mui/material/Box";
import { useT } from "@/contexts/I18nContext";
import { StatusChip } from "@/components/ui/common/StatusChip";
import { Section } from "@/features/styleGuide/pages/StyleGuidePage/components/Section";
import { SubLabel } from "@/features/styleGuide/pages/StyleGuidePage/components/SubLabel";
import { OutlineBadge } from "@/features/styleGuide/pages/StyleGuidePage/components/OutlineBadge";

export const ChipsSection: React.FC = () => {
  const t = useT();

  return (
    <Section
      title={t("style_guide.section.chips")}
      desc={t("style_guide.section.chips_desc")}
    >
      <SubLabel>Status</SubLabel>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px", mb: "24px" }}>
        <StatusChip variant="red">CRITIQUE</StatusChip>
        <StatusChip variant="orange">ÉLEVÉ</StatusChip>
        <StatusChip variant="yellow">MOYEN</StatusChip>
        <StatusChip variant="green">RÉSOLU</StatusChip>
        <StatusChip variant="blue">EN COURS</StatusChip>
        <StatusChip variant="cyan">EN REVUE</StatusChip>
        <StatusChip variant="purple">PLANIFIÉ</StatusChip>
        <StatusChip variant="gray">ARCHIVÉ</StatusChip>
      </Box>

      <SubLabel>Badges</SubLabel>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <OutlineBadge
          bg="var(--s3)"
          color="var(--text)"
          border="var(--border2)"
        >
          Default
        </OutlineBadge>
        <OutlineBadge bg="var(--s2)" color="var(--text-secondary)">
          Secondary
        </OutlineBadge>
        <OutlineBadge>Outline</OutlineBadge>
        <OutlineBadge
          bg="var(--red-subtle)"
          color="var(--red)"
          border="color-mix(in srgb, var(--red) 28%, transparent)"
        >
          Destructive
        </OutlineBadge>
        <OutlineBadge
          bg="var(--green-subtle)"
          color="var(--green)"
          border="color-mix(in srgb, var(--green) 28%, transparent)"
        >
          Success
        </OutlineBadge>
        <OutlineBadge
          bg="var(--yellow-subtle)"
          color="var(--yellow)"
          border="color-mix(in srgb, var(--yellow) 25%, transparent)"
        >
          Warning
        </OutlineBadge>
      </Box>
    </Section>
  );
};
