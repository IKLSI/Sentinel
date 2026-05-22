import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { HealthScoreCircle } from "./HealthScoreCircle";

describe("HealthScoreCircle", () => {
  it("renders svg with two circles", () => {
    const { container } = render(<HealthScoreCircle score={85} grade="B" />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2);
  });

  it("uses default size 44 when not specified", () => {
    const { container } = render(<HealthScoreCircle score={75} grade="C" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("44");
    expect(svg?.getAttribute("height")).toBe("44");
  });

  it("uses custom size when provided", () => {
    const { container } = render(
      <HealthScoreCircle score={90} grade="A" size={64} />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("64");
  });

  it("falls back to F config when grade unknown", () => {
    const { container } = render(
      <HealthScoreCircle score={0} grade={"Z" as never} />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
