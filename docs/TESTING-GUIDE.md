# Testing Guide - Reset App & Auto-Update

## Quick Test Checklist

### Test 1: MQTT Connection Verification

**Objective**: Verify dual-broker MQTT setup works

**Steps**:
1. Start desktop app
2. Check logs for:
   ```
   MainProcessMqttService: Successfully connected to E-Ra MQTT broker!
   MainProcessMqttService: Successfully connected to Command Broker (HiveMQ)!
   MainProcessMqttService: Successfully subscribed to E-Ra IoT
   MainProcessMqttService: Successfully subscribed to commands
   ```

**Expected**: Both brokers connected, no subscribe errors

---

### Test 2: Reset App via MQTT

**Objective**: Test reset_app command from admin-web

**Steps**:

1. **Desktop App**:
   - Start app, note process ID
   - Check logs

2. **Admin-Web**:
   - Open admin-web interface
   - Click "🔄 Reset App" button
   - Confirm dialog
   - Watch toast notifications

3. **Verify**:
   - Toast: "🔄 Sending reset command to billboard..."
   - Desktop: Check logs for:
     ```
     MainProcessMqttService: Processing reset_app command
     MainProcessMqttService: Resetting app...
     MainProcessMqttService: Restarting Electron app...
     ```
   - App should restart (new process ID)

**Expected**: App cleanly restarts, settings preserved

---

### Test 3: Update Check

**Objective**: Test check_update command

**Steps**:

1. **Admin-Web**:
   - Click "🔍 Check Updates"
   - Wait for response

2. **Expected Output**:
   - Option A: "✅ Update available: v{version}"
   - Option B: "✅ No updates available"

3. **Desktop Logs**:
   ```
   MainProcessMqttService: Processing check_update command
   MainProcessMqttService: Checking for updates...
   AutoUpdater: Checking for update...
   MainProcessMqttService: Update available: 1.0.1
   ```

---

### Test 4: Force Update (Simulation)

**Objective**: Test force_update command trigger

**Steps**:

1. **Setup**:
   - Create test release on GitHub with higher version
   - Tag: `v1.0.1`, artifacts uploaded

2. **Admin-Web**:
   - First: Click "🔍 Check Updates"
   - Wait for: "✅ Update available"
   - Click "⬇️ Force Update" button
   - Confirm dialog

3. **Desktop Logs**:
   ```
   MainProcessMqttService: Processing force_update command
   MainProcessMqttService: Force update initiated...
   MainProcessMqttService: Update available, downloading...
   AutoUpdater: Download progress...
   ```

4. **Admin-Web UI**:
   - Progress bar fills from 0-100%
   - Status updates in real-time
   - "Downloading v1.0.1..."

---

### Test 5: Reset Command Flow

**Full Reset Test**:

1. **Before**:
   - Change some settings in app
   - Note: specific config values

2. **Execute Reset**:
   - Admin-web: Click Reset
   - Monitor both windows

3. **After**:
   - Desktop: Should show fresh startup logs
   - Manifest: Should reload
   - MQTT: Should reconnect
   - Settings: Should reload from config.json

**Expected**: Clean restart, state cleared, reconnected

---

## Log Locations

### Desktop App Logs
```
Windows:
%APPDATA%\ITS-Outdoor-Billboard\logs\main.log

Or in code:
F:\EoH Company\ITS_OurdoorScreen\main.js (line 1-50 for logPath)
```

### Dev Console Logs
```
Press F1 in desktop app → F12 → Console tab
```

### Admin-Web Console
```
Open Browser DevTools → Console tab
```

---

## Test Data

### Minimal Package.json Update
```json
{
  "version": "1.0.1"
}
```

### Test Release Tag
```bash
git tag v1.0.1 -m "Test Release 1.0.1"
git push origin v1.0.1
```

---

## Common Issues & Debug

### Issue: "Subscribe failed"
**Fix**:
```javascript
// Check broker status
// mqtt1.eoh.io: E-Ra sensor topics only?
// Alternative: Force use of HiveMQ only
// Check firewall/VPN blocking ports 1883, 8884
```

### Issue: "Command not received"
**Debug**:
1. Check MQTT subscribed: `its/billboard/commands`
2. Verify payload format:
   ```json
   {
     "action": "reset_app",
     "timestamp": 1234567890,
     "source": "admin_web",
     "reason": "Manual reset"
   }
   ```

### Issue: "Update not triggering"
**Debug**:
1. Verify GitHub release exists with higher version
2. Check electron-updater config in main.js
3. Monitor logs for:
   ```
   AutoUpdater: Checking for update...
   AutoUpdater: Update available
   ```

### Issue: "App doesn't restart"
**Debug**:
1. Check for file locks
2. Verify app.relaunch() not blocked by Electron version
3. Try manual restart:
   ```bash
   taskkill /f /im electron.exe
   ```

---

## Performance Checklist

- [ ] MQTT connects within 5 seconds
- [ ] Reset completes within 2 seconds
- [ ] Update check completes within 10 seconds
- [ ] Update download speed > 1MB/s
- [ ] No memory leaks during updates
- [ ] App responsive during check/update

---

## Security Checks

- [ ] Verify MQTT uses encryption (wss://)
- [ ] Check GitHub token not in code
- [ ] Verify update signatures (if implemented)
- [ ] Test with invalid/corrupt .exe
- [ ] Test network interruption handling

---

## Sign-Off

**Tested By**: _________________
**Date**: _________________
**Environment**: Windows 10/11
**Status**: [ ] Pass [ ] Fail

**Issues Found**:
```
1. 
2. 
3. 
```

**Notes**:
```


```

