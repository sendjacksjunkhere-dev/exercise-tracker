import { describe, expect, it } from "vitest";
import { stripLeadingZeros } from "./numberInput";

describe("stripLeadingZeros", () => {
  it("strips multiple leading zeros before a non-zero digit", () => {
    expect(stripLeadingZeros("007")).toBe("7");
  });

  it("strips a single leading zero before another digit", () => {
    expect(stripLeadingZeros("05")).toBe("5");
  });

  it("leaves a lone zero alone", () => {
    expect(stripLeadingZeros("0")).toBe("0");
  });

  it("leaves a zero followed by a decimal point alone", () => {
    expect(stripLeadingZeros("0.5")).toBe("0.5");
  });

  it("strips leading zeros before the integer part even with a decimal", () => {
    expect(stripLeadingZeros("05.5")).toBe("5.5");
  });

  it("leaves values with no leading zero unchanged", () => {
    expect(stripLeadingZeros("10")).toBe("10");
  });

  it("leaves an empty string unchanged", () => {
    expect(stripLeadingZeros("")).toBe("");
  });
});
