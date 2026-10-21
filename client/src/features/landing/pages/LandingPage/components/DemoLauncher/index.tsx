import type React from "react";
import { Suspense, lazy, useState } from "react";
import { DEMO_MODES, type DemoMode } from "@/features/landing/demo/constants";
import { DemoPlaceholder } from "@/features/landing/pages/LandingPage/components/DemoPlaceholder";

const ProductDemo = lazy(() =>
  import("@/features/landing/pages/LandingPage/components/ProductDemo").then(
    (m) => ({ default: m.ProductDemo }),
  ),
);

export const DemoLauncher: React.FC = () => {
  const [mode, setMode] = useState<DemoMode | null>(null);

  if (!mode) return <DemoPlaceholder onActivate={setMode} />;

  return (
    <Suspense fallback={<DemoPlaceholder />}>
      <ProductDemo openFullscreenOnMount={mode === DEMO_MODES.fullscreen} />
    </Suspense>
  );
};
