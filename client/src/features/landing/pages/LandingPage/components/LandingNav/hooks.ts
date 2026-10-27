import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/features/landing/constants";

const SCROLL_THRESHOLD = 8;

const ACTIVE_SECTION_ROOT_MARGIN = "-45% 0px -50% 0px";

export const useScrolled = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return scrolled;
};

export const useActiveSection = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) setActiveId(id);
          else setActiveId((current) => (current === id ? null : current));
        }
      },
      { rootMargin: ACTIVE_SECTION_ROOT_MARGIN },
    );
    for (const { id } of NAV_LINKS) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  return activeId;
};
