#!/usr/bin/env bash
# Helper for running the shim outside supervisor (local dev).
# Production preview is launched by supervisord with `uvicorn server:app`.
set -euo pipefail
cd "$(dirname "$0")/.."
exec /root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --reload
