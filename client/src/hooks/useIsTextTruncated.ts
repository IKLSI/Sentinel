import { useCallback, useRef, useState } from "react";

export function useIsTextTruncated<T extends HTMLElement>() {
  const [truncated, setTruncated] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((element: T | null) => {
    observerRef.current?.disconnect();
    if (!element) {
      observerRef.current = null;
      return;
    }
    const measure = () =>
      setTruncated(element.scrollWidth > element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    observerRef.current = observer;
  }, []);

  return { ref, truncated };
}
