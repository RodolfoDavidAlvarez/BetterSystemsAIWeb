#!/bin/bash
# Local Pipeline: Plaud sync + MLX Whisper transcription + context briefing
# Runs every 15 min via launchd (com.bettersystems.context-sync)
#
# Flow:
#   1. Sync Google Meet transcripts (if configured)
#   2. Pull new recordings from Plaud cloud
#   3. Transcribe pending recordings with MLX Whisper (free, local)
#   4. Generate context briefing

cd "/Users/rodolfoalvarez/Documents/Better Systems AI Business/www.BetterSystems.ai"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

LOG=/tmp/context-sync.log
echo "$(date) === LOCAL PIPELINE ===" >> $LOG

# 1. Sync Google Meet transcripts (if tokens exist)
if [ -f "$HOME/.config/google-meet-sync/tokens.json" ]; then
  echo "$(date) Google Meet sync..." >> $LOG
  node scripts/sync-google-meet.js >> $LOG 2>&1
fi

# 2. Pull new recordings from Plaud cloud
echo "$(date) Plaud sync..." >> $LOG
node scripts/plaud-sync.js >> $LOG 2>&1

# 3. Transcribe pending recordings with MLX Whisper (limit 5 per run to avoid hogging CPU)
echo "$(date) Local transcription (MLX Whisper)..." >> $LOG
node scripts/local-transcribe.js --limit 5 >> $LOG 2>&1

# 4. Generate context briefing
echo "$(date) Context briefing..." >> $LOG
node scripts/fetch-context.js --write >> $LOG 2>&1

echo "$(date) === DONE ===" >> $LOG

# Keep log from growing forever
tail -500 $LOG > $LOG.tmp && mv $LOG.tmp $LOG
