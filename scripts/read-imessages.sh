#!/bin/bash
# Read iMessages from macOS Messages database
# Usage:
#   ./read-imessages.sh                    # Last 3 days, 30 messages
#   ./read-imessages.sh 30                 # Last 30 days, 100 messages
#   ./read-imessages.sh 30 50             # Last 30 days, 50 messages
#   ./read-imessages.sh 7 100 "+14805551234"  # Last 7 days, 100 msgs, specific contact
#   ./read-imessages.sh 90 200 "Mike"     # Last 90 days, 200 msgs, search name/number

DB="$HOME/Library/Messages/chat.db"

if [ ! -r "$DB" ]; then
  echo "ERROR: Cannot read iMessage database."
  echo "Fix: System Settings > Privacy & Security > Full Disk Access"
  echo "Add your terminal app (Terminal.app, iTerm, or Warp) to the list."
  exit 1
fi

DAYS="${1:-3}"
LIMIT="${2:-30}"
CONTACT="${3:-}"

if [ -n "$CONTACT" ]; then
  echo "=== iMessages (last $DAYS days, limit $LIMIT, filter: $CONTACT) ==="
  echo ""
  sqlite3 -separator ' | ' "$DB" "
  SELECT
    h.id AS contact,
    CASE WHEN m.is_from_me = 1 THEN 'SENT' ELSE 'RECV' END AS direction,
    datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') AS sent_at,
    SUBSTR(REPLACE(REPLACE(m.text, CHAR(10), ' '), CHAR(13), ' '), 1, 120) AS message
  FROM message m
  JOIN handle h ON m.handle_id = h.ROWID
  WHERE m.date > ((strftime('%s', 'now') - 978307200 - ($DAYS * 86400)) * 1000000000)
    AND m.text IS NOT NULL AND m.text != ''
    AND h.id NOT LIKE '%@apple.com' AND h.id NOT LIKE '%@aps.apple.com'
    AND h.id LIKE '%$CONTACT%'
  ORDER BY m.date DESC
  LIMIT $LIMIT;
  "
else
  echo "=== iMessages (last $DAYS days, limit $LIMIT) ==="
  echo ""
  sqlite3 -separator ' | ' "$DB" "
  SELECT
    h.id AS contact,
    CASE WHEN m.is_from_me = 1 THEN 'SENT' ELSE 'RECV' END AS direction,
    datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') AS sent_at,
    SUBSTR(REPLACE(REPLACE(m.text, CHAR(10), ' '), CHAR(13), ' '), 1, 120) AS message
  FROM message m
  JOIN handle h ON m.handle_id = h.ROWID
  WHERE m.date > ((strftime('%s', 'now') - 978307200 - ($DAYS * 86400)) * 1000000000)
    AND m.text IS NOT NULL AND m.text != ''
    AND h.id NOT LIKE '%@apple.com' AND h.id NOT LIKE '%@aps.apple.com'
  ORDER BY m.date DESC
  LIMIT $LIMIT;
  "
fi
