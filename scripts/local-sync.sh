#!/bin/bash
# Local auto-sync: Google Meet transcripts + context briefing
# Runs every 15 min via launchd (com.bettersystems.context-sync)

cd "/Users/rodolfoalvarez/Documents/Better Systems AI Business/www.BetterSystems.ai"
export PATH="/opt/homebrew/bin:$PATH"

LOG=/tmp/context-sync.log
echo "$(date) === LOCAL SYNC ===" >> $LOG

# 1. Sync Google Meet transcripts (if tokens exist)
if [ -f "$HOME/.config/google-meet-sync/tokens.json" ]; then
  node scripts/sync-google-meet.js >> $LOG 2>&1
fi

# 2. Sync audio files from VPS
rsync -az --ignore-existing root@143.198.74.96:/opt/context-engine/data/plaud-audio/ data/plaud-audio/ >> $LOG 2>&1

# 3. Fetch latest context briefing
node scripts/fetch-context.js --write >> $LOG 2>&1

echo "$(date) === DONE ===" >> $LOG

# Keep log from growing forever
tail -200 $LOG > $LOG.tmp && mv $LOG.tmp $LOG
