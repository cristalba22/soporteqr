#!/usr/bin/env bash
set -euo pipefail

: "${1:?Uso: restore-database.sh <archivo.dump.enc>}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE es obligatorio}"
: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL es obligatorio}"

encrypted_path="$1"
plain_path="$(mktemp)"
trap 'rm -f -- "$plain_path"' EXIT

openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -in "$encrypted_path" -out "$plain_path" -pass env:BACKUP_PASSPHRASE
pg_restore --list "$plain_path" >/dev/null
pg_restore --clean --if-exists --no-owner --no-acl --exit-on-error \
  --dbname="$RESTORE_DATABASE_URL" "$plain_path"
printf 'Restauracion completada en la base indicada.\n'
