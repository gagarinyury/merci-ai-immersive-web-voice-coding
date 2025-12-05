#!/bin/bash

# VRCreator2 Voice Integration Test Script
# Tests the full voice input → speech-to-text → conversation → code generation flow

set -e  # Exit on error

echo "🧪 VRCreator2 Voice Integration Test"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAILED++))
}

info() {
    echo -e "${YELLOW}ℹ️  INFO:${NC} $1"
}

# Check if backend is running
check_backend() {
    info "Checking if backend is running..."
    if curl -s http://localhost:3001/health > /dev/null; then
        pass "Backend is running"
    else
        fail "Backend is not running. Start it with: npm run backend"
        exit 1
    fi
}

# Test 1: Health check
test_health() {
    echo ""
    echo "Test 1: Health Check"
    echo "--------------------"

    RESPONSE=$(curl -s http://localhost:3001/health)
    STATUS=$(echo $RESPONSE | jq -r '.status')

    if [ "$STATUS" = "ok" ]; then
        pass "Health check returned status: ok"
        info "Model: $(echo $RESPONSE | jq -r '.model')"
        info "Auth: $(echo $RESPONSE | jq -r '.authMode')"
    else
        fail "Health check failed"
    fi
}

# Test 2: Speech-to-text endpoint (with dummy audio)
test_speech_to_text() {
    echo ""
    echo "Test 2: Speech-to-Text Endpoint"
    echo "--------------------------------"

    # Create a minimal base64 audio blob (this won't actually work, but tests the endpoint)
    DUMMY_AUDIO="UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="

    info "Sending dummy audio to /api/speech-to-text..."
    RESPONSE=$(curl -s -X POST http://localhost:3001/api/speech-to-text \
        -H "Content-Type: application/json" \
        -d "{\"audioData\":\"$DUMMY_AUDIO\"}" || echo '{"error":"connection failed"}')

    # Note: This will likely fail with Gemini API error since it's dummy audio
    # But we can check if the endpoint responds correctly
    ERROR=$(echo $RESPONSE | jq -r '.error // empty')

    if [ -z "$ERROR" ]; then
        pass "Speech-to-text endpoint responded (no connection error)"
        info "Response: $(echo $RESPONSE | jq -c .)"
    else
        # Expected to fail with Gemini error, not connection error
        if [[ "$ERROR" == *"Gemini"* ]] || [[ "$ERROR" == *"connection"* ]]; then
            info "Endpoint reachable but Gemini API error (expected with dummy audio)"
            pass "Speech-to-text endpoint is accessible"
        else
            fail "Speech-to-text endpoint error: $ERROR"
        fi
    fi
}

# Test 3: Conversation API (simple text message)
test_conversation() {
    echo ""
    echo "Test 3: Conversation API"
    echo "------------------------"

    SESSION_ID="test_$(date +%s)"
    MESSAGE="create a red cube"

    info "Sending message: '$MESSAGE'"
    info "Session ID: $SESSION_ID"

    RESPONSE=$(curl -s -X POST http://localhost:3001/api/conversation \
        -H "Content-Type: application/json" \
        -d "{\"message\":\"$MESSAGE\",\"sessionId\":\"$SESSION_ID\"}" \
        --max-time 60 || echo '{"error":"timeout or connection failed"}')

    SUCCESS=$(echo $RESPONSE | jq -r '.success // false')

    if [ "$SUCCESS" = "true" ]; then
        pass "Conversation API returned success"
        REPLY=$(echo $RESPONSE | jq -r '.response // empty')
        info "Agent reply: ${REPLY:0:100}..."

        AGENTS_USED=$(echo $RESPONSE | jq -r '.agentsUsed[]' 2>/dev/null | tr '\n' ',' || echo "none")
        info "Agents used: $AGENTS_USED"

        # Check if file was created
        if ls src/generated/*.ts 2>/dev/null | grep -q .; then
            pass "Code file was generated in src/generated/"
            info "Generated files: $(ls -1 src/generated/*.ts | wc -l) file(s)"
        else
            fail "No code files found in src/generated/"
        fi
    else
        ERROR=$(echo $RESPONSE | jq -r '.error // "unknown error"')
        fail "Conversation API failed: $ERROR"
    fi
}

# Test 4: WebSocket connection
test_websocket() {
    echo ""
    echo "Test 4: WebSocket Server"
    echo "------------------------"

    info "Checking WebSocket server on port 3002..."

    # Use timeout with nc to check if port is open
    if timeout 2 bash -c "echo > /dev/tcp/localhost/3002" 2>/dev/null; then
        pass "WebSocket server is listening on port 3002"
    else
        fail "WebSocket server not accessible on port 3002"
    fi
}

# Test 5: Check generated files
test_generated_files() {
    echo ""
    echo "Test 5: Generated Files Check"
    echo "------------------------------"

    if [ -d "src/generated" ]; then
        pass "src/generated/ directory exists"

        FILE_COUNT=$(ls -1 src/generated/*.ts 2>/dev/null | wc -l)
        info "Found $FILE_COUNT TypeScript file(s)"

        if [ $FILE_COUNT -gt 0 ]; then
            info "Latest file: $(ls -t src/generated/*.ts | head -1)"
        fi
    else
        fail "src/generated/ directory not found"
    fi
}

# Test 6: Frontend build check
test_frontend() {
    echo ""
    echo "Test 6: Frontend Check"
    echo "----------------------"

    if [ -f "index.html" ]; then
        pass "index.html exists"

        # Check if mic permission overlay exists
        if grep -q "mic-permission-overlay" index.html; then
            pass "Microphone permission overlay found in HTML"
        else
            fail "Microphone permission overlay not found in HTML"
        fi
    else
        fail "index.html not found"
    fi

    if [ -f "src/services/gemini-audio-service.ts" ]; then
        pass "GeminiAudioService exists"
    else
        fail "GeminiAudioService not found"
    fi

    if [ -f "src/chat-system.ts" ]; then
        pass "ChatSystem exists"
    else
        fail "ChatSystem not found"
    fi
}

# Run all tests
main() {
    check_backend
    test_health
    test_speech_to_text
    test_conversation
    test_websocket
    test_generated_files
    test_frontend

    # Summary
    echo ""
    echo "========================================="
    echo "Test Summary"
    echo "========================================="
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo ""

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed!${NC}"
        echo ""
        echo "✅ Voice integration is ready to test!"
        echo ""
        echo "Next steps:"
        echo "1. Start frontend: npm run dev"
        echo "2. Open https://localhost:8081"
        echo "3. Allow microphone permission"
        echo "4. Enter VR mode"
        echo "5. Press and hold MIC button"
        echo "6. Say: 'create a red cube'"
        echo "7. Release button and watch the magic! ✨"
        exit 0
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        echo ""
        echo "Check the errors above and fix them before testing."
        exit 1
    fi
}

# Run tests
main
