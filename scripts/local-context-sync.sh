#!/bin/bash
# Pulls latest briefing from Supabase and writes to Claude Code memory
cd "$(dirname "$0")/.."
export DATABASE_URL="postgresql://postgres.nnkuwtfktblqlfjugnrj:jesvum-kawrAf-9penwi@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
/opt/homebrew/bin/node scripts/fetch-context.js --write
