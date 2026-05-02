"""
backend/server.py — Python/FastAPI compatibility shim.

Why this file exists:
  The Emergent preview's `supervisord` is **read-only** and pinned to:
      uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1 --reload
      (directory=/app/backend)
  Yet the real backend is now Node 20 + TypeScript + Fastify (Clean
  Architecture / DDD), per the PROMPT MESTRE. To honour both constraints
  this file does **only one thing**: spawn the Fastify process on a
  loopback-only port (default 8081) and reverse-proxy every request to it.

Hard rules (sandbox-only contract):
  * No business logic. Ever. This file MUST stay a transport adapter.
  * No blockchain, no transaction broadcast, no custody, no mixing logic.
  * No PII handling — request/response bodies are forwarded as raw bytes.
  * No `process.env` access for app config — the Node app reads its own
    Zod-validated `Config`. The shim only reads two transport variables:
    `FASTIFY_HOST`, `FASTIFY_PORT`.

Lifecycle:
  1. FastAPI lifespan startup -> spawn Node subprocess if loopback port
     is free; create a long-lived `httpx.AsyncClient`; poll /health until
     ready (or timeout).
  2. Steady state -> proxy every request, streaming both directions.
  3. Lifespan shutdown -> close client, SIGTERM the Node subprocess,
     escalate to SIGKILL after a short grace.

This module exposes only the symbol `app` (FastAPI instance), as required
by supervisor's invocation.
"""

from __future__ import annotations

import asyncio
import os
import socket
import subprocess
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse

# ---------------------------------------------------------------------------
# Transport configuration. The shim must NOT read application config.
# ---------------------------------------------------------------------------
ROOT = Path(__file__).parent
UPSTREAM_HOST = os.environ.get("FASTIFY_HOST", "127.0.0.1")
UPSTREAM_PORT = int(os.environ.get("FASTIFY_PORT", "8081"))
UPSTREAM_BASE = f"http://{UPSTREAM_HOST}:{UPSTREAM_PORT}"
SPAWN_TIMEOUT_SECONDS = float(os.environ.get("FASTIFY_SPAWN_TIMEOUT", "60"))
PROXY_TIMEOUT_SECONDS = float(os.environ.get("FASTIFY_PROXY_TIMEOUT", "30"))

# Hop-by-hop headers per RFC 7230 §6.1 — must NOT be forwarded.
_HOP_BY_HOP = frozenset(
    {
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailers",
        "transfer-encoding",
        "upgrade",
        "host",
        "content-length",  # httpx will set this from the streamed body
    }
)

# ---------------------------------------------------------------------------
# Process management
# ---------------------------------------------------------------------------
_proc: subprocess.Popen | None = None


