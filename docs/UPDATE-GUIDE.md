# ITS Billboard - Auto-Update Implementation Guide

## Overview

Hệ thống auto-update cho ITS Billboard sử dụng:

- **Dual MQTT Broker**: mqtt1.eoh.io (E-Ra IoT), HiveMQ (Commands)
- **GitHub Releases**: Lưu trữ phiên bản .exe
- **electron-updater**: Tự động kiểm tra & cài đặt updates
- **Remote Trigger**: Control updates qua admin-web interface

---

## Architecture

### 1. Release Build Process

```
Code Push to main/release branch
    ↓
GitHub Actions Workflow (build-release.yml)
    ↓
Build Electron app with electron-builder
    ↓
Create .exe (NSIS Installer + Portable)
    ↓
Upload to GitHub Releases
    ↓
Desktop apps detect & download updates
```

### 2. MQTT Communication

#### Command Broker (HiveMQ)

- **Topic**: `its/billboard/commands`
- **Message**: `{ action: "check_update"|"force_update", timestamp, source }`
- **Response**: Published to `its/billboard/update/status`

#### E-Ra IoT Broker

- **Topic**: `eoh/chip/{gatewayToken}/config/+/value`
- **Usage**: Sensor data (không dùng cho commands)

---

## Release Process

### Step 1: Prepare Release

```bash
# Update version in package.json
"version": "1.0.1"

# Commit changes
git add package.json
git commit -m "Bump version to 1.0.1"
```

### Step 2: Create GitHub Tag

```bash
# Create tag
git tag -a v1.0.1 -m "Release version 1.0.1 - Bug fixes and improvements"

# Push tag to trigger CI/CD
git push origin v1.0.1
```

### Step 3: GitHub Actions Build

- Workflow file: `.github/workflows/build-release.yml`
- Triggered on: Tag push (`v*`)
- Outputs:
  - `ITS-Billboard-1.0.1-nsis.exe` (NSIS Installer)
  - `ITS-Billboard-1.0.1-portable.exe` (Portable)
  - `latest.yml` (Update manifest)

### Step 4: Verify Release

1. Go to: https://github.com/MQuan-eoh/ITS_OurdoorBillboard-/releases
2. Check artifacts uploaded
3. Create release notes (optional)

---

## Update Triggers

### Auto-Check

- Desktop app checks every **1 hour** by default
- Configured in `autoUpdater.checkForUpdates()`

### Manual Check from Admin-Web

```
Admin-Web UI → "Check Updates" Button
    ↓
MQTT: Publish to `its/billboard/commands`
    { action: "check_update" }
    ↓
Desktop App receives command
    ↓
Check GitHub Releases via electron-updater
    ↓
Response via `its/billboard/update/status`
    { status: "update_available", version: "1.0.1" }
```

### Force Update from Admin-Web

```
Admin-Web UI → "Force Update" Button
    ↓
MQTT: Publish to `its/billboard/commands`
    { action: "force_update" }
    ↓
Desktop App:
  1. Check for updates
  2. Download .exe
  3. Install silently
  4. Restart app
    ↓
Status: `its/billboard/update/status`
```

---

## Configuration

### Package.json Build Settings

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "MQuan-eoh",
      "repo": "ITS_OurdoorBillboard-"
    },
    "win": {
      "target": ["nsis", "portable"]
    }
  }
}
```

### Main.js Auto-Updater Settings

```javascript
autoUpdater.allowDowngrade = false;
autoUpdater.allowPrerelease = false;
await autoUpdater.checkForUpdates();
```

---

## Troubleshooting

### Issue: "Update check failed"

**Causes:**

- Internet connection lost
- GitHub API rate limit exceeded
- HiveMQ broker not connected

**Solution:**

```javascript
// Check dual broker status
console.log("E-Ra connected:", mqttService.isConnected);
console.log("Command connected:", mqttService.isCommandConnected);

// Check GitHub token
// Verify .github/workflows/build-release.yml has GITHUB_TOKEN
```

### Issue: "App failed to install update"

**Causes:**

- App running during update
- Permission denied to write files
- Update file corrupted

**Solution:**

```javascript
// Check app exit before install
autoUpdater.quitAndInstall(false, true); // isSilent=true, forceRunAfter=true

// Logs: Check electron logs
// %APPDATA%/ITS-Outdoor-Billboard/logs/
```

### Issue: "No updates available"

**Possible:**

- Already on latest version
- GitHub API issue
- Release not built properly

**Solution:**

```bash
# Verify release exists
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/MQuan-eoh/ITS_OurdoorBillboard-/releases
```

---

## Rollback

### Manual Rollback

1. **Stop current app**

   ```bash
   taskkill /f /im electron.exe
   ```

2. **Restore previous version**

   - Delete `%AppData%/ITS-Outdoor-Billboard/update.asar`
   - Restart app with previous installer

3. **Or downgrade version tag**
   ```bash
   git tag -d v1.0.1
   git push origin :refs/tags/v1.0.1
   ```

### Auto-Rollback (electron-updater feature)

- If update fails during install, app reverts to previous version
- Check logs for rollback confirmation

---

## Admin-Web Update Interface

### Buttons

1. **Check Updates** (🔍)

   - Sends check_update command
   - Shows available version
   - Enables Force Update button if update available

2. **Force Update** (⬇️)
   - Requires confirmation
   - Downloads & installs update
   - Shows progress bar
   - App auto-restarts after install

### Status Display

```
Status Messages:
✅ Update available: v1.0.1
⬇️ Downloading v1.0.1...
🔄 Update in progress...
❌ Error: {error message}
```

---

## File Locations

### Desktop App

```
%APPDATA%/ITS-Outdoor-Billboard/
├── config.json          # App config
├── logs/
│   └── main.log        # Auto-updater logs
├── pending/            # Downloaded update
└── app-update.yml      # Current update info
```

### GitHub

```
Repository: https://github.com/MQuan-eoh/ITS_OurdoorBillboard-
├── main branch          # Source code
├── Releases             # Built .exe files
└── .github/workflows/
    └── build-release.yml
```

---

## MQTT Topics Reference

| Topic                         | Direction    | Payload                       |
| ----------------------------- | ------------ | ----------------------------- |
| `its/billboard/commands`      | admin→device | `{action, timestamp, source}` |
| `its/billboard/update/status` | device→admin | `{status, version, error}`    |
| `its/billboard/reset/status`  | device→admin | `{status, timestamp}`         |

---

## Next Steps

1. **Test Release Process**

   - Create test tag `v1.0.0-test`
   - Verify GitHub Actions runs
   - Confirm .exe artifacts created

2. **Test Update Flow**

   - Trigger from admin-web
   - Monitor desktop app logs
   - Verify restart

3. **User Documentation**
   - How to update (automatic vs manual)
   - What to do if update fails
   - Support contact

---

## Support

For issues:

1. Check logs: `%APPDATA%/ITS-Outdoor-Billboard/logs/`
2. Verify MQTT connection: admin-web status indicator
3. Check GitHub release: https://github.com/MQuan-eoh/ITS_OurdoorBillboard-/releases
4. Contact development team
