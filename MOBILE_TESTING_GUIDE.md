# Mobile WebSocket Testing Guide

## Overview
This guide provides comprehensive testing instructions for the new SocketManager implementation on Android and iOS devices.

## New SocketManager Features

### 🔧 **Enhanced Mobile Support**
- **Automatic Mobile Detection**: Detects Android/iOS and applies mobile-optimized settings
- **Polling-First Transport**: Starts with polling for better mobile compatibility
- **Extended Timeouts**: Longer timeouts for mobile networks (20s vs 15s)
- **Mobile-Specific Reconnection**: More aggressive reconnection on mobile devices
- **Queue Management**: Smart queue handling for mobile network switching

### 📱 **Mobile-Optimized Configuration**
```typescript
// Mobile-specific settings
transports: ['polling', 'websocket'], // Polling first for mobile
reconnectionDelay: 2000, // 2s for mobile vs 1s for desktop
reconnectionDelayMax: 10000, // 10s for mobile vs 5s for desktop
timeout: 20000, // 20s for mobile vs 15s for desktop
pingTimeout: 120000, // 2 minutes for mobile vs 1 minute for desktop
pingInterval: 30000, // 30s for mobile vs 25s for desktop
```

## Testing Checklist

### ✅ **Android Testing**

#### **Chrome Mobile**
1. **Basic Connection Test**
   - Open app in Chrome on Android
   - Check bottom-right connection status
   - Verify "Mobile: Yes" is displayed
   - Confirm socket connects successfully

2. **Network Switching Test**
   - Start on WiFi, switch to mobile data
   - Verify automatic reconnection
   - Check queue management during switch

3. **Background/Foreground Test**
   - Put app in background
   - Bring back to foreground
   - Verify reconnection attempts

4. **Battery Optimization Test**
   - Enable battery optimization for Chrome
   - Test if socket reconnects properly
   - Check if notifications still work

#### **Samsung Internet**
1. **Repeat all Chrome tests**
2. **Check for Samsung-specific issues**
3. **Verify WebSocket compatibility**

### ✅ **iOS Testing**

#### **Safari Mobile**
1. **Basic Connection Test**
   - Open app in Safari on iOS
   - Check connection status
   - Verify mobile detection works

2. **iOS-Specific Tests**
   - Test with Low Power Mode enabled
   - Test with Background App Refresh disabled
   - Test with Focus/Do Not Disturb modes

3. **Network Switching Test**
   - WiFi to cellular data
   - Cellular data to WiFi
   - Airplane mode toggle

#### **Chrome iOS**
1. **Repeat Safari tests**
2. **Check for Chrome-specific behavior**

## Debug Information

### **Mobile Connection Status Panel**
Located in bottom-right corner on mobile devices:

```
Status: Connected/Disconnected/Connecting/Error
Transport: polling/websocket
Connected: Yes/No
Queue: 0 items
Socket ID: abc123...
Mobile: Yes/No
Auth: Yes/No
User: user@example.com
API URL: https://crm-19gz.onrender.com
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS...)
```

### **Debug Console Logs**
Look for these key log messages:

```
SocketManager: Initializing socket connection...
SocketManager: Socket connected {socketId: "abc123", transport: "polling"}
SocketManager: Page became visible, ensuring socket connected
SocketManager: Network online - ensuring socket connected
SocketManager: Mobile - delayed reconnection after network online
```

## Common Mobile Issues & Solutions

### **Issue: Socket Not Initializing**
**Symptoms**: Shows "Socket not initialized" in status panel
**Solutions**:
1. Check authentication status
2. Verify API URL is correct
3. Check network connectivity
4. Try manual reconnect button
5. Reload page if needed

### **Issue: Frequent Disconnections**
**Symptoms**: Socket connects but disconnects frequently
**Solutions**:
1. Check mobile network stability
2. Disable battery optimization
3. Enable Background App Refresh (iOS)
4. Check for network switching

### **Issue: Notifications Not Working**
**Symptoms**: No realtime notifications on mobile
**Solutions**:
1. Grant notification permissions
2. Check browser notification settings
3. Verify socket connection status
4. Test with manual reconnect

### **Issue: Slow Reconnection**
**Symptoms**: Takes long time to reconnect after network issues
**Solutions**:
1. Check mobile network quality
2. Verify server is accessible
3. Check for firewall/proxy issues
4. Try switching between WiFi and mobile data

## Performance Considerations

### **Battery Usage**
- Mobile-optimized ping intervals reduce battery drain
- Smart queue management prevents unnecessary operations
- Background handling optimized for mobile browsers

### **Data Usage**
- Polling transport may use slightly more data than pure WebSocket
- Queue system prevents data loss during network switches
- Efficient reconnection logic minimizes unnecessary requests

### **Memory Usage**
- Singleton pattern reduces memory footprint
- Proper cleanup on app unload
- Efficient event listener management

## Troubleshooting Commands

### **Check Connection Status**
```javascript
// In browser console
console.log(socketManager.getConnectionStatus());
```

### **Force Reconnection**
```javascript
// In browser console
socketManager.reconnect();
```

### **Check Mobile Detection**
```javascript
// In browser console
console.log(navigator.userAgent);
console.log(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));
```

## Expected Results

After implementing the new SocketManager:

1. **✅ Reliable Mobile Connections**: Socket should connect consistently on Android/iOS
2. **✅ Smart Reconnection**: Automatic reconnection after network issues
3. **✅ Mobile-Optimized Settings**: Appropriate timeouts and transport selection
4. **✅ Better Debugging**: Comprehensive status information for troubleshooting
5. **✅ Queue Management**: Messages queued during disconnection, sent when reconnected
6. **✅ Background Handling**: Proper behavior when app goes to background/foreground

## Testing Timeline

### **Phase 1: Basic Functionality** (Day 1)
- Test basic connection on Android Chrome
- Test basic connection on iOS Safari
- Verify mobile detection works

### **Phase 2: Network Scenarios** (Day 2)
- Test WiFi to mobile data switching
- Test mobile data to WiFi switching
- Test airplane mode scenarios

### **Phase 3: Background/Foreground** (Day 3)
- Test app backgrounding
- Test app foregrounding
- Test with battery optimization enabled

### **Phase 4: Edge Cases** (Day 4)
- Test with poor network conditions
- Test with multiple browser tabs
- Test with different mobile browsers

## Success Criteria

- [ ] Socket connects successfully on Android Chrome
- [ ] Socket connects successfully on iOS Safari
- [ ] Mobile detection works correctly
- [ ] Network switching handled gracefully
- [ ] Background/foreground transitions work
- [ ] Realtime notifications work on mobile
- [ ] Online user counts update correctly
- [ ] Debug information is helpful for troubleshooting
