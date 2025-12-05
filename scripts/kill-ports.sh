#!/bin/bash

# kill-ports.sh - Kill processes running on VRCreator2 ports
# Ports: 3001 (backend), 3002 (websocket), 8081 (frontend)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ports to check
PORTS=(3001 3002 8081)

echo -e "${BLUE}🔍 Checking ports ${PORTS[*]}...${NC}"

# Track if any processes were killed
KILLED=false

# Function to kill process gracefully
kill_process() {
  local PID=$1
  local CMD=$2
  local PORT=$3

  echo -e "${YELLOW}⚠️  Found process on port ${PORT}: ${CMD} (PID ${PID})${NC}"

  # Try graceful shutdown first (SIGTERM)
  if kill -15 "$PID" 2>/dev/null; then
    echo -e "   Sent SIGTERM to PID ${PID}..."

    # Wait up to 3 seconds for graceful shutdown
    for i in {1..6}; do
      if ! kill -0 "$PID" 2>/dev/null; then
        echo -e "   ${GREEN}✓${NC} Process ${PID} terminated gracefully"
        return 0
      fi
      sleep 0.5
    done

    # Force kill if still running
    echo -e "   ${RED}⚠${NC} Process didn't terminate, sending SIGKILL..."
    if kill -9 "$PID" 2>/dev/null; then
      echo -e "   ${GREEN}✓${NC} Process ${PID} force killed"
      return 0
    fi
  else
    echo -e "   ${RED}✗${NC} Failed to kill PID ${PID}"
    return 1
  fi
}

# Check each port
for PORT in "${PORTS[@]}"; do
  # Find processes using lsof
  # -i :PORT - check internet files on PORT
  # -t - terse output (PIDs only)
  PIDS=$(lsof -ti :$PORT 2>/dev/null || true)

  if [ -n "$PIDS" ]; then
    # Process each PID
    for PID in $PIDS; do
      # Get process command
      CMD=$(ps -p $PID -o comm= 2>/dev/null || echo "unknown")

      # Safety check: only kill node/npm/tsx processes
      if [[ "$CMD" =~ (node|npm|tsx|vite) ]]; then
        kill_process "$PID" "$CMD" "$PORT"
        KILLED=true
      else
        echo -e "${RED}⚠️  Skipping non-Node process on port ${PORT}: ${CMD} (PID ${PID})${NC}"
        echo -e "   Run manually: kill ${PID}"
      fi
    done
  fi
done

# Final status
if [ "$KILLED" = true ]; then
  echo -e "${GREEN}✅ All processes killed${NC}"
else
  echo -e "${GREEN}✓ No processes running on ports ${PORTS[*]}${NC}"
fi

exit 0
