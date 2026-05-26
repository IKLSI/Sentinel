import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { STORAGE_KEYS } from "@/constants/storage";

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
      return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === "true";
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

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
      } catch (e) {
        void e;
      }
      return next;
    });
  }, []);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<SidebarContextValue>(
    () => ({ isOpen, isMobile, isCollapsed, toggle, close, toggleCollapse }),
    [isOpen, isMobile, isCollapsed, toggle, close, toggleCollapse],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};
