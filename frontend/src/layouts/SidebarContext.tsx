import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextValue {
  isOpen: boolean;
  isMobile: boolean;
  isCollapsed: boolean;
  toggle: () => void;
  close: () => void;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isOpen: true,
  isMobile: false,
  isCollapsed: false,
  toggle: () => {},
  close: () => {},
  toggleCollapse: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isOpen, setIsOpen] = useState(() => window.innerWidth >= 768);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(true);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("sidebar-collapsed", String(next));
      } catch (e) {
        void e;
      }
      return next;
    });
  };

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isMobile,
        isCollapsed,
        toggle: () => setIsOpen((v) => !v),
        close: () => setIsOpen(false),
        toggleCollapse,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
