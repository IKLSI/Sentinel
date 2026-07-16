import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import ArrowForwardOutlined from "@mui/icons-material/ArrowForwardOutlined";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import type { RemediationPreviewDto } from "@/features/techHealth/api/remediation";

interface Props {
  preview: RemediationPreviewDto;
  t: (key: string) => string;
}

type BumpType = "major" | "minor" | "patch" | "other";

const parseVersion = (version: string): number[] | null => {
  const match = version.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

const getBumpType = (current: string, target: string): BumpType => {
  const from = parseVersion(current);
  const to = parseVersion(target);
  if (!from || !to) return "other";
  if (to[0] !== from[0]) return "major";
  if (to[1] !== from[1]) return "minor";
  if (to[2] !== from[2]) return "patch";
  return "other";
};

const BUMP_ORDER: Record<BumpType, number> = {
  major: 0,
  minor: 1,
  patch: 2,
  other: 3,
};

export const PreviewContent: React.FC<Props> = ({ preview, t }) => {
  const [expanded, setExpanded] = useState(true);

  const sortedTargets = [...preview.targets].sort((a, b) => {
    const diff =
      BUMP_ORDER[getBumpType(a.currentVersion, a.targetVersion)] -
      BUMP_ORDER[getBumpType(b.currentVersion, b.targetVersion)];
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

  return (
    <Box>
      <Box
        sx={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
          overflow: "hidden",
        }}
      >
        <Box
          onClick={() => setExpanded((v) => !v)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: "10px 12px",
            background: "var(--s2)",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text)",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {t("remediation.group_title")} ({preview.targets.length})
          <ExpandMoreOutlined
            sx={{
              fontSize: 18,
              color: "var(--muted)",
              transition: "transform 0.15s",
              transform: expanded ? "rotate(180deg)" : "none",
            }}
          />
        </Box>
        <Collapse in={expanded}>
          {sortedTargets.map((target) => (
            <Box
              key={`${target.ecosystem}:${target.name}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                p: "10px 12px",
                borderTop: "1px solid var(--border)",
                fontSize: "12px",
                transition: "background 0.12s",
                "&:hover": { background: "var(--s2)" },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                  title={target.name}
                >
                  {target.name}
                  {target.isBreaking && (
                    <Box
                      component="span"
                      sx={{
                        flexShrink: 0,
                        fontSize: "9px",
                        px: "5px",
                        py: "1px",
                        borderRadius: "4px",
                        fontWeight: 700,
                        background:
                          "color-mix(in srgb, var(--orange) 18%, transparent)",
                        color: "var(--orange)",
                        textTransform: "uppercase",
                      }}
                    >
                      {t("remediation.breaking_badge")}
                    </Box>
                  )}
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0,
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                }}
              >
                <Box sx={{ color: "var(--muted)" }}>
                  {target.currentVersion}
                </Box>
                <ArrowForwardOutlined
                  sx={{ fontSize: 12, color: "var(--muted2)" }}
                />
                <Box sx={{ color: "var(--accent)", fontWeight: 700 }}>
                  {target.targetVersion}
                </Box>
              </Box>
            </Box>
          ))}
        </Collapse>
      </Box>

      {preview.files.length > 0 && (
        <Box sx={{ mt: "12px", fontSize: "11px", color: "var(--muted)" }}>
          {t("remediation.files")} : {preview.files.join(", ")}
        </Box>
      )}
    </Box>
  );
};
