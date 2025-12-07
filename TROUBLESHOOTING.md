# Network Troubleshooting Guide

## Issue: "Network request failed" when calling API

### Quick Checks:

1. **Verify Backend is Running:**
   ```bash
   # Check if backend is running on port 3000
   lsof -ti:3000
   # Should show a process ID
   ```

2. **Test Backend from Computer:**
   ```bash
   curl http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
   ```

3. **Verify IP Address:**
   ```bash
   # Get your computer's IP
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Or
   ipconfig getifaddr en0
   ```

4. **Check Device Can Reach Computer:**
   ```bash
   adb shell "ping -c 2 YOUR_COMPUTER_IP"
   ```

### Common Solutions:

#### Solution 1: Ensure Same WiFi Network
- Make sure your phone and computer are connected to the **same WiFi network**
- Check WiFi name on both devices

#### Solution 2: Check Backend Listening Address
Your backend should listen on `0.0.0.0` not just `localhost`:
```javascript
// In your backend server file
app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on 0.0.0.0:3000');
});
```

#### Solution 3: Check Firewall
On Mac, allow incoming connections:
```bash
# Check firewall status
/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# If needed, allow Node.js through firewall
```

#### Solution 4: Use USB Tethering (Alternative)
If WiFi doesn't work, you can use USB tethering:
1. Connect phone via USB
2. Enable USB tethering on phone
3. Use the tethered network IP

#### Solution 5: Test with Browser on Phone
1. Open browser on your phone
2. Go to: `http://YOUR_COMPUTER_IP:3000/api/auth/login`
3. If it works in browser, the network is fine - check the app code

### Current Configuration:
- Computer IP: `10.150.225.118`
- API URL: `http://10.150.225.118:3000`
- Backend Port: `3000`

### Debug Steps:
1. Check logs in Metro bundler for API URL
2. Check device logs: `adb logcat | grep -i "network\|api\|http"`
3. Try accessing API from phone's browser
4. Verify backend CORS settings allow requests from mobile app


