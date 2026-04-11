# WebSocket Real-Time Chat - Complete Fix & Testing Guide

## 🔴 CRITICAL ISSUES IDENTIFIED FROM YOUR SCREENSHOTS

### Issue #1: Browser Cache
Your browser is still running the OLD JavaScript code. The WebSocket error `ws://localhost:443/ws` proves this.

### Issue #2: Different Room IDs
- **User 1** is in room: `6f80ebbf-1bde-4f8c-9b5b-162cef2db56d`
- **User 2** is in room: `631cf448-dcB3-4c12-a3ad-abe18c1b44e4`

**These are DIFFERENT rooms!** Both users must chat on the SAME exchange task.

---

## ✅ SOLUTION - Follow These Steps EXACTLY

### Step 1: Clear Browser Cache (MANDATORY)

**For Each Browser Window:**
1. Open Developer Console (F12)
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**
   
   OR use keyboard shortcut:
   - **Windows/Linux**: `Ctrl + Shift + R`
   - **Mac**: `Cmd + Shift + R`

4. Close and reopen the browser tab
5. Navigate back to `http://localhost:3000/exchange`

### Step 2: Ensure Both Users Use the SAME Exchange Task

**CRITICAL**: Both users must click "Chat" on the EXACT SAME exchange task!

1. **User 1**: Create or find an exchange task (e.g., "Python ↔ Java")
2. **User 1**: Note the task ID or task description
3. **User 2**: Find the EXACT SAME task in the marketplace
4. **Both users**: Click "Chat" on that SAME task
5. **Verify in console**: Both should show the SAME `room_id`

---

## 🧪 Verification Checklist

After clearing cache and opening the SAME task, check console logs:

### ✅ Correct Console Output (After Fix):
```
🔧 buildWebSocketUrl - API_BASE_URL: http://127.0.0.1:8000
🔧 process.env.REACT_APP_BACKEND_URL: http://127.0.0.1:8000
🔧 window.location.origin: http://localhost:3000
🔧 Built WebSocket URL: ws://127.0.0.1:8000/api/realtime/ws/exchange/SAME-TASK-ID?token=...
🔌 RealtimeChat connecting to: ws://127.0.0.1:8000/api/realtime/ws/exchange/SAME-TASK-ID?token=...
   Room Type: exchange Room ID: SAME-TASK-ID
✅ WebSocket connected successfully
```

### ❌ Wrong Console Output (Still Broken):
```
WebSocket connection to 'ws://localhost:443/ws' failed  ❌ WRONG!
```

---

## 🎯 Complete Testing Procedure

### Test Scenario: Two Users Chatting on Skill Exchange

1. **Open Two Browser Windows**
   - Window 1: Regular browser
   - Window 2: Incognito/Private window

2. **Login as Different Users**
   - Window 1: Login as User A
   - Window 2: Login as User B

3. **Navigate to Skill Exchange Marketplace**
   - Both: Go to `http://localhost:3000/exchange`

4. **User A Creates Exchange Task**
   ```
   Skill Offered: Python
   Skill Requested: JavaScript
   Description: Let's exchange skills
   ```
   - Click "Create Exchange Task"
   - Note: This creates a task with ID: `abc-123-xyz`

5. **User B Accepts the Exchange**
   - Find User A's task in marketplace
   - Click "Accept Exchange"
   - Status changes to "Matched"

6. **BOTH Users Open Chat on the SAME Task**
   - User A: Click "Chat" button on the matched task
   - User B: Click "Chat" button on the SAME matched task

7. **Verify Console Logs**
   ```
   // Both users should see:
   Room Type: exchange
   Room ID: abc-123-xyz  ← MUST BE IDENTICAL
   ✅ WebSocket connected successfully
   ```

8. **Send Messages**
   - User A types: "Hi there!"
   - User B should see: "Hi there!" instantly
   - User B types: "Hello back!"
   - User A should see: "Hello back!" instantly

---

## 🐛 Debugging Guide

### If WebSocket Still Shows `ws://localhost:443/ws`:

1. **Clear ALL browser data**:
   - Chrome: Settings → Privacy → Clear browsing data
   - Select: Cached images and files, Cookies
   - Time range: Last 24 hours
   - Click "Clear data"

2. **Restart frontend server**:
   ```bash
   sudo supervisorctl restart frontend
   ```

3. **Check .env file exists**:
   ```bash
   cat /app/frontend/.env
   # Should show: REACT_APP_BACKEND_URL=http://127.0.0.1:8000
   ```

4. **Force rebuild**:
   ```bash
   cd /app/frontend
   rm -rf node_modules/.cache build
   sudo supervisorctl restart frontend
   ```

### If Messages Don't Appear (But WebSocket Connects):

1. **Check Room IDs in Console**
   - Both users MUST have identical `room_id`
   - If different: You're in different rooms!

2. **Ensure Same Task**
   - Both users must click "Chat" on the same exchange task
   - Check the task description/skills match

3. **Check Backend Logs**:
   ```bash
   tail -50 /var/log/supervisor/backend.err.log
   ```

4. **Check User IDs**
   - Each user should have different `sender_id`
   - Messages sent by User A should have `sender_id: A`
   - User B should see those messages with `sender_id: A` (not their own)

---

## 📝 Expected Behavior

### Message Flow:
1. User A types "Hello" and sends
2. User A's browser sends via WebSocket to backend
3. Backend broadcasts to ALL users in room `exchange:task-id`
4. User B's WebSocket receives the message
5. User B sees "Hello" appear instantly (message aligned LEFT because it's from another user)
6. User A sees "Hello" appear instantly (message aligned RIGHT because it's their own message)

### Visual Indicators:
- **Own messages**: Blue background, aligned right
- **Other's messages**: Gray background, aligned left
- **System messages**: Centered, small text (e.g., "User joined")
- **Connection status**: Green dot = Connected, Red dot = Disconnected

---

## ✅ Success Criteria

You'll know it's working when:
1. ✅ Console shows correct WebSocket URL: `ws://127.0.0.1:8000/api/realtime/ws/exchange/...`
2. ✅ Console shows "WebSocket connected successfully"
3. ✅ Both users have the SAME `room_id` in console
4. ✅ Messages appear instantly on both sides
5. ✅ Own messages are blue/right, other's messages are gray/left
6. ✅ No error: "WebSocket connection failed"

---

## 🚀 Quick Test Command

Run this to verify backend WebSocket is working:
```bash
# Test WebSocket endpoint is accessible
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://127.0.0.1:8000/api/realtime/ws/exchange/test-room-id?token=test
```

Expected response: `HTTP/1.1 400 Bad Request` (because token is invalid, but route exists)

---

## 📞 Still Not Working?

If after following ALL steps above, it still doesn't work:

1. Take new screenshots showing:
   - Full browser console (with WebSocket logs)
   - The chat interface
   - Network tab showing WebSocket connection

2. Run diagnostic command:
   ```bash
   # Check if services are running
   sudo supervisorctl status
   
   # Check frontend env
   cat /app/frontend/.env
   
   # Check backend WebSocket route
   grep -n "websocket" /app/backend/app/api/routes/realtime.py
   ```

3. Provide the output from above commands

---

**Last Updated**: April 2, 2026
**Status**: Fix deployed, waiting for cache clear + same-room testing
