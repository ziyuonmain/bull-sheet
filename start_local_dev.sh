#!/usr/bin/env bash
# Intelligent Local Testing Server & Verification for BullSheet

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PORT=${1:-8080}

echo "============================================================"
echo "🎯 BULLSHEET LOCAL DEVELOPMENT & TESTING ENVIRONMENT"
echo "============================================================"
echo "📁 Serving directory: $DIR"

# Run automated tests first
echo "------------------------------------------------------------"
echo "Running automated mechanics and integrity test suites..."
python3 "$DIR/test_verification.py"
python3 "$DIR/test_all_game_mechanics.py"
python3 "$DIR/test_turn_flow.py"
echo "------------------------------------------------------------"

# Function to check if a port is in use
is_port_in_use() {
  python3 -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_STREAM); res = s.connect_ex(('127.0.0.1', $1)); s.close(); exit(0 if res == 0 else 1)"
}

# Find an available port if the specified port is already in use
CURRENT_PORT=$PORT
while is_port_in_use "$CURRENT_PORT"; do
  echo "ℹ️  Port $CURRENT_PORT is already running a server or in use."
  echo "🌐 You can directly open: http://localhost:$CURRENT_PORT/"
  echo "------------------------------------------------------------"
  # Ask or try next port if user wants a dedicated new instance
  CURRENT_PORT=$((CURRENT_PORT + 1))
  break
done

if ! is_port_in_use "$PORT"; then
  echo "🚀 Starting local Python HTTP server on port $PORT..."
  echo "🌐 Local URL:         http://localhost:$PORT/"
  echo "🌐 Local Network IP:  http://$(hostname -I | awk '{print $1}'):$PORT/"
  echo "============================================================"
  echo "Press Ctrl+C to stop the server."
  
  # Optional: open browser if xdg-open exists
  if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:$PORT/" >/dev/null 2>&1 &
  fi

  python3 -m http.server "$PORT" --directory "$DIR"
else
  echo "✅ Server is ALREADY LIVE and serving this directory at:"
  echo "👉 http://localhost:$PORT/"
  echo "👉 http://$(hostname -I | awk '{print $1}'):$PORT/ (for phone / iPad on same WiFi)"
  echo "============================================================"
  if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:$PORT/" >/dev/null 2>&1 &
  fi
fi
