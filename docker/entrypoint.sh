#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] aplicando migrations…"
  node scripts/migrate.mjs
fi

exec node .output/server/index.mjs
