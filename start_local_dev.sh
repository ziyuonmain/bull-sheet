#!/usr/bin/env bash
# Local Development & Testing Runner for BullSheet

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PORT=${1:-8080}

echo "============================================================"
echo "🎯 BullSheet Local Testing Environment"
echo "============================================================"

# Run automated unit test suite via native Node test runner
echo "Running automated unit test suite..."
node --test tests/unit/**/*.test.js

if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Aborting server start."
  exit 1
fi
echo "------------------------------------------------------------"

# Clean up any dead/stale processes on port
fuser -k "${PORT}/tcp" 2>/dev/null || true

echo "🚀 Starting BullSheet dev server on port $PORT..."
echo "👉 Local:   http://localhost:$PORT/"
echo "👉 Network: http://$(hostname -I | awk '{print $1}'):$PORT/"
echo "============================================================"
node "$DIR/dev_server.js" "$PORT"
