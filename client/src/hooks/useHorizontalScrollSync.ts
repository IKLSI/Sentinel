import { useCallback, useEffect, useRef, useState } from "react";

export const useHorizontalScrollSync = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const [body, setBody] = useState<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    if (!body || typeof ResizeObserver === "undefined") return;
    const measure = () =>
      setOverflowing(body.scrollWidth > body.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, [body]);

  const syncHeader = useCallback(() => {
    if (headerRef.current && body)
      headerRef.current.scrollLeft = body.scrollLeft;
  }, [body]);

  return { headerRef, bodyRef: setBody, body, overflowing, syncHeader };
};
