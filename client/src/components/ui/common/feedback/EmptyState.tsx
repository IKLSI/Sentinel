import type React from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { EASE_OUT_EXPO, fadeInUp, REDUCED_MOTION } from "@/styles/keyframes";

type EmptyStateSize = "compact" | "regular";
type EmptyStateTone = "neutral" | "success" | "danger";

interface Props {
  icon: SvgIconComponent;
  tone?: EmptyStateTone;
  title: string;
  subtitle?: string;
  size?: EmptyStateSize;
  action?: React.ReactNode;
  sx?: SxProps<Theme>;
}

const SIZES = {
  compact: {
    padding: "12px 16px",
    illustration: 96,
    illustrationGap: "6px",
    titleSize: "13px",
    subtitleSize: "12px",
  },
  regular: {
    padding: "32px 24px",
    illustration: 140,
    illustrationGap: "10px",
    titleSize: "15px",
    subtitleSize: "13px",
  },
} as const;

const TONE_COLORS: Record<EmptyStateTone, string> = {
  neutral: "var(--accent)",
  success: "var(--green)",
  danger: "var(--red)",
};

const VIEW_WIDTH = 160;
const VIEW_HEIGHT = 112;
const BADGE = { x: 40, y: 45, size: 26 };
const ICON_SIZE = 18;

const percentOf = (value: number, total: number) => `${(value / total) * 100}%`;

const line = (opacity: number) =>
  `color-mix(in srgb, var(--text) ${opacity}%, transparent)`;

const CardsBackdrop: React.FC = () => (
  <Box
    component="svg"
    viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
    sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
  >
    <rect
      x={46}
      y={14}
      width={68}
      height={44}
      rx={9}
      fill="var(--s2)"
      stroke="var(--border)"
      strokeWidth={1.25}
    />
    <rect x={58} y={28} width={30} height={4} rx={2} fill={line(7)} />
    <rect
      x={30}
      y={32}
      width={100}
      height={62}
      rx={11}
      fill="var(--s1)"
      stroke="var(--border2)"
      strokeWidth={1.25}
    />
    <rect x={74} y={51} width={42} height={5} rx={2.5} fill={line(12)} />
    <rect x={74} y={61} width={26} height={5} rx={2.5} fill={line(7)} />
    <rect x={42} y={80} width={76} height={4} rx={2} fill={line(7)} />
  </Box>
);

const Illustration: React.FC<{
  icon: SvgIconComponent;
  tone: EmptyStateTone;
  width: number;
}> = ({ icon: Icon, tone, width }) => {
  const color = TONE_COLORS[tone];

  return (
    <Box
      aria-hidden
      sx={{
        position: "relative",
        width,
        aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}`,
      }}
    >
      <CardsBackdrop />
      <Box
        sx={{
          position: "absolute",
          left: percentOf(BADGE.x, VIEW_WIDTH),
          top: percentOf(BADGE.y, VIEW_HEIGHT),
          width: percentOf(BADGE.size, VIEW_WIDTH),
          aspectRatio: "1",
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        }}
      >
        <Icon sx={{ fontSize: (width * ICON_SIZE) / VIEW_WIDTH, color }} />
      </Box>
    </Box>
  );
};

export const EmptyState: React.FC<Props> = ({
  icon,
  tone = "neutral",
  title,
  subtitle,
  size = "regular",
  action,
  sx,
}) => {
  const dimensions = SIZES[size];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: dimensions.padding,
        textAlign: "center",
        animation: `${fadeInUp} 0.4s ${EASE_OUT_EXPO}`,
        [REDUCED_MOTION]: { animation: "none" },
        ...sx,
      }}
    >
      <Box sx={{ mb: dimensions.illustrationGap }}>
        <Illustration icon={icon} tone={tone} width={dimensions.illustration} />
      </Box>
      <Box
        sx={{
          fontSize: dimensions.titleSize,
          fontWeight: 600,
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
          color: "var(--text)",
          textWrap: "balance",
        }}
      >
        {title}
      </Box>
      {subtitle && (
        <Box
          sx={{
            mt: "4px",
            maxWidth: "320px",
            fontSize: dimensions.subtitleSize,
            lineHeight: 1.5,
            color: "var(--muted2)",
            textWrap: "balance",
          }}
        >
          {subtitle}
        </Box>
      )}
      {action && <Box sx={{ mt: "16px" }}>{action}</Box>}
    </Box>
  );
};
