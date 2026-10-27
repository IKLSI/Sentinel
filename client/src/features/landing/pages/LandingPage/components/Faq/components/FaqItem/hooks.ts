import type React from "react";
import { useRef } from "react";
import { LANDING_EASING } from "@/features/landing/constants";

const ANIMATION_MS = 320;
const BORDER_ALLOWANCE = 2;

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useDetailsAnimation = () => {
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

  return { detailsRef, summaryRef, onToggle };
};
