import type React from "react";
import { useLocation } from "@tanstack/react-router";

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = useLocation({ select: (location) => location.pathname });
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
};
