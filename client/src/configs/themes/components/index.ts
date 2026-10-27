import { buttonComponents } from "./buttons";
import { inputComponents } from "./inputs";
import { overlayComponents } from "./overlays";
import { surfaceComponents } from "./surfaces";

export const baseComponents = {
  ...buttonComponents,
  ...surfaceComponents,
  ...overlayComponents,
  ...inputComponents,
};
