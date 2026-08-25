#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL es obligatorio}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE es obligatorio}"

backup_dir="${BACKUP_OUTPUT_DIR:-$(mktemp -d)}"
mkdir -p "$backup_dir"
timestamp="$(date -u +'%Y-%m-%dT%H-%M-%SZ')"
plain_path="$backup_dir/soporteqr-$timestamp.dump"
encrypted_path="$plain_path.enc"

cleanup() {
  rm -f -- "$plain_path"
}
trap cleanup EXIT

pg_dump "$DATABASE_URL" --format=custom --compress=9 --no-owner --no-acl --file="$plain_path"
pg_restore --list "$plain_path" >/dev/null
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 \
  -in "$plain_path" -out "$encrypted_path" -pass env:BACKUP_PASSPHRASE

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  printf 'backup_path=%s\n' "$encrypted_path" >> "$GITHUB_OUTPUT"
  printf 'backup_name=%s\n' "$(basename "$encrypted_path")" >> "$GITHUB_OUTPUT"
else
  printf '%s\n' "$encrypted_path"
fi
