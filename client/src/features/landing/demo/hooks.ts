import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  DEMO_CANVAS_HEIGHT,
  DEMO_CANVAS_WIDTH,
  DEMO_FULLSCREEN_GUTTER,
  DEMO_MAX_SCALE,
} from "@/features/landing/demo/constants";

const windowFitScale = () =>
  Math.min(
    DEMO_MAX_SCALE,
    (window.innerWidth - DEMO_FULLSCREEN_GUTTER) / DEMO_CANVAS_WIDTH,
    (window.innerHeight - DEMO_FULLSCREEN_GUTTER) / DEMO_CANVAS_HEIGHT,
  );

export const useContainerFitScale = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [scale, setScale] = useState(DEMO_MAX_SCALE);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      if (element.clientWidth > 0)
        setScale(element.clientWidth / DEMO_CANVAS_WIDTH);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, scale };
};

export const useWindowFitScale = () => {
  const [scale, setScale] = useState(windowFitScale);

  useEffect(() => {
    const update = () => setScale(windowFitScale());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
};
