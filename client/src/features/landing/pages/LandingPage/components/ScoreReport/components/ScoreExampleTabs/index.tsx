import type React from "react";
import { useRef } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { useT } from "@/contexts/I18nContext";
import type { ScoringExample } from "@/domains/publicScan/types";
import { landingGradeColorOf } from "@/features/landing/helpers";

interface Props {
  examples: ScoringExample[];
  selected: number;
  selectedExample: ScoringExample;
  onSelect: (index: number) => void;
  panelId: string;
}

const KEY_OFFSETS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };

export const ScoreExampleTabs: React.FC<Props> = ({
  examples,
  selected,
  selectedExample,
  onSelect,
  panelId,
}) => {
  const t = useT();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onTabKeyDown = (event: React.KeyboardEvent) => {
    const offset = KEY_OFFSETS[event.key];
    if (!offset) return;
    event.preventDefault();
    const next = (selected + offset + examples.length) % examples.length;
    onSelect(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <Box
      role="tablist"
      aria-label={t("landing.score.tabs_label")}
      sx={{
        display: "flex",
        gap: "4px",
        maxWidth: "100%",
        overflowX: "auto",
        scrollbarWidth: "none",
        p: "4px",
        borderRadius: "999px",
        background: "var(--tint)",
      }}
    >
      {examples.map((item, index) => {
        const isSelected = item === selectedExample;
        return (
          <ButtonBase
            type="button"
            role="tab"
            key={item.name}
            ref={(element: HTMLButtonElement | null) => {
              tabRefs.current[index] = element;
            }}
            aria-selected={isSelected}
            aria-controls={panelId}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(index)}
            onKeyDown={onTabKeyDown}
            sx={{
              flex: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              px: "14px",
              py: "8px",
              border: 0,
              borderRadius: "999px",
              cursor: "pointer",
              font: "inherit",
              textAlign: "inherit",
              fontSize: "14px",
              fontWeight: isSelected ? 500 : 400,
              color: isSelected ? "var(--ink)" : "var(--ink-2)",
              background: isSelected ? "var(--page)" : "transparent",
              boxShadow: isSelected
                ? "0 1px 3px color-mix(in srgb, var(--ink) 8%, transparent)"
                : "none",
              "&:hover": { color: "var(--ink)" },
              "&:focus-visible": {
                outline: "2px solid var(--indigo)",
                outlineOffset: "-2px",
              },
            }}
          >
            <Box
              component="span"
              aria-hidden
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: landingGradeColorOf(item.grade),
              }}
            />
            {item.name}
          </ButtonBase>
        );
      })}
    </Box>
  );
};