def _is_port_open(host: str, port: int, timeout: float = 0.4) -> bool:
    """True if *something* is already listening on (host, port)."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        sock.connect((host, port))
        return True
    except OSError:
        return False
    finally:
        try:
            sock.close()
        except OSError:
            pass


def _spawn_fastify() -> subprocess.Popen | None:
    """Spawn the Node Fastify process, unless one is already listening.

    Prefers `dist/index.js` (production build) and falls back to
    `tsx src/index.ts` (development). The child inherits stdout/stderr so
    Fastify's Pino logs are visible in supervisor's backend.out.log.
    """
    if _is_port_open(UPSTREAM_HOST, UPSTREAM_PORT):
        print(
            f"[shim] upstream already listening on {UPSTREAM_BASE}; "
            "skipping spawn.",
            file=sys.stderr,
            flush=True,
        )
        return None

    env = os.environ.copy()
    env["HOST"] = UPSTREAM_HOST
    env["PORT"] = str(UPSTREAM_PORT)
    env.setdefault("NODE_ENV", "development")
    # Disable workers in tests; the shim never starts under test.
    env.setdefault("WORKERS_ENABLED", "true")

    dist = ROOT / "dist" / "index.js"
    if dist.exists():
        cmd = ["node", str(dist)]
    else:
        # Use yarn so we use the project's local tsx and tsconfig.
        cmd = ["yarn", "--silent", "dev:no-watch"]
        # If yarn script missing, fall back to npx tsx.
        # (start-shim.sh in scripts/ is the canonical entrypoint.)
        if not (ROOT / "package.json").exists():
            cmd = ["npx", "--yes", "tsx", "src/index.ts"]

    print(f"[shim] spawning upstream: {' '.join(cmd)} (cwd={ROOT})", file=sys.stderr, flush=True)

    return subprocess.Popen(
        cmd,
        cwd=str(ROOT),
        env=env,
        stdout=sys.stdout,
        stderr=sys.stderr,
        # Same process group: when supervisor kills python, Fastify dies too.
    )


async def _wait_for_upstream(client: httpx.AsyncClient) -> bool:
    deadline = time.monotonic() + SPAWN_TIMEOUT_SECONDS
    last_err: str | None = None
    while time.monotonic() < deadline:
        try:
            r = await client.get("/health", timeout=2.0)
            if r.status_code < 500:
                return True
            last_err = f"upstream /health returned {r.status_code}"
        except Exception as e:  # noqa: BLE001 — transport probe is best-effort
            last_err = f"{e.__class__.__name__}: {e}"
        await asyncio.sleep(0.4)
    print(f"[shim] upstream did not become healthy: {last_err}", file=sys.stderr, flush=True)
    return False


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    global _proc
    _proc = _spawn_fastify()

    client = httpx.AsyncClient(
        base_url=UPSTREAM_BASE,
        timeout=httpx.Timeout(PROXY_TIMEOUT_SECONDS, connect=5.0),
        # Reuse connections to the same loopback host.
        limits=httpx.Limits(max_connections=200, max_keepalive_connections=50),
    )
    app.state.client = client
    app.state.upstream_ready = await _wait_for_upstream(client)

    try:
        yield
    finally:
        try:
            await client.aclose()
        except Exception:  # noqa: BLE001 — closing must not block teardown
            pass
        if _proc is not None and _proc.poll() is None:
            try:
                _proc.terminate()
                try:
                    _proc.wait(timeout=5.0)
                except subprocess.TimeoutExpired:
                    _proc.kill()
            except Exception:  # noqa: BLE001
                pass


app = FastAPI(
    title="backend-shim",
    description=(
        "Transparent reverse proxy in front of the Node/Fastify backend. "
        "This file holds NO business logic — it exists only to satisfy the "
        "read-only supervisord configuration of the Emergent preview."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


@app.get("/health-shim")
async def health_shim() -> dict:
    """Health probe of the shim itself + upstream Fastify."""
    client: httpx.AsyncClient = app.state.client
    try:
        r = await client.get("/health", timeout=2.0)
        upstream = "ok" if r.status_code < 500 else f"degraded:{r.status_code}"
    except Exception as e:  # noqa: BLE001
        upstream = f"down:{e.__class__.__name__}"
    return {
        "shim": "ok",
        "upstream": upstream,
        "upstream_url": UPSTREAM_BASE,
        "role": "reverse-proxy",
    }


@app.api_route(
    "/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(full_path: str, request: Request):
    """Catch-all reverse proxy.

    Forwards method, path, query, headers (minus hop-by-hop) and body to
    the Fastify upstream and streams the response back unchanged.
    """
    client: httpx.AsyncClient = app.state.client

    headers = {
        k: v for k, v in request.headers.items() if k.lower() not in _HOP_BY_HOP
    }
    # Preserve original client IP for downstream rate-limit / audit logging.
    client_host = request.client.host if request.client else ""
    if client_host:
        prior = headers.get("x-forwarded-for")
        headers["x-forwarded-for"] = (
            f"{prior}, {client_host}" if prior else client_host
        )
        headers.setdefault("x-forwarded-proto", request.url.scheme)
        headers.setdefault("x-forwarded-host", request.headers.get("host", ""))

    upstream_url = f"/{full_path}"
    body = await request.body()

    try:
        upstream_req = client.build_request(
            method=request.method,
            url=upstream_url,
            headers=headers,
            params=request.query_params,
            content=body if body else None,
        )
        upstream_resp = await client.send(upstream_req, stream=True)
    except httpx.RequestError as e:
        return JSONResponse(
            status_code=502,
            content={
                "error": {
                    "code": "BAD_GATEWAY",
                    "message": "Upstream Fastify unreachable through shim.",
                    "detail": e.__class__.__name__,
                }
            },
        )

    response_headers = {
        k: v
        for k, v in upstream_resp.headers.items()
        if k.lower() not in _HOP_BY_HOP
    }

    async def streamer() -> AsyncIterator[bytes]:
        try:
            async for chunk in upstream_resp.aiter_raw():
                yield chunk
        finally:
            try:
                await upstream_resp.aclose()
            except Exception:  # noqa: BLE001
                pass

    return StreamingResponse(
        streamer(),
        status_code=upstream_resp.status_code,
        headers=response_headers,
        media_type=upstream_resp.headers.get("content-type"),
    )
