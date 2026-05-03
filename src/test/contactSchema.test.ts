import { describe, it, expect } from "vitest";
import { contactSchema } from "@/domain/contact/contactSchema";

describe("contactSchema", () => {
  it("accepts a valid payload", () => {
    const result = contactSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      subject: "Hello",
      message: "Long enough message",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty subject", () => {
    const result = contactSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      subject: "",
      message: "Hi",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = contactSchema.safeParse({
      name: "Alice",
      email: "not-an-email",
      message: "Hi",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = contactSchema.safeParse({
      name: "  ",
      email: "alice@example.com",
      message: "Hi",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty message", () => {
    const result = contactSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      message: "   ",
    });
    expect(result.success).toBe(false);
  });
});
