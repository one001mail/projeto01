import { describe, it, expect } from "vitest";
import { createSessionId } from "@/domain/mixing/createSessionId";

describe("createSessionId", () => {
  it("starts with the MIX- prefix", () => {
    expect(createSessionId().startsWith("MIX-")).toBe(true);
  });

  it("returns a non-trivial string", () => {
    expect(createSessionId().length).toBeGreaterThan(8);
  });

  it("returns a different value on each invocation", () => {
    const a = createSessionId();
    const b = createSessionId();
    expect(a).not.toBe(b);
  });

  it("is upper-case after the prefix", () => {
    const id = createSessionId();
    const tail = id.slice(4);
    expect(tail).toBe(tail.toUpperCase());
  });
});
