#!/bin/sh
set -eu

if [ "$(id -u)" = "0" ]; then
  mkdir -p "${UPLOAD_DIR:?UPLOAD_DIR es obligatorio}"
  chown node:node "$UPLOAD_DIR"
  exec gosu node "$@"
fi

exec "$@"
