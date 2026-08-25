#!/usr/bin/env bash
set -euo pipefail

: "${1:?Uso: verify-backup.sh <archivo.dump.enc>}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE es obligatorio}"

encrypted_path="$1"
plain_path="$(mktemp)"
trap 'rm -f -- "$plain_path"' EXIT

openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -in "$encrypted_path" -out "$plain_path" -pass env:BACKUP_PASSPHRASE
pg_restore --list "$plain_path" >/dev/null
printf 'Backup valido: %s\n' "$(basename "$encrypted_path")"
