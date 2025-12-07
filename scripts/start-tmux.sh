#!/bin/bash

# start-tmux.sh - Start VRCreator2 in tmux with 3 panes
# Layout:
# ┌──────────┬──────────┐
# │ Backend  │ Frontend │
# │ :3001    │ :8081    │
# │ :3002    │          │
# ├──────────┴──────────┤
# │ Terminal (commands) │
# └─────────────────────┘

set -e

SESSION="vrcreator2"

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  VRCreator2 tmux Environment (3 panes)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Kill existing session if it exists
if tmux has-session -t $SESSION 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Killing existing tmux session...${NC}"
  tmux kill-session -t $SESSION
  sleep 1
fi

# Kill occupied ports
echo -e "${YELLOW}🔍 Killing occupied ports...${NC}"
bash "$(dirname "$0")/kill-ports.sh"
echo ""

# Create new tmux session (detached)
echo -e "${GREEN}✓ Creating tmux session: $SESSION${NC}"
tmux new-session -d -s $SESSION -n "VRCreator2"

# Split window vertically (left/right)
echo -e "${GREEN}✓ Creating 3-pane layout...${NC}"
tmux split-window -h -t $SESSION

# Split left pane horizontally (top/bottom)
tmux split-window -v -t $SESSION:0.0

# Adjust layout: Backend (top-left 40%), Frontend (right 50%), Terminal (bottom-left 10%)
tmux resize-pane -t $SESSION:0.1 -x 100  # Frontend pane width (right side)
tmux resize-pane -t $SESSION:0.2 -y 15   # Terminal pane height (bottom-left)

# Start backend in top-left pane (pane 0)
echo -e "${GREEN}✓ Starting backend (top-left: ports 3001, 3002)...${NC}"
tmux select-pane -t $SESSION:0.0
tmux send-keys -t $SESSION:0.0 "npm run backend" C-m

# Start frontend in top-right pane (pane 1)
echo -e "${GREEN}✓ Starting frontend (top-right: port 8081)...${NC}"
tmux select-pane -t $SESSION:0.1
tmux send-keys -t $SESSION:0.1 "npm run dev" C-m

# Bottom pane (pane 2) - terminal for commands
echo -e "${GREEN}✓ Terminal ready (bottom pane)${NC}"
tmux select-pane -t $SESSION:0.2
tmux send-keys -t $SESSION:0.2 "clear" C-m
tmux send-keys -t $SESSION:0.2 "echo -e '${MAGENTA}📌 Terminal ready for commands${NC}'" C-m
tmux send-keys -t $SESSION:0.2 "echo -e '${YELLOW}Example: curl http://localhost:3001/health${NC}'" C-m

# Focus on backend pane
tmux select-pane -t $SESSION:0.0

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ tmux session started with 3 panes!${NC}"
echo ""
echo -e "${YELLOW}📖 Layout:${NC}"
echo -e "  ${MAGENTA}Top-left${NC}     - Backend (ports 3001, 3002)"
echo -e "  ${MAGENTA}Top-right${NC}    - Frontend (port 8081)"
echo -e "  ${MAGENTA}Bottom${NC}       - Terminal (for commands)"
echo ""
echo -e "${YELLOW}📖 Controls:${NC}"
echo -e "  Ctrl+B, ↑/↓/←/→  - Switch between panes"
echo -e "  Ctrl+B, o        - Next pane"
echo -e "  Ctrl+B, d        - Detach (session keeps running)"
echo -e "  Ctrl+B, x        - Kill current pane"
echo -e "  Ctrl+B, &        - Kill whole window"
echo ""
echo -e "${YELLOW}📌 To reattach later:${NC}"
echo -e "  tmux attach -t $SESSION"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Attach to session
sleep 1
tmux attach-session -t $SESSION
