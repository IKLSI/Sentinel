import { keyframes } from "@mui/material/styles";

export const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const contentEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const pageItemIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

export const pageProgress = keyframes`
  0% {
    transform: scaleX(0);
    opacity: 1;
  }
  75% {
    transform: scaleX(0.9);
    opacity: 1;
  }
  90% {
    transform: scaleX(1);
    opacity: 1;
  }
  100% {
    transform: scaleX(1);
    opacity: 0;
  }
`;

export const REDUCED_MOTION = "@media (prefers-reduced-motion: reduce)";

export const EASE_OUT_EXPO = "cubic-bezier(0.16, 1, 0.3, 1)";

export const skeletonPulse = keyframes`
  0%, 100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
`;

const delayedReveal = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const DELAYED_REVEAL_SX = {
  animation: `${delayedReveal} 0.25s ease-out 0.3s both`,
  [REDUCED_MOTION]: { animationDuration: "0.01s" },
} as const;

export const toastCountdown = keyframes`
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
`;
