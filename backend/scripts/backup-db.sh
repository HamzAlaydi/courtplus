#!/usr/bin/env bash
#
# Nightly Postgres backup for the Court+ production stack.
#
# Before this existed there was NO backup of any kind: production data lived
# only in the `pgdata` Docker volume on a single EC2 instance. Losing that
# volume — instance termination, EBS failure, a disk-full corruption, or a
# stray `docker compose down -v` — destroyed every booking, payment and user
# record with no way back. The recovery point objective was "everything".
#
# Install on the server (as the deploy user):
#   crontab -e
#   15 2 * * * /home/ec2-user/courtplus/backend/scripts/backup-db.sh >> /var/log/courtplus-backup.log 2>&1
#
# PREREQUISITES on the host (neither ships with this repo — verify first):
#   - the AWS CLI (`command -v aws`). The api image is node:22-alpine and has
#     no aws tooling; this script runs on the HOST, not in the container.
#   - a DEDICATED IAM principal for backups. Do NOT reuse the courtplus-backend
#     user: OPERATIONS.md records it as holding S3 FullAccess and its keys live
#     in backend/.env on this same box, so anyone who reaches the instance could
#     delete the backups too. Grant s3:PutObject on the backup bucket only, and
#     enable S3 Versioning + Object Lock so history cannot be erased from here.
#
# Required env, in /etc/courtplus-backup.env (chmod 600):
#   BACKUP_S3_BUCKET    e.g. s3://courtplus-backups
#   BACKUP_RETAIN_DAYS  local retention, defaults to 14
#   AWS_PROFILE         defaults to `courtplus`
#
# Restoring is documented in OPERATIONS.md. Run a restore drill quarterly —
# an untested backup is not a backup.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT}/docker-compose.prod.yml"
BACKUP_DIR="${ROOT}/backups"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
ARCHIVE="courtplus-${STAMP}.sql.gz"

# shellcheck disable=SC1091
[ -f /etc/courtplus-backup.env ] && . /etc/courtplus-backup.env

RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

if [ -n "${BACKUP_S3_BUCKET:-}" ] && ! command -v aws >/dev/null 2>&1; then
	echo "ERROR: BACKUP_S3_BUCKET is set but the AWS CLI is not installed on this host."
	echo "       Install it, or the dump will never leave the machine it is protecting."
	exit 1
fi

echo "[$(date -u +%FT%TZ)] starting backup -> ${ARCHIVE}"

# Plain SQL rather than --format=custom: a restore then never depends on a
# matching pg_restore version, which matters when you are restoring at 3am
# onto whatever host is available.
docker compose -f "$COMPOSE_FILE" exec -T db \
	pg_dump -U "${DATABASE_USERNAME:-postgres}" -d "${DATABASE_NAME:-courtplus}" \
	--no-owner --no-privileges \
	| gzip -9 > "${BACKUP_DIR}/${ARCHIVE}"

# A truncated dump that still exits 0 is the classic silent backup failure.
SIZE=$(stat -c%s "${BACKUP_DIR}/${ARCHIVE}" 2>/dev/null || stat -f%z "${BACKUP_DIR}/${ARCHIVE}")
if [ "$SIZE" -lt 10000 ]; then
	echo "ERROR: dump is only ${SIZE} bytes — treating as failed. Nothing pruned."
	exit 1
fi
echo "[$(date -u +%FT%TZ)] dump ok (${SIZE} bytes)"

# Off-box copy. A backup stored on the machine it protects is not a backup:
# the most likely failure destroys both.
if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
	aws s3 cp "${BACKUP_DIR}/${ARCHIVE}" "${BACKUP_S3_BUCKET}/${ARCHIVE}" \
		--profile "${AWS_PROFILE:-courtplus}" \
		--storage-class STANDARD_IA \
		--sse AES256
	echo "[$(date -u +%FT%TZ)] uploaded to ${BACKUP_S3_BUCKET}/${ARCHIVE}"
else
	echo "WARNING: BACKUP_S3_BUCKET is unset — this backup exists only on the host it is protecting."
fi

# Prune local copies only; S3 lifecycle rules own long-term retention.
find "$BACKUP_DIR" -name 'courtplus-*.sql.gz' -mtime "+${RETAIN_DAYS}" -delete

echo "[$(date -u +%FT%TZ)] backup complete"
