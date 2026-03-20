#!/bin/bash
echo "🚀 Deploying Mission Control..."
git add .
git commit -m "update: $(date '+%Y-%m-%d %H:%M')"
git push
echo "✅ Done! Changes live at https://jazzyboi666.github.io/mission-control/"
