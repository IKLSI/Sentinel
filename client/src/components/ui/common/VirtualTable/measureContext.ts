import { createContext } from "react";

export const VirtualRowMeasureContext = createContext<
  ((element: Element | null) => void) | null
>(null);
