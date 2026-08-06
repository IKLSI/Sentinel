import { useEffect, useState } from "react";

export const useActiveSection = (ids: string[], offset: number) => {
  const [activeId, setActiveId] = useState(ids[0] ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [first] = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (first) setActiveId(first.target.id);
      },
      { rootMargin: `-${offset}px 0px -60% 0px` },
    );
    for (const id of ids) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [ids, offset]);

  return activeId;
};
