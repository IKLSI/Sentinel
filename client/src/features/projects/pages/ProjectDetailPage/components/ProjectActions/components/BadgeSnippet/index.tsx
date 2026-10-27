import type React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CheckCircleOutlineOutlined from "@mui/icons-material/CheckCircleOutlineOutlined";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import { useT } from "@/contexts/I18nContext";
import { buildBadgeMarkdown } from "@/domains/publicScan/helpers";

const COPIED_FEEDBACK_MS = 1500;

interface Props {
  badgePath: string;
  linkPath: string;
}

export const BadgeSnippet: React.FC<Props> = ({ badgePath, linkPath }) => {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [previewVersion] = useState(() => Date.now());

  const markdown = buildBadgeMarkdown(
    window.location.origin,
    badgePath,
    linkPath,
  );

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: "28px",
          background: "var(--s2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
        }}
      >
        <Box
          component="img"
          src={`${badgePath}?v=${previewVersion}`}
          alt="Sentinel"
          sx={{ height: 28 }}
        />
      </Box>
      <Button
        variant="contained"
        onClick={copyMarkdown}
        fullWidth
        startIcon={
          copied ? (
            <CheckCircleOutlineOutlined sx={{ fontSize: "16px !important" }} />
          ) : (
            <ContentCopyOutlined sx={{ fontSize: "16px !important" }} />
          )
        }
      >
        {t(copied ? "public_scan.badge.copied" : "public_scan.badge.copy")}
      </Button>
    </Box>
  );
};
