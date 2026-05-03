import React from "react";
import Box from "@mui/material/Box";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import LinkRounded from "@mui/icons-material/LinkRounded";
import { useT } from "@/i18n/I18nContext";
import { Ticket } from "@/types";
import { DetailPalette, getRelativeShort } from "../../helpers";

interface Props {
  ticket: Ticket;
  palette: DetailPalette;
  endpointMatch: string | null;
  titleBeforeEndpoint: string;
}

export const TicketHeader: React.FC<Props> = ({
  ticket,
  palette,
  endpointMatch,
  titleBeforeEndpoint,
}) => {
  const t = useT();
  return (
    <Box
      sx={{
        px: { xs: "24px", md: "40px" },
        pt: { xs: "24px", md: "36px" },
        pb: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          mb: "24px",
          color: palette.breadcrumbText,
          fontSize: "13px",
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: 600,
          }}
        >
          <FolderOutlined sx={{ fontSize: 13, color: palette.folderIcon }} />
          {ticket.projectName ?? t("tickets.detail.project_label")}
        </Box>
        <ChevronRightOutlined sx={{ fontSize: 12, color: palette.chevron }} />
        <Box
          sx={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
            fontSize: "12px",
            color: palette.referenceText,
            fontWeight: 700,
          }}
        >
          {ticket.reference}
        </Box>
        <ChevronRightOutlined sx={{ fontSize: 12, color: palette.chevron }} />
        <Box sx={{ color: palette.muted, fontSize: "12px" }}>
          {t("tickets.detail.opened_label")}{" "}
          <Box
            component="span"
            sx={{ color: palette.strongText, fontWeight: 700 }}
          >
            {getRelativeShort(ticket.createdAt, t)}
          </Box>
        </Box>
      </Box>

      <Box
        component="h1"
        sx={{
          m: 0,
          mt: "4px",
          mb: "0px",
          fontSize: { xs: "18px", md: "24px" },
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          color: palette.title,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {titleBeforeEndpoint}
        {endpointMatch && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--font-mono)",
              fontSize: { xs: "15px", md: "20px" },
              color: palette.endpointFg,
              background: palette.endpointBg,
              border: `1px solid ${palette.endpointBorder}`,
              borderRadius: 'var(--r-md)',
              px: "11px",
              py: "5px",
              fontWeight: 600,
            }}
          >
            <LinkRounded sx={{ fontSize: 16, color: palette.endpointIcon }} />
            {endpointMatch}
          </Box>
        )}
      </Box>
    </Box>
  );
};
