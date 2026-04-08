#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[setup] created .env from .env.example"
fi

echo "[setup] installing dependencies"
npm install

echo "[setup] validating environment"
npm run check:env || true

echo "[setup] building project"
npm run build || {
  echo "[setup] build failed (usually due to missing live credentials or DB); continuing for mocked local mode"
}

echo "[setup] running tests"
npm test || {
  echo "[setup] tests failed; run npm run test:full for detailed diagnostics"
  exit 1
}
