import type React from "react";
import Box from "@mui/material/Box";
import { StatusChip } from "@/components/ui/common/StatusChip";
import { PRIORITY_TONES } from "@/constants/severities";
import { useT } from "@/contexts/I18nContext";
import { TicketPriority } from "@/enums";
import { priorityLabelKeys } from "@/features/tickets/pages/TicketsPage/helpers";
import { GradeScale } from "@/features/styleGuide/pages/StyleGuidePage/components/BadgesSection/components/GradeScale";
import { STATUS_GROUPS } from "@/features/styleGuide/pages/StyleGuidePage/components/BadgesSection/constants";
import { LabelledRow } from "@/features/styleGuide/pages/StyleGuidePage/components/LabelledRow";
import { Specimen } from "@/features/styleGuide/pages/StyleGuidePage/components/Specimen";

export const BadgesSection: React.FC = () => {
  const t = useT();

  return (
    <>
      <Specimen
        title={t("style_guide.badges.status")}
        note={t("style_guide.badges.status_note")}
        source="components/ui/common/StatusChip.tsx"
      >
        {STATUS_GROUPS.map((group) => (
          <LabelledRow key={group.labelKey} label={t(group.labelKey)}>
            {Object.entries(group.entries).map(([key, entry]) => (
              <StatusChip key={key} variant={entry.variant}>
                {t(entry.labelKey)}
              </StatusChip>
            ))}
          </LabelledRow>
        ))}
        <LabelledRow label={t("style_guide.badges.priority")}>
          {Object.values(TicketPriority).map((priority) => (
            <Box
              key={priority}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                color: PRIORITY_TONES[priority],
              }}
            >
              <Box
                aria-hidden
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "currentColor",
                }}
              />
              {t(priorityLabelKeys[priority])}
            </Box>
          ))}
        </LabelledRow>
      </Specimen>

      <Specimen
        title={t("style_guide.badges.grade")}
        note={t("style_guide.badges.grade_note")}
        source="components/ui/common/GradeRing.tsx"
      >
        <GradeScale />
      </Specimen>
    </>
  );
};
