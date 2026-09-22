#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/Users/aksingh/.gemini/antigravity/scratch/hollywood-time"
LOCK_DIR="$PROJECT_DIR/data/autopost.lock"
LOGS_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOGS_DIR"
cd "$PROJECT_DIR"

if mkdir "$LOCK_DIR" 2>/dev/null; then
  trap 'rmdir "$LOCK_DIR"' EXIT
else
  if [ -d "$LOCK_DIR" ] && [ -n "$(find "$LOCK_DIR" -maxdepth 0 -mmin +15 -print -quit 2>/dev/null)" ]; then
    rmdir "$LOCK_DIR" 2>/dev/null || true
    mkdir "$LOCK_DIR"
    trap 'rmdir "$LOCK_DIR"' EXIT
  else
    echo "$(date '+%Y-%m-%d %H:%M:%S') | INFO | autopost | Previous sync still active; skipping this 5-min cycle." >> "$LOGS_DIR/autopost.log"
    exit 0
  fi
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') | INFO | autopost | Starting 5-min auto-post check..." >> "$LOGS_DIR/autopost.log"
set +e
/usr/local/bin/node "$PROJECT_DIR/scripts/auto-poster.js" --once >> "$LOGS_DIR/autopost.log" 2>&1 || node "$PROJECT_DIR/scripts/auto-poster.js" --once >> "$LOGS_DIR/autopost.log" 2>&1
STATUS=$?
set -e

if [ "$STATUS" -ne 0 ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') | ERROR | autopost | 5-min sync failed with status $STATUS." >> "$LOGS_DIR/autopost.log"
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') | INFO | autopost | 5-min sync completed successfully." >> "$LOGS_DIR/autopost.log"
fi
exit "$STATUS"
