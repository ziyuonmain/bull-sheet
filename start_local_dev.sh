#!/usr/bin/env bash
# Local Development & Testing Runner for BullSheet

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PORT=${1:-8080}

echo "============================================================"
echo "🎯 BullSheet Local Testing Environment"
echo "============================================================"

# Run standard unittest test suite
echo "Running automated test suite (python3 -m unittest discover tests)..."
python3 -m unittest discover "$DIR/tests" -v
if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Aborting server start."
  exit 1
fi
echo "------------------------------------------------------------"

# Clean up any dead/stale processes on port
fuser -k "${PORT}/tcp" 2>/dev/null || true

echo "🚀 Starting multi-threaded HTTP server on port $PORT..."
echo "👉 Local:   http://localhost:$PORT/"
echo "👉 Network: http://$(hostname -I | awk '{print $1}'):$PORT/"
echo "============================================================"
python3 "$DIR/dev_server.py" "$PORT"
