import React from "react";
import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";

interface Props {
  anchor: HTMLElement | null;
  onClose: () => void;
  value: string;
  onSelect: (time: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_STEP = 5;
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, i) => i * MINUTE_STEP);
const COLUMN_HEIGHT = 168;
const CELL_HEIGHT = 30;

const pad = (n: number): string => String(n).padStart(2, "0");

const parseTime = (value: string): { hour: number | null; minute: number | null } => {
  if (!value) return { hour: null, minute: null };
  const [h, m] = value.split(":").map(Number);
  return {
    hour: Number.isNaN(h) ? null : h,
    minute: Number.isNaN(m) ? null : m,
  };
};

const FADE_MASK =
  "linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%)";

const cellSx = (isSelected: boolean) => ({
  flexShrink: 0,
  height: `${CELL_HEIGHT}px`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: isSelected ? "14px" : "12px",
  fontFamily: "var(--font-mono)",
  fontWeight: isSelected ? 700 : 500,
  color: isSelected ? "var(--s1)" : "var(--muted2)",
  background: isSelected ? "var(--accent)" : "transparent",
  borderRadius: "999px",
  cursor: "pointer",
  border: "none",
  outline: "none",
  transition:
    "background 0.16s ease, color 0.16s ease, font-size 0.16s ease, transform 0.16s ease",
  boxShadow: isSelected
    ? "0 2px 10px color-mix(in srgb, var(--accent) 45%, transparent)"
    : "none",
  "&:hover": {
    background: isSelected ? "var(--accent)" : "var(--s3)",
    color: isSelected ? "var(--s1)" : "var(--text)",
  },
});

const columnSx = {
  flex: 1,
  height: COLUMN_HEIGHT,
  overflowY: "auto" as const,
  display: "flex",
  flexDirection: "column" as const,
  gap: "3px",
  px: "4px",
  py: `${COLUMN_HEIGHT / 2 - CELL_HEIGHT / 2}px`,
  scrollSnapType: "y proximity",
  maskImage: FADE_MASK,
  WebkitMaskImage: FADE_MASK,
  scrollbarWidth: "none" as const,
  "&::-webkit-scrollbar": { display: "none" },
};

export const TimePickerPopover: React.FC<Props> = ({
  anchor,
  onClose,
  value,
  onSelect,
}) => {
  const { hour, minute } = parseTime(value);
  const selectedHourRef = React.useRef<HTMLButtonElement | null>(null);
  const selectedMinuteRef = React.useRef<HTMLButtonElement | null>(null);
  const openedRef = React.useRef(false);

  React.useEffect(() => {
    if (!anchor) {
      openedRef.current = false;
      return;
    }
    const behavior: ScrollBehavior = openedRef.current ? "smooth" : "auto";
    const id = window.setTimeout(() => {
      [selectedHourRef.current, selectedMinuteRef.current].forEach((el) => {
        const container = el?.parentElement;
        if (!el || !container) return;
        container.scrollTo({
          top: el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
          behavior,
        });
      });
      openedRef.current = true;
    }, 0);
    return () => window.clearTimeout(id);
  }, [anchor, value]);

  const commit = (h: number, m: number) => onSelect(`${pad(h)}:${pad(m)}`);

  const renderColumn = (
    items: number[],
    selectedValue: number | null,
    selectedRef: React.RefObject<HTMLButtonElement | null>,
    onPick: (n: number) => void,
  ) => (
    <Box sx={columnSx}>
      {items.map((n) => {
        const isSelected = n === selectedValue;
        return (
          <Box
            key={n}
            ref={isSelected ? selectedRef : undefined}
            component="button"
            onClick={() => onPick(n)}
            sx={{ ...cellSx(isSelected), scrollSnapAlign: "center" }}
          >
            {pad(n)}
          </Box>
        );
      })}
    </Box>
  );

  return (
    <Popover
      open={!!anchor}
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: {
            mt: "4px",
            p: "12px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            background: "var(--s1)",
            minWidth: "200px",
          },
        },
      }}
    >
      <Box sx={{ position: "relative" }}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: `${CELL_HEIGHT}px`,
            transform: "translateY(-50%)",
            background: "var(--s3)",
            borderRadius: "999px",
            opacity: 0.5,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "stretch",
            gap: "4px",
          }}
        >
          {renderColumn(HOURS, hour, selectedHourRef, (h) =>
            commit(h, minute ?? 0),
          )}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              fontFamily: "var(--font-mono)",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--muted)",
            }}
          >
            :
          </Box>
          {renderColumn(MINUTES, minute, selectedMinuteRef, (m) =>
            commit(hour ?? 0, m),
          )}
        </Box>
      </Box>
    </Popover>
  );
};
