import type React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import NotesOutlined from "@mui/icons-material/NotesOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { CardHeader } from "@/components/ui/common/CardHeader";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { useT } from "@/contexts/I18nContext";
import type { ReleaseComparison } from "@/domains/deployments/types";
import {
  GitmojiSection,
  timelineItemSx,
  timelineListSx,
} from "@/features/deployments/components/GitmojiSection";
import {
  NOTE_CATEGORY_GITMOJI,
  NOTE_CATEGORY_STYLES,
  PANEL_BODY_SX,
  PANEL_SX,
} from "@/features/deployments/constants";
import {
  notesByCategory,
  releaseNotesHtml,
  releaseNotesText,
} from "@/features/deployments/helpers";
import { useCopyText } from "@/features/deployments/hooks";
import { CARD_SX } from "@/helpers/cardSx";

interface Props {
  comparison: ReleaseComparison;
}

export const ReleaseNotesPanel: React.FC<Props> = ({ comparison }) => {
  const t = useT();
  const copyText = useCopyText();
  const groups = notesByCategory(comparison);

  return (
    <Box component="section" sx={{ ...CARD_SX, ...PANEL_SX }}>
      <CardHeader
        label={t("deployments.notes.title")}
        action={
          groups.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {comparison.summary.historyTruncated && (
                <AppTooltip
                  title={t("deployments.checks.gap.historyTruncated.detail")}
                >
                  <WarningAmberOutlined
                    tabIndex={0}
                    aria-label={t(
                      "deployments.checks.gap.historyTruncated.title",
                    )}
                    sx={{ fontSize: 16, color: "var(--orange)" }}
                  />
                </AppTooltip>
              )}
              <Button
                size="small"
                color="inherit"
                startIcon={<ContentCopyOutlined sx={{ fontSize: 14 }} />}
                onClick={() =>
                  void copyText(
                    releaseNotesText(groups, comparison.headReference, t),
                    "deployments.notes.copied",
                    releaseNotesHtml(groups, comparison.headReference, t),
                  )
                }
                sx={{ mr: "-8px" }}
              >
                {t("deployments.notes.copy")}
              </Button>
            </Box>
          )
        }
      />
      {groups.length === 0 ? (
        <EmptyState
          icon={NotesOutlined}
          title={t("deployments.notes.empty")}
          sx={{ flex: 1, justifyContent: "center" }}
        />
      ) : (
        <Box component="article" sx={PANEL_BODY_SX}>
          {groups.map((group) => {
            const tone =
              NOTE_CATEGORY_STYLES[group.category]?.tone ?? "var(--muted2)";

            return (
              <GitmojiSection
                key={group.category}
                gitmoji={NOTE_CATEGORY_GITMOJI[group.category] ?? ""}
                title={t(`deployments.notes.category.${group.category}`)}
                count={group.titles.length}
                tone={tone}
              >
                <Box component="ul" sx={timelineListSx(tone)}>
                  {group.titles.map((title) => (
                    <Box component="li" key={title} sx={timelineItemSx(tone)}>
                      {title}
                    </Box>
                  ))}
                </Box>
              </GitmojiSection>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
