#!/bin/bash

# start-dev.sh - Start backend and frontend in separate terminal tabs
# Backend runs in current tab, frontend opens in new tab

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Get absolute project path
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  VRCreator2 Development Environment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Kill occupied ports
echo -e "${YELLOW}🔍 Killing occupied ports...${NC}"
bash "$PROJECT_DIR/scripts/kill-ports.sh"
echo ""

# Step 2: Detect terminal type
TERMINAL_TYPE="unknown"

if [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
  TERMINAL_TYPE="iterm"
  echo -e "${GREEN}✓ Detected: iTerm2${NC}"
elif [[ "$TERM_PROGRAM" == "Apple_Terminal" ]]; then
  TERMINAL_TYPE="terminal"
  echo -e "${GREEN}✓ Detected: Terminal.app${NC}"
else
  # Fallback to Terminal.app
  TERMINAL_TYPE="terminal"
  echo -e "${YELLOW}⚠️  Unknown terminal, using Terminal.app${NC}"
fi

echo ""

# Step 3: Open WebSocket server in new tab
echo -e "${MAGENTA}🔌 Opening WebSocket server in new tab...${NC}"

if [[ "$TERMINAL_TYPE" == "iterm" ]]; then
  osascript <<EOF
tell application "iTerm"
  tell current window
    create tab with default profile
    tell current session
      write text "cd \"$PROJECT_DIR\" && npm run websocket"
    end tell
  end tell
end tell
EOF
else
  osascript -e "tell application \"Terminal\"" \
            -e "  activate" \
            -e "  set currentWindow to front window" \
            -e "  tell application \"System Events\"" \
            -e "    tell process \"Terminal\"" \
            -e "      keystroke \"t\" using {command down}" \
            -e "    end tell" \
            -e "  end tell" \
            -e "  delay 1" \
            -e "  do script \"cd \\\"$PROJECT_DIR\\\" && npm run websocket\" in selected tab of currentWindow" \
            -e "end tell"
fi

echo -e "${GREEN}✅ WebSocket tab opened${NC}"
sleep 1

# Step 4: Open Backend API in new tab
echo -e "${MAGENTA}🔧 Opening Backend API in new tab...${NC}"

if [[ "$TERMINAL_TYPE" == "iterm" ]]; then
  osascript <<EOF
tell application "iTerm"
  tell current window
    create tab with default profile
    tell current session
      write text "cd \"$PROJECT_DIR\" && npm run backend"
    end tell
  end tell
end tell
EOF
else
  osascript -e "tell application \"Terminal\"" \
            -e "  activate" \
            -e "  set currentWindow to front window" \
            -e "  tell application \"System Events\"" \
            -e "    tell process \"Terminal\"" \
            -e "      keystroke \"t\" using {command down}" \
            -e "    end tell" \
            -e "  end tell" \
            -e "  delay 1" \
            -e "  do script \"cd \\\"$PROJECT_DIR\\\" && npm run backend\" in selected tab of currentWindow" \
            -e "end tell"
fi

echo -e "${GREEN}✅ Backend API tab opened${NC}"
sleep 1

# Step 5: Open Frontend in new tab
echo -e "${MAGENTA}📱 Opening Frontend in new tab...${NC}"

if [[ "$TERMINAL_TYPE" == "iterm" ]]; then
  osascript <<EOF
tell application "iTerm"
  tell current window
    create tab with default profile
    tell current session
      write text "cd \"$PROJECT_DIR\" && npm run dev"
    end tell
  end tell
end tell
EOF
else
  osascript -e "tell application \"Terminal\"" \
            -e "  activate" \
            -e "  set currentWindow to front window" \
            -e "  tell application \"System Events\"" \
            -e "    tell process \"Terminal\"" \
            -e "      keystroke \"t\" using {command down}" \
            -e "    end tell" \
            -e "  end tell" \
            -e "  delay 1" \
            -e "  do script \"cd \\\"$PROJECT_DIR\\\" && npm run dev\" in selected tab of currentWindow" \
            -e "end tell"
fi

echo -e "${GREEN}✅ Frontend tab opened${NC}"
echo ""

# Step 6: Done
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All services started in separate tabs:${NC}"
echo -e "${GREEN}   Tab 1: WebSocket Server (port 3002)${NC}"
echo -e "${GREEN}   Tab 2: Backend API (port 3001)${NC}"
echo -e "${GREEN}   Tab 3: Frontend (port 8081)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C in this tab to exit${NC}"

# Keep script running
wait
