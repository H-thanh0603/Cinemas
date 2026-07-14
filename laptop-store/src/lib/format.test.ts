import { describe, it, expect } from "vitest";
import { formatVnd } from "./format";

describe("formatVnd", () => {
  it("formats millions with dots and dong sign", () => {
    expect(formatVnd(18990000)).toBe("18.990.000₫");
  });
  it("formats zero", () => {
    expect(formatVnd(0)).toBe("0₫");
  });
});
