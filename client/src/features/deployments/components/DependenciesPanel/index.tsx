import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import EastOutlined from "@mui/icons-material/EastOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import { AppTooltip } from "@/components/ui/common/AppTooltip";
import { CardHeader } from "@/components/ui/common/CardHeader";
import { EmptyState } from "@/components/ui/common/feedback/EmptyState";
import { NO_VALUE } from "@/constants/display";
import { useT } from "@/contexts/I18nContext";
import type { ReleaseComparison } from "@/domains/deployments/types";
import {
  DependencyChangeKind,
  GROUP_PREVIEW_SIZE,
  PANEL_SX,
} from "@/features/deployments/constants";
import { dependencyGroups } from "@/features/deployments/helpers";
import type { DependencyGroup, VersionRow } from "@/features/deployments/types";
import { CARD_SX } from "@/helpers/cardSx";
import { pluralKey } from "@/helpers/plural";

interface Props {
  comparison: ReleaseComparison;
}

const VERSION_SX = {
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
} as const;

const LIST_ROW_SX = {
  display: "grid",
  gridTemplateColumns: "minmax(40%, 1fr) minmax(0, max-content)",
  alignItems: "center",
  columnGap: "10px",
  minHeight: "34px",
  pl: "44px",
  pr: "20px",
} as const;

const VULNERABILITY_TAG_SX = {
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  height: "20px",
  px: "7px",
  borderRadius: "4px",
  fontFamily: "var(--font-mono)",
  fontSize: "10.5px",
  fontWeight: 600,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  color: "var(--red)",
  background: "color-mix(in srgb, var(--red) 10%, transparent)",
} as const;

const newVersionTone = (change: VersionRow) => {
  if (change.vulnerabilities.length > 0) return "var(--red)";
  if (change.change === DependencyChangeKind.Added) return "var(--green)";
  if (change.isMajor) return "var(--orange)";
  return "var(--text)";
};

const DependencyRow: React.FC<{ change: VersionRow }> = ({ change }) => {
  const t = useT();
  const added = change.change === DependencyChangeKind.Added;
  const removed = change.change === DependencyChangeKind.Removed;
  const introduced = change.vulnerabilities;

  return (
    <Box component="li" sx={LIST_ROW_SX}>
      <Box
        sx={{
          minWidth: 0,
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: "13px",
            fontWeight: 600,
            color: removed ? "var(--muted2)" : "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {change.name}
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "8px",
          minWidth: 0,
        }}
      >
        {!added && !removed && (
          <>
            <Box component="span" sx={{ ...VERSION_SX, color: "var(--muted)" }}>
              {change.baseVersion ?? NO_VALUE}
            </Box>
            <EastOutlined
              aria-hidden
              sx={{ fontSize: 13, color: "var(--border2)", flexShrink: 0 }}
            />
          </>
        )}
        <AppTooltip
          title={
            introduced.length > 0
              ? `${t(pluralKey("deployments.dependencies.introduced", introduced.length), { count: introduced.length })} : ${introduced.join(", ")}`
              : ""
          }
        >
          <Box
            component="span"
            tabIndex={introduced.length > 0 ? 0 : undefined}
            sx={
              removed
                ? {
                    ...VERSION_SX,
                    color: "var(--muted)",
                    textDecoration: "line-through",
                  }
                : {
                    ...VERSION_SX,
                    fontWeight: 700,
                    color: newVersionTone(change),
                  }
            }
          >
            {removed
              ? (change.baseVersion ?? NO_VALUE)
              : (change.headVersion ?? NO_VALUE)}
          </Box>
        </AppTooltip>
      </Box>
    </Box>
  );
};

const GroupHeader: React.FC<{
  group: DependencyGroup;
  open: boolean;
  onToggle: () => void;
}> = ({ group, open, onToggle }) => {
  const t = useT();

  return (
    <ButtonBase
      onClick={onToggle}
      aria-expanded={open}
      sx={{
        width: "100%",
        justifyContent: "flex-start",
        gap: "10px",
        px: "20px",
        py: "12px",
        textAlign: "left",
        position: "sticky",
        top: 0,
        zIndex: 1,
        background: "var(--s1)",
        "&:hover": { background: "var(--s2)" },
      }}
    >
      <ExpandMore
        aria-hidden
        sx={{
          fontSize: 18,
          color: "var(--muted)",
          transform: open ? "none" : "rotate(-90deg)",
          transition: "transform 0.15s",
        }}
      />
      <Box component="span" sx={{ fontSize: "13px", fontWeight: 700 }}>
        {group.ecosystem ?? t("deployments.dependencies.group.runtimes")}
      </Box>
      <Box
        component="span"
        sx={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--muted)",
        }}
      >
        {group.rows.length}
      </Box>
      {group.vulnerabilityCount > 0 && (
        <Box component="span" sx={{ ml: "auto" }}>
          <Box component="span" sx={VULNERABILITY_TAG_SX}>
            {t(
              pluralKey(
                "deployments.dependencies.group.vulnerabilities",
                group.vulnerabilityCount,
              ),
              {
                count: group.vulnerabilityCount,
              },
            )}
          </Box>
        </Box>
      )}
    </ButtonBase>
  );
};

export const DependenciesPanel: React.FC<Props> = ({ comparison }) => {
  const t = useT();
  const groups = dependencyGroups(comparison);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <Box component="section" sx={{ ...CARD_SX, ...PANEL_SX }}>
      <CardHeader label={t("deployments.dependencies.title")} />
      {groups.length === 0 ? (
        <EmptyState
          icon={Inventory2Outlined}
          title={t("deployments.dependencies.empty_title")}
          subtitle={t("deployments.dependencies.empty_subtitle")}
          sx={{ flex: 1, justifyContent: "center" }}
        />
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {groups.map((group) => {
            const open = overrides[group.key] ?? false;
            const showAll = expanded[group.key] ?? false;
            const hidden = group.rows.length - GROUP_PREVIEW_SIZE;
            const rows =
              showAll || hidden <= 0
                ? group.rows
                : group.rows.slice(0, GROUP_PREVIEW_SIZE);

            return (
              <Box
                key={group.key}
                sx={{ borderBottom: "1px solid var(--border)" }}
              >
                <GroupHeader
                  group={group}
                  open={open}
                  onToggle={() =>
                    setOverrides((current) => ({
                      ...current,
                      [group.key]: !open,
                    }))
                  }
                />
                <Collapse in={open} unmountOnExit>
                  <Box
                    component="ul"
                    sx={{ listStyle: "none", m: 0, p: 0, pb: "6px" }}
                  >
                    {rows.map((row) => (
                      <DependencyRow key={row.id} change={row} />
                    ))}
                  </Box>
                  {hidden > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        pb: "6px",
                      }}
                    >
                      <Button
                        variant="text"
                        color="inherit"
                        size="small"
                        endIcon={
                          <ExpandMore
                            sx={{
                              transform: showAll ? "rotate(180deg)" : "none",
                            }}
                          />
                        }
                        onClick={() =>
                          setExpanded((current) => ({
                            ...current,
                            [group.key]: !showAll,
                          }))
                        }
                      >
                        {t(
                          showAll
                            ? "deployments.dependencies.group.less"
                            : "deployments.dependencies.group.more",
                          { count: hidden },
                        )}
                      </Button>
                    </Box>
                  )}
                </Collapse>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
