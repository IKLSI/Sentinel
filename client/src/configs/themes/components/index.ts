import { buttonComponents } from "./buttons";
import { inputComponents } from "./inputs";
import { overlayComponents } from "./overlays";
import { surfaceComponents } from "./surfaces";
import { tableComponents } from "./tables";

export const baseComponents = {
  ...buttonComponents,
  ...surfaceComponents,
  ...overlayComponents,
  ...inputComponents,
  ...tableComponents,
};
