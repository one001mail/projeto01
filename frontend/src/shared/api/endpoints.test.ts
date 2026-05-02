import { describe, expect, it } from "vitest";
import { endpoints } from "./endpoints";

describe("endpoints map (P4 — learning-sessions)", () => {
  it("builds the learning-sessions paths", () => {
    expect(endpoints.learningSessions.create()).toBe("/api/learning-sessions");
    expect(endpoints.learningSessions.byPublicCode("ABCDEFGHIJ")).toBe(
      "/api/learning-sessions/ABCDEFGHIJ",
    );
  });

  it("URL-encodes public codes so injections are safe", () => {
    expect(endpoints.learningSessions.byPublicCode("../admin")).toBe(
      "/api/learning-sessions/..%2Fadmin",
    );
    expect(endpoints.learningSessions.byPublicCode("a b")).toBe(
      "/api/learning-sessions/a%20b",
    );
  });

  it("keeps contact-requests and adds pricing + admin health", () => {
    expect(endpoints.contactRequests.create()).toBe("/api/contact-requests");
    expect(endpoints.pricing()).toBe("/api/pricing");
    expect(endpoints.adminHealth()).toBe("/api/admin/health");
  });

  it("does not expose the removed legacy keys", () => {
    const asRecord = endpoints as unknown as Record<string, unknown>;
    expect(asRecord.mixSessions).toBeUndefined();
    expect(asRecord.sessions).toBeUndefined();
  });
});
