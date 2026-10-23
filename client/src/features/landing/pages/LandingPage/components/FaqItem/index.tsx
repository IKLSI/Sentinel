import type React from "react";
import { useRef } from "react";
import Box from "@mui/material/Box";
import { LANDING_EASING } from "@/features/landing/constants";

interface FaqItemProps {
  question: string;
  answer: string;
}

const ANIMATION_MS = 320;
const BORDER_ALLOWANCE = 2;

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const animationRef = useRef<Animation | null>(null);

  const animateHeight = (
    details: HTMLDetailsElement,
    from: number,
    to: number,
    onEnd: () => void,
  ) => {
    animationRef.current?.cancel();
    if (typeof details.animate !== "function") {
      onEnd();
      return;
    }
    const animation = details.animate(
      { height: [`${from}px`, `${to}px`] },
      {
        duration: prefersReducedMotion() ? 0 : ANIMATION_MS,
        easing: LANDING_EASING,
      },
    );
    animationRef.current = animation;
    animation.onfinish = () => {
      animationRef.current = null;
      onEnd();
    };
    animation.oncancel = () => {
      animationRef.current = null;
    };
  };

  const onToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    const details = detailsRef.current;
    const summary = summaryRef.current;
    if (!details || !summary) return;
    const start = details.offsetHeight;

    if (details.open && details.dataset.phase !== "opening") {
      details.dataset.phase = "closing";
      animateHeight(
        details,
        start,
        summary.offsetHeight + BORDER_ALLOWANCE,
        () => {
          details.open = false;
          delete details.dataset.phase;
        },
      );
      return;
    }

    details.open = true;
    details.dataset.phase = "opening";
    const end = details.scrollHeight + BORDER_ALLOWANCE;
    requestAnimationFrame(() => {
      if (details.dataset.phase === "opening") delete details.dataset.phase;
    });
    animateHeight(details, start, end, () => {});
  };

  return (
    <Box
      component="details"
      ref={detailsRef}
      sx={{
        border: "1px solid var(--line)",
        borderRadius: "14px",
        background: "var(--page)",
        overflow: "hidden",
        transition: "border-color .2s, box-shadow .2s",
        "&:hover": { borderColor: "var(--indigo-200)" },
        "&[open]": {
          borderColor: "var(--indigo-200)",
          boxShadow:
            "0 10px 30px -18px color-mix(in srgb, var(--indigo) 35%, transparent)",
        },
        "& > summary::after": {
          content: '""',
          flex: "none",
          width: 8,
          height: 8,
          mr: "4px",
          borderStyle: "solid",
          borderColor: "var(--ink)",
          borderWidth: "0 2px 2px 0",
          transform: "translateY(-2px) rotate(45deg)",
          transition: `transform .3s ${LANDING_EASING}`,
        },
        "&[open]:not([data-phase=closing]) > summary::after": {
          transform: "translateY(2px) rotate(-135deg)",
        },
        "& > p": {
          transition: `opacity .25s ease, transform .3s ${LANDING_EASING}`,
        },
        "&[data-phase] > p": { opacity: 0, transform: "translateY(-4px)" },
        "@media (prefers-reduced-motion: reduce)": {
          "& > summary::after, & > p": { transition: "none" },
        },
      }}
    >
      <Box
        component="summary"
        ref={summaryRef}
        onClick={onToggle}
        sx={{
          listStyle: "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          p: "20px 24px",
          fontSize: "16px",
          fontWeight: 600,
          "&::-webkit-details-marker": { display: "none" },
          "&:focus-visible": {
            outline: "2px solid var(--indigo)",
            outlineOffset: "-2px",
            borderRadius: "14px",
          },
        }}
      >
        {question}
      </Box>
      <Box
        component="p"
        sx={{
          m: 0,
          px: "24px",
          pb: "22px",
          fontSize: "15.5px",
          color: "var(--ink-2)",
        }}
      >
        {answer}
      </Box>
    </Box>
  );
};
