# 🎤 Voice Integration Testing Guide

## ✅ What's Been Done

### Backend Changes
- ✅ Added `POST /api/speech-to-text` endpoint in `backend/src/server.ts`
- ✅ API key secured on server (reads from `process.env.VITE_GEMINI_API_KEY`)
- ✅ Full error handling and logging
- ✅ Returns: `{ success: true, text: "transcribed text", duration: 1234 }`

### Frontend Changes
- ✅ Updated `src/services/gemini-audio-service.ts` to use backend endpoint
- ✅ Removed client-side API key usage
- ✅ Added `src/chat-system.ts` for managing UI messages
- ✅ Integrated voice input in `src/panel.ts` with push-to-talk
- ✅ Added microphone permission overlay in `index.html`

### UI/UX
- ✅ Beautiful mic permission screen on first load
- ✅ Push-to-talk interface (hold to record, release to transcribe)
- ✅ Visual feedback (red = recording, yellow = processing)
- ✅ Chat system shows user messages + agent responses

## 🧪 Quick Tests

### 1. Check Backend is Running

```bash
curl http://localhost:3001/health | jq .
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-05T...",
  "model": "claude-sonnet-4-5-20250929",
  "authMode": "oauth-only"
}
```

### 2. Test Speech-to-Text Endpoint

**Note:** This requires actual audio data. The endpoint is ready but needs real microphone input from frontend.

```bash
# This will fail with Gemini error (dummy data) but shows endpoint is accessible
curl -X POST http://localhost:3001/api/speech-to-text \
  -H "Content-Type: application/json" \
  -d '{"audioData":"UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="}'
```

### 3. Test Conversation API

```bash
curl -X POST http://localhost:3001/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"message":"create a red sphere","sessionId":"test_'$(date +%s)'"}'
```

**Expected:** Agent creates file in `src/generated/` and returns description.

### 4. Run Automated Test Script

```bash
./test-voice-integration.sh
```

This tests:
- ✅ Backend health
- ✅ Speech-to-text endpoint accessibility
- ✅ Conversation API
- ✅ WebSocket server
- ✅ Generated files
- ✅ Frontend files exist

## 🚀 Full End-to-End Test

### Step 1: Start Backend

```bash
npm run backend
```

Wait for:
```
Server started successfully
POST /api/conversation - Multi-agent conversation with sessions
POST /api/speech-to-text - Speech-to-text via Gemini (secure)
```

### Step 2: Start Frontend

```bash
npm run dev
```

Open: https://localhost:8081

### Step 3: Test Microphone Permission

1. You should see a beautiful overlay:
   - 🎤 Large microphone icon (pulsing)
   - "Allow Microphone Access"
   - Red button: "🎙️ Allow Microphone"

2. Click **"Allow Microphone"**
3. Browser will ask for mic permission → **Allow**
4. Overlay disappears (saved in localStorage)

### Step 4: Enter VR Mode

1. Click **"Enter XR"** button on the panel
2. Put on Quest headset (or use browser VR mode)
3. You should see the welcome panel with chat interface

### Step 5: Test Voice Input

1. Look at the panel in VR
2. Point controller at **MIC button** (bottom right)
3. **Press and HOLD** the button:
   - Button turns RED 🎤
   - Recording starts
4. Say clearly: **"Create a red cube"**
5. **Release** the button:
   - Button turns YELLOW ⏳ (processing)
   - Wait 1-2 seconds
6. Watch the magic:
   - Your message appears in chat (white bubble, right side)
   - Agent response appears (blue bubble, left side)
   - Red cube spawns in front of you!

### Step 6: Verify Code Generation

```bash
ls -la src/generated/
cat src/generated/*.ts | head -20
```

You should see TypeScript file with:
- THREE.js imports
- BoxGeometry with red MeshStandardMaterial
- `world.createTransformEntity(mesh)`
- `__trackEntity(entity, mesh)`

## 🐛 Troubleshooting

### "Failed to connect to backend"

**Check:**
```bash
curl http://localhost:3001/health
```

If fails: `npm run backend`

### "Microphone not supported"

**Check:**
- Using HTTPS (required for `getUserMedia`)
- Browser supports WebRTC (Chrome, Firefox, Quest Browser)
- Mic permission granted in browser settings

### "Speech-to-text timeout"

**Check:**
1. Gemini API key is set: `grep GEMINI .env`
2. Backend logs: `tail -f logs/*.log`
3. Try again (Gemini free tier rate limits)

### No code generated

**Check:**
1. Agent SDK OAuth: Look for `authMode: "oauth-only"` in health check
2. Backend logs show Agent SDK running
3. Files created in `src/generated/`

### Voice records but no transcription

**Check backend logs:**
```bash
# Should see:
# Sending audio to gemini-2.0-flash
# Speech transcribed successfully
```

If Gemini error:
- API key might be invalid
- Rate limit exceeded (wait 1 min)
- Audio format issue (check browser console)

## 📊 Expected Performance

- **Microphone permission**: 1-2 seconds (one-time)
- **Voice recording**: Instant (local)
- **Speech-to-text**: 1-2 seconds (Gemini API via backend)
- **Conversation API**: 5-30 seconds (depends on Agent SDK)
- **Code appears in VR**: Instant (hot reload via WebSocket)

## 🔐 Security Notes

✅ **What's Secure:**
- Gemini API key on backend (not exposed to browser)
- All API calls proxied through backend
- Rate limiting can be added on backend

⚠️ **For Production:**
- Add authentication to `/api/speech-to-text`
- Add rate limiting per user
- Rotate Gemini API key regularly
- Use environment-specific keys

## 📝 Test Checklist

Before calling it done, verify:

- [ ] Backend starts without errors
- [ ] Health endpoint returns `ok`
- [ ] Speech-to-text endpoint is accessible
- [ ] Conversation API responds
- [ ] WebSocket server runs on port 3002
- [ ] Mic permission overlay shows on first visit
- [ ] Mic permission saves in localStorage
- [ ] MIC button turns red when recording
- [ ] Voice transcribes correctly
- [ ] User message appears in chat
- [ ] Agent response appears in chat
- [ ] Code file created in `src/generated/`
- [ ] 3D object appears in VR scene
- [ ] Hot reload works (edit file → see changes)

## 🎉 Success Criteria

Voice integration is working if:

1. ✅ Say "create a red cube" → red cube appears in VR
2. ✅ Chat shows your message + agent response
3. ✅ Code file generated in `src/generated/`
4. ✅ No API key visible in browser DevTools
5. ✅ Works on Quest Browser

## 📞 Next Steps

When you return:

1. Run `./test-voice-integration.sh` to check all systems
2. Start backend + frontend
3. Test voice input end-to-end
4. Try different commands:
   - "create a blue sphere"
   - "make it bigger"
   - "clear the scene"
   - "show me what's in the scene"

Everything is ready! Just need to test with real voice input! 🚀
