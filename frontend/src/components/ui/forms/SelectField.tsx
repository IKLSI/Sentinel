import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";

export interface SelectFieldOption {
  value: string;
  label: string;
  color?: string;
}

interface Props {
  value: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  variant?: "field" | "pill";
  placeholder?: string;
  clearLabel?: string;
}

const OPTION_HEIGHT = "30px";
const MAX_LIST_HEIGHT = "260px";
const PILL_LIST_WIDTH = "180px";
const DOT_SIZE = "7px";
const DEFAULT_ACCENT = "var(--accent)";

const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

export const SelectField: React.FC<Props> = ({
  value,
  options,
  onChange,
  ariaLabel,
  variant = "field",
  placeholder,
  clearLabel,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const isPill = variant === "pill";
  const isActive = isPill && !!value;
  const selected = options[selectedIndex];
  const tone = selected?.color ?? DEFAULT_ACCENT;
  const triggerLabel = isPill && !value ? placeholder : selected?.label;

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const select = useCallback(
    (index: number) => {
      onChange(options[index].value);
      setOpen(false);
    },
    [onChange, options],
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open) {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        setActiveIndex(selectedIndex);
        setOpen(true);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % options.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + options.length) % options.length);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(activeIndex);
    }
  };

  return (
    <Box
      ref={rootRef}
      sx={{ position: "relative", width: isPill ? "auto" : "100%" }}
    >
      <Box
        component="button"
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((previous) => !previous);
        }}
        onKeyDown={handleKeyDown}
        sx={{
          all: "unset",
          cursor: "pointer",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          letterSpacing: "-0.01em",
          borderRadius: "var(--r)",
          ...(isPill
            ? {
                gap: "7px",
                height: "32px",
                pl: isActive ? "10px" : "12px",
                pr: isActive ? "5px" : "8px",
                fontSize: "12.5px",
                fontWeight: isActive ? 600 : 500,
                flexShrink: 0,
              }
            : {
                gap: "8px",
                width: "100%",
                justifyContent: "space-between",
                px: "12px",
                py: "7px",
                fontSize: "13px",
              }),
          color: isActive
            ? tone
            : isPill
              ? "var(--text-secondary)"
              : "var(--text)",
          background: isActive ? tint(tone, 12) : "var(--s1)",
          border: `1px solid ${
            isActive
              ? tint(tone, 34)
              : open
                ? "var(--accent-border)"
                : "var(--border)"
          }`,
          transition: "border-color 0.12s, background 0.12s, color 0.12s",
          "&:hover": {
            borderColor: isActive ? tint(tone, 55) : "var(--border2)",
            background: isActive ? tint(tone, 18) : "var(--s2)",
          },
          "&:focus-visible": { borderColor: "var(--accent)" },
        }}
      >
        {isActive && (
          <Box
            component="span"
            sx={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: "50%",
              background: tone,
              flexShrink: 0,
            }}
          />
        )}
        {triggerLabel}
        {isActive ? (
          <Box
            component="span"
            role="button"
            tabIndex={0}
            aria-label={clearLabel}
            onClick={(event: React.MouseEvent) => {
              event.stopPropagation();
              setOpen(false);
              onChange("");
            }}
            onKeyDown={(event: React.KeyboardEvent) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              onChange("");
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20px",
              height: "20px",
              borderRadius: "var(--r-xs)",
              cursor: "pointer",
              opacity: 0.75,
              transition: "background 0.12s, opacity 0.12s",
              "&:hover": { background: tint(tone, 22), opacity: 1 },
            }}
          >
            <CloseOutlined sx={{ fontSize: 13 }} />
          </Box>
        ) : (
          <KeyboardArrowDownOutlined
            sx={{
              fontSize: 16,
              color: "var(--muted2)",
              flexShrink: 0,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.12s",
            }}
          />
        )}
      </Box>

      {open && (
        <Box
          role="listbox"
          aria-label={ariaLabel}
          sx={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            ...(isPill ? { minWidth: PILL_LIST_WIDTH } : { right: 0 }),
            zIndex: 30,
            maxHeight: MAX_LIST_HEIGHT,
            overflowY: "auto",
            background: "var(--s2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
            boxShadow: "var(--sh-3)",
            p: "5px",
            animation: "fadeInUp 0.12s ease forwards",
          }}
        >
          {options.map((option, index) => (
            <Box
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => select(index)}
              onMouseEnter={() => setActiveIndex(index)}
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                height: OPTION_HEIGHT,
                px: "8px",
                borderRadius: "var(--r-sm)",
                fontSize: "12.5px",
                letterSpacing: "-0.01em",
                fontWeight: option.value === value ? 600 : 500,
                color:
                  option.value === value
                    ? "var(--text)"
                    : "var(--text-secondary)",
                background: index === activeIndex ? "var(--s3)" : "transparent",
                transition: "background 0.1s",
              }}
            >
              <Box component="span" sx={{ flex: 1 }}>
                {option.label}
              </Box>
              {option.value === value && (
                <CheckOutlined
                  sx={{ fontSize: 14, flexShrink: 0, color: "var(--muted2)" }}
                />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
