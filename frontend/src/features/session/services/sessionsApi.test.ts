import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSession } from "./sessionsApi";

const okJson = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("sessionsApi (P4 — targets /api/learning-sessions)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("createSession POSTs to /api/learning-sessions and echoes request context", async () => {
    const mock = vi.fn().mockResolvedValue(
      okJson({
        session: {
          id: "22222222-2222-4222-8222-222222222222",
          publicCode: "KKKKKKKKKK",
          status: "pending",
          subject: "session:sepolia:ETH",
          inputValue: null,
          computedResult: null,
          createdAt: "2025-07-01T00:00:00.000Z",
          updatedAt: "2025-07-01T00:00:00.000Z",
          expiresAt: null,
        },
      }),
    );
    globalThis.fetch = mock as unknown as typeof fetch;

    const session = await createSession({
      network: "sepolia",
      asset: "ETH",
      output_address: "0xabc",
    });

    const [url] = mock.mock.calls[0] as [string];
    expect(url).toContain("/api/learning-sessions");
    expect(url).not.toContain("/api/sessions");

    expect(session.session_id).toBe("22222222-2222-4222-8222-222222222222");
    expect(session.session_code).toBe("KKKKKKKKKK");
    expect(session.network).toBe("sepolia");
    expect(session.asset).toBe("ETH");
    expect(session.output_address).toBe("0xabc");
    expect(session.status).toBe("pending");
  });

  it("re-throws a plain Error with the server-provided message on ApiError", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: "nope" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
      ) as unknown as typeof fetch;

    const err = await createSession({
      network: "sepolia",
      asset: "ETH",
      output_address: "0xabc",
    }).catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("nope");
  });
});
