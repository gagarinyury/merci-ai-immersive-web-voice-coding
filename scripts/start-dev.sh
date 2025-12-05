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

# Step 3: Open frontend in new tab using AppleScript
echo -e "${MAGENTA}📱 Opening frontend in new tab...${NC}"

if [[ "$TERMINAL_TYPE" == "iterm" ]]; then
  # iTerm2 approach
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
  # Terminal.app approach - create tab in current window
  # Note: We need to activate Terminal first, then simulate Cmd+T
  osascript <<EOF
tell application "Terminal"
  activate
  tell application "System Events"
    tell process "Terminal"
      keystroke "t" using command down
      delay 0.3
    end tell
  end tell
  delay 0.5
  do script "cd \"$PROJECT_DIR\" && npm run dev" in selected tab of front window
end tell
EOF
fi

echo -e "${GREEN}✅ Frontend tab opened${NC}"
echo ""

# Give the new tab time to initialize
sleep 1

# Step 4: Start backend in current tab
echo -e "${BLUE}🚀 Starting backend in this tab...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Change to project directory and run backend
cd "$PROJECT_DIR"
npm run backend
