#!/bin/bash

# start-tmux.sh - Start VRCreator2 in tmux with 3 panes

set -e

SESSION="vrcreator2"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  VRCreator2 tmux Environment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Kill existing session
if tmux has-session -t $SESSION 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Killing existing session...${NC}"
  tmux kill-session -t $SESSION
  sleep 1
fi

# Kill occupied ports
echo -e "${YELLOW}🔍 Killing occupied ports...${NC}"
bash "$(dirname "$0")/kill-ports.sh"
echo ""

echo -e "${GREEN}✓ Starting tmux session...${NC}"

# Check if we're already inside tmux
if [ -n "$TMUX" ]; then
  echo "Error: Already inside tmux. Detach first with Ctrl+B, d"
  exit 1
fi

# Create new session with 3 panes and run commands
tmux new-session -s "$SESSION" \
  \; send-keys 'npm run websocket' C-m \
  \; split-window -h \
  \; send-keys 'npm run backend' C-m \
  \; split-window -h \
  \; send-keys 'npm run dev' C-m \
  \; select-layout even-horizontal \
  \; select-pane -t 0
