#!/bin/bash
# Triggers a Vercel redeployment of bsa-action-hub
# Run after context-generator.js to refresh Action Hub data
#
# Usage (local): ./scripts/trigger-action-hub-deploy.sh
# Usage (VPS):   Add to cron after context-generator.js runs
#
# Requires: VERCEL_TOKEN env var or ~/.vercel-token file

TEAM_ID="team_yW3kgnsHeuP0hbIBrcSeVnfe"
PROJECT_NAME="bsa-action-hub"

# Get token from env or file
TOKEN="${VERCEL_TOKEN:-}"
if [ -z "$TOKEN" ] && [ -f "$HOME/.vercel-token" ]; then
  TOKEN=$(cat "$HOME/.vercel-token")
fi
if [ -z "$TOKEN" ]; then
  echo "❌ No VERCEL_TOKEN found (set env var or create ~/.vercel-token)"
  exit 1
fi

# Get latest ready deployment
LATEST=$(curl -s "https://api.vercel.com/v6/deployments?projectId=prj_p1ZCe24nkgKuMgYKtMf3SvXdL2gv&teamId=$TEAM_ID&limit=1&state=READY&target=production" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['deployments'][0]['uid'])" 2>/dev/null)

if [ -z "$LATEST" ]; then
  echo "❌ Could not find latest deployment"
  exit 1
fi

# Trigger redeploy
RESULT=$(curl -s -X POST "https://api.vercel.com/v13/deployments?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$PROJECT_NAME\",\"deploymentId\":\"$LATEST\",\"target\":\"production\"}")

STATUS=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','error'))" 2>/dev/null)

if [ "$STATUS" = "INITIALIZING" ] || [ "$STATUS" = "BUILDING" ]; then
  URL=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('url',''))" 2>/dev/null)
  echo "✅ Action Hub redeploy triggered: $URL"
else
  echo "❌ Deploy failed: $RESULT"
  exit 1
fi
