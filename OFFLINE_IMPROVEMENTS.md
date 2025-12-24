# 📱 Offline Functionality Improvements

**Version:** 2.1.0 - Enhanced Mobile Offline  
**Date:** December 24, 2025  
**Service Worker:** v11

## 🎯 Overview

Comprehensive improvements to offline functionality, specifically optimized for mobile phones with unreliable connections.

## ✨ Key Improvements

### 1. **Smart Connection Detection**
- **Real Connection Quality Check**: Not just `navigator.onLine` - actually tests API connectivity
- **5-second timeout** for connection quality verification
- **Prevents false positives** on flaky mobile networks
- Shows "Geen verbinding" when browser says online but server unreachable

```javascript
async function checkConnectionQuality() {
    // Tests actual API connection with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/api/user-info', {
        method: 'HEAD',
        signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
}
```

### 2. **Intelligent Retry Logic with Exponential Backoff**
- **Automatic retries** when sync fails (max 3 attempts)
- **Exponential backoff**: 1s → 2s → 4s → 8s (max 30s)
- **Stops gracefully** when connection truly lost
- **Resumes automatically** when back online

```javascript
// Retry delays: 1000ms, 2000ms, 4000ms, 8000ms, 16000ms, max 30000ms
const retryDelay = Math.min(1000 * Math.pow(2, syncRetryCount), 30000);
```

### 3. **Storage Quota Management**
- **Checks available space** before saving
- **Warns at 90% capacity** to prevent quota errors
- **Shows storage usage** in console and UI
- **Auto-cleanup function** for old synced items

```javascript
// Check before every save
const estimate = await navigator.storage.estimate();
const percentUsed = (estimate.usage / estimate.quota) * 100;

if (percentUsed > 90) {
    throw new Error('Onvoldoende opslagruimte');
}
```

**New Console Commands:**
```javascript
showStorageInfo()  // Display storage usage
cleanOldItems(30)  // Remove synced items older than 30 days
```

### 4. **Enhanced Mobile UX**

#### Visual Feedback
- **Pending badge** shows count: "📱 3 offline opgeslagen"
- **Pulsing animation** on pending count for visibility
- **Real-time status updates** in header

#### Better Button States
- **Disabled during save** to prevent double-submissions
- **Shows progress**: "💾 Opslaan..." → "📤 Verzenden..."
- **44px minimum touch targets** (Apple guideline)
- **Larger inputs** (16px font) prevents iOS zoom

#### Improved Toasts
- **Positioned above buttons** (not covered by UI)
- **Context-aware messages**:
  - ⏱️ "Verbinding te traag" for timeouts
  - 📱 "Offline opgeslagen" when no connection
  - ✅ "X preken gesynchroniseerd" on success
- **Auto-dismiss with timing** appropriate for mobile reading

### 5. **Robust Service Worker Sync**

#### Background Sync Improvements
- **30-second timeout** per request (prevents hanging)
- **Batch processing** with individual error handling
- **Progress tracking**: success vs failed counts
- **Client notifications** via postMessage API
- **Silent push notifications** when synced

```javascript
// Service Worker notifies client after sync
clients.forEach(client => {
    client.postMessage({
        type: 'SYNC_COMPLETE',
        count: syncCount,
        failed: failCount
    });
});
```

