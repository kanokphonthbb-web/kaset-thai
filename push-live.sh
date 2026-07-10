#!/bin/bash
# Push local commits to GitHub so Vercel can deploy them live.
# Run this from a normal Terminal on your own Mac (not through Claude Code):
#   ./push-live.sh
set -e
cd "$(dirname "$0")"

echo "Commits waiting to go live:"
git log --oneline origin/main..HEAD
echo ""
read -p "Push these to origin/main now? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Cancelled."
  exit 0
fi

git push origin main
echo ""
echo "Pushed. Vercel will auto-deploy — check https://vercel.com dashboard or kasettakonthai.com in ~1-2 minutes."
