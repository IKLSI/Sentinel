import React from "react";
import logoSvg from "@/assets/sentinel-logo.svg?raw";

interface Props {
  width?: number;
  height?: number;
}

export const SentinelLogo: React.FC<Props> = ({ width = 28, height = 32 }) => (
  <span
    aria-hidden="true"
    style={{
      display: "inline-flex",
      flexShrink: 0,
      width,
      height,
      lineHeight: 0,
    }}
    dangerouslySetInnerHTML={{ __html: logoSvg }}
  />
);
