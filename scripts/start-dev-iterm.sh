#!/bin/bash

# start-dev-iterm.sh - Start backend and frontend in iTerm2 tabs
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
echo -e "${BLUE}  iTerm2 Mode${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Kill occupied ports
echo -e "${YELLOW}🔍 Killing occupied ports...${NC}"
bash "$PROJECT_DIR/scripts/kill-ports.sh"
echo ""

# Step 2: Check if running in iTerm2
if [[ "$TERM_PROGRAM" != "iTerm.app" ]]; then
  echo -e "${RED}❌ This script must be run from iTerm2!${NC}"
  echo -e "${YELLOW}💡 Either:${NC}"
  echo -e "  1. Open iTerm2 and run this script there"
  echo -e "  2. Use: npm run start:dev (for Terminal.app)"
  exit 1
fi

echo -e "${GREEN}✓ Running in iTerm2${NC}"
echo ""

# Step 3: Open frontend in new tab
echo -e "${MAGENTA}📱 Opening frontend in new tab...${NC}"

osascript <<EOF
tell application "iTerm"
  tell current window
    -- Create new tab
    create tab with default profile

    -- Execute command in new tab
    tell current session
      write text "cd \"$PROJECT_DIR\" && npm run dev"
    end tell
  end tell
end tell
EOF

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
