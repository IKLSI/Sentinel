import { describe, expect, it } from "vitest";
import { Sparkline } from "@/features/dashboard/pages/DashboardPage/components/Sparkline";
import { render } from "@/tests/test-utils";

describe("Sparkline", () => {
  it("trace une courbe à partir de deux points connus", () => {
    const { container } = render(
      <Sparkline values={[1, null, 3]} color="red" />,
    );

    expect(container.querySelectorAll("path")).toHaveLength(1);
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });

  it("ne rend rien sous deux points connus", () => {
    const { container } = render(
      <Sparkline values={[null, 4, null]} color="red" />,
    );

    expect(container.querySelector("svg")).toBeNull();
  });

  it("garde une variation faible discrète au lieu de l'étirer sur toute la hauteur", () => {
    const { container } = render(
      <Sparkline values={[7, 8]} color="red" height={28} />,
    );
    const circle = container.querySelector("circle");

    expect(Number(circle?.getAttribute("cy"))).toBeGreaterThan(3);
  });
});
