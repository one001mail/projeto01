import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMixSession, lookupMixSession } from "./mixingApi";

const okJson = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("mixingApi (P4 — targets /api/learning-sessions)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("createMixSession POSTs to /api/learning-sessions with the backend shape", async () => {
    const mock = vi.fn().mockResolvedValue(
      okJson({
        session: {
          id: "11111111-1111-4111-8111-111111111111",
          publicCode: "ABCDEFGHIJ",
          status: "pending",
          subject: "mixing:BTC:0.5:delay=24h",
          inputValue: 0.5,
          computedResult: null,
          createdAt: "2025-07-01T00:00:00.000Z",
          updatedAt: "2025-07-01T00:00:00.000Z",
          expiresAt: "2025-07-02T00:00:00.000Z",
        },
      }),
    );
    globalThis.fetch = mock as unknown as typeof fetch;

    const session = await createMixSession({
      currency: "BTC",
      amount: 0.5,
      outputs: [{ address: "bc1q...", percentage: 100 }],
      delay_hours: 24,
    });

    const [url, init] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/learning-sessions");
    expect(url).not.toContain("mix-sessions");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body as string);
    expect(body.subject).toContain("mixing:BTC");
    expect(body.inputValue).toBe(0.5);
    expect(body.expiresInSeconds).toBe(24 * 3600);

    // Shape adapter — legacy UI contract is preserved.
    expect(session.session_code).toBe("ABCDEFGHIJ");
    expect(session.currency).toBe("BTC");
    expect(session.amount).toBe(0.5);
    expect(session.delay_hours).toBe(24);
    expect(session.outputs).toEqual([{ address: "bc1q...", percentage: 100 }]);
    expect(session.fee_rate).toBeGreaterThan(0);
    expect(session.fee_amount).toBeGreaterThan(0);
    expect(session.net_amount).toBeCloseTo(session.amount - session.fee_amount, 8);
    expect(session.status).toBe("pending");
  });

  it("lookupMixSession GETs /api/learning-sessions/:publicCode and adapts the DTO", async () => {
    const mock = vi.fn().mockResolvedValue(
      okJson({
        session: {
          id: "id-1",
          publicCode: "ZZZZZZZZZZ",
          status: "pending",
          subject: null,
          inputValue: null,
          computedResult: null,
          createdAt: "2025-07-01T00:00:00.000Z",
          updatedAt: "2025-07-01T00:00:00.000Z",
          expiresAt: null,
        },
      }),
    );
    globalThis.fetch = mock as unknown as typeof fetch;

    const result = await lookupMixSession("ZZZZZZZZZZ");

    const [url] = mock.mock.calls[0] as [string];
    expect(url).toContain("/api/learning-sessions/ZZZZZZZZZZ");
    expect(url).not.toContain("mix-sessions");

    expect(result.session_code).toBe("ZZZZZZZZZZ");
    expect(result.status).toBe("pending");
    // Lookup has no request context: defaults are safe, not NaN/undefined.
    expect(result.amount).toBe(0);
    expect(result.outputs).toEqual([]);
    expect(result.deposit_address).toBeNull();
  });

  it("throws on malformed envelope", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(okJson({ notASession: true })) as unknown as typeof fetch;
    await expect(lookupMixSession("AAAAAAAAAA")).rejects.toThrowError(
      /Invalid response/,
    );
  });
});