#### Better Error Handling
- **Distinguishes** between timeout, network error, and server rejection
- **Stops batch** on timeout (doesn't waste battery)
- **Retries** via browser's background sync API
- **Logs detailed info** for debugging

### 6. **Offline-First Save Flow**

**New Logic:**
1. Collect form data
2. Check **real** connection quality (not just navigator.onLine)
3. If offline → save to IndexedDB immediately
4. If online → attempt save with 30s timeout
5. On timeout/error → fallback to IndexedDB
6. Show appropriate feedback for each scenario

**Timeout Handling:**
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

fetch('/api/sermons', { signal: controller.signal })
    .catch(error => {
        if (error.name === 'AbortError') {
            // Timeout - save offline
        }
    });
```

## 🔧 Technical Details

### IndexedDB Schema (v4)
```javascript
{
    id: autoIncrement,
    sermon: { location, preacher, sermon_date, core_text, occasion_id },
    passages: [ { bible_book_id, chapter_start, ... } ],
    points: [ { point_type, point_order, title, content } ],
    timestamp: Date.now(),
    synced: 0  // 0 = pending, 1 = synced
}

Indexes:
- timestamp (for cleanup)
- synced (for queries: IDBKeyRange.only(0))
```

### Service Worker Cache (v11)
- **Cache-first** for static assets
- **Network-only** for API calls (bypass cache due to auth)
- **Cloudflare Access** requests always pass through
- **Background sync** registered on save

### Connection States
1. **Online + Good Connection**: Direct API save
2. **Online + Poor Connection**: Timeout → IndexedDB
3. **Offline**: Immediate IndexedDB save
4. **Back Online**: Auto-sync with retries

## 📊 Performance Metrics

- **Save timeout**: 30 seconds (mobile-friendly)
- **Connection test**: 5 seconds max
- **Retry attempts**: 3 maximum
- **Max retry delay**: 30 seconds
- **Storage check**: Before every save
- **Storage warning**: At 90% capacity

## 🎨 Mobile CSS Optimizations

```css
@media (max-width: 768px) {
    /* Status indicator fixed position */
    .online-status {
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 999;
    }
    
    /* Touch-friendly buttons */
    .btn-primary { min-height: 44px; }
    
    /* Prevent iOS zoom */
    input, select, textarea { font-size: 16px; }
    
    /* Better toast positioning */
    .toast-container { bottom: 80px; }
}
```

## 🧪 Testing Checklist

### Offline Mode
- [ ] Save sermon while offline → IndexedDB
- [ ] Multiple saves while offline → Queue builds
- [ ] Back online → Auto-sync triggered
- [ ] Sync completes → Badge disappears

### Poor Connection
- [ ] Save with 3G throttling → Timeout handling
- [ ] Intermittent connection → Retry logic works
- [ ] Airplane mode mid-save → Falls back to offline

### Storage Management
- [ ] `showStorageInfo()` displays usage
- [ ] Save near quota → Warning shown
- [ ] `cleanOldItems()` removes old data

### Mobile UX
- [ ] Buttons large enough (44px)
- [ ] No iOS zoom on inputs (16px font)
- [ ] Status visible above fold
- [ ] Toasts don't overlap UI

## 🐛 Known Limitations

1. **Cloudflare Access**: API calls can't be cached (auth headers required)
2. **Browser Quota**: Varies by device (typically 50% of available disk)
3. **Background Sync**: May be delayed by OS battery optimization
4. **Service Worker**: Requires HTTPS (except localhost)

## 🔄 Migration Notes

**From v10 to v11:**
- Service Worker cache updated (v10 → v11)
- No IndexedDB version change (stays v4)
- No user action required (auto-updates)

**After Deploy:**
```javascript
// Optional: Clear old data
resetOfflineDB()

// Check storage usage
showStorageInfo()
```

## 📱 Mobile-Specific Features

### Battery Optimization
- **Stops sync** on timeout (doesn't keep retrying indefinitely)
- **Batches requests** (all pending synced together)
- **Silent notifications** (no vibration/sound)

### Data Efficiency
- **HEAD request** for connection test (minimal data)
- **Compressed payloads** (JSON only, no bloat)
- **Cleanup old data** to save space

### User Experience
- **Clear visual feedback** for every action
- **Touch-optimized** buttons and inputs
- **Works offline-first** (no blocking on network)
- **Auto-sync** when connection restored

## 🎓 Best Practices for Users

1. **Check status indicator** before saving important data
2. **Wait for sync** before closing app if pending items exist
3. **Run `showStorageInfo()`** periodically to monitor space
4. **Clean old items** with `cleanOldItems()` if storage getting full
5. **Trust the offline save** - it will sync when possible!

## 🚀 Future Enhancements

- [ ] Conflict resolution for concurrent edits
- [ ] Offline search in IndexedDB
- [ ] Progressive loading for large datasets
- [ ] Service Worker update notifications
- [ ] Sync queue prioritization
- [ ] Manual sync trigger button

---

**Questions or Issues?**  
Test offline functionality in Chrome DevTools (Application → Service Workers → Offline)
