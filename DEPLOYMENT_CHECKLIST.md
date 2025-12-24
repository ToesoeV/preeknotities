# 🚀 Deployment Checklist - v2.1.0

## Pre-Deployment

- [x] Service Worker updated to v11
- [x] All version numbers updated (functions.js, index.html, README.md)
- [x] IndexedDB schema stable at v4
- [x] Connection quality detection implemented
- [x] Retry logic with exponential backoff
- [x] Storage quota management
- [x] Mobile CSS optimizations
- [x] Console helper functions
- [x] Documentation created (OFFLINE_IMPROVEMENTS.md)

## Deploy Steps

1. **Commit changes**
   ```bash
   git add .
   git commit -m "v2.1.0 - Enhanced mobile offline functionality"
   git push origin main
   ```

2. **Wait for Cloudflare Pages build** (~1-2 minutes)
   - Check GitHub Actions or Cloudflare dashboard
   - Verify build success

3. **Test on desktop first**
   - Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - Open DevTools Console
   - Verify: `🚀 Preeknotities App v2.1.0`
   - Verify: `📱 Service Worker: v11`
   - Check Application → Service Workers → Status should be "activated"

## Post-Deployment Testing

### Desktop Tests
```javascript
// In DevTools Console:

// 1. Check version
console.log('App should show v2.1.0 and SW v11 on load')

// 2. Test storage info
showStorageInfo()
// Should show usage percentage

// 3. Test offline save
// DevTools → Application → Service Workers → ✓ Offline
// Try saving a sermon
// Should see "📱 Offline opgeslagen" toast

// 4. Test online sync
// Uncheck Offline
// Should auto-sync within seconds
// Should see "✅ X preken gesynchroniseerd" toast

// 5. Clean up test data
resetOfflineDB()
```

### Mobile Tests (Real Device)

1. **Connection Quality Test**
   - Turn on Airplane Mode
   - Try to save sermon
   - Should save offline immediately
   - Turn off Airplane Mode
   - Should sync within 1-5 seconds

2. **Slow Connection Test**
   - Enable "Slow 3G" in DevTools (or use real slow connection)
   - Try to save sermon
   - Should show timeout after 30 seconds
   - Should fallback to offline save
   - When connection improves, should auto-sync

3. **Storage Test**
   ```javascript
   showStorageInfo()
   // Check percentage on mobile device
   ```

4. **UI Test**
   - Check status indicator (bottom right, above theme toggle)
   - Verify buttons are 44px minimum (easy to tap)
   - Check inputs don't zoom on iOS (16px font)
   - Verify toasts appear above floating buttons
   - Check pending badge pulses when visible

### Expected Console Output

On page load:
```
🚀 Preeknotities App v2.1.0 - Enhanced Mobile Offline
📱 Service Worker: v11
📚 Bible books: 66 boeken geladen vanuit lokale data
🎯 Occasions: 16 gelegenheden geladen vanuit lokale data
✅ IndexedDB initialized
```

On offline save:
```
📱 Offline - sync uitgesteld
💾 Preek opgeslagen in IndexedDB (ID: X)
```

On sync:
```
📤 Synchroniseren 1 pending sermons...
✅ Preek 1 gesynchroniseerd
✅ 1 preek gesynchroniseerd
```

## Common Issues & Solutions

### Issue: Service Worker still shows v10
**Solution:** 
- Hard refresh: `Ctrl + Shift + R`
- Or: DevTools → Application → Service Workers → Unregister → Reload

### Issue: IndexedDB errors
**Solution:**
```javascript
resetOfflineDB()
// Then reload page
```

### Issue: Pending count not updating
**Solution:**
- Check console for errors
- Try: `updatePendingCount()`
- If stuck, run: `cleanOldItems(0)` to clear all synced items

### Issue: Sync not triggering
**Solution:**
- Check online status indicator
- Run: `checkAndSyncPending()` manually
- Verify API is accessible: `checkConnectionQuality()`

### Issue: Storage quota exceeded
**Solution:**
```javascript
showStorageInfo()  // Check usage
cleanOldItems(30)  // Clean items older than 30 days
// Or for aggressive cleanup:
cleanOldItems(0)   // Clean all synced items
```

## User Communication

After deployment, inform users:

> **📱 Update v2.1.0 beschikbaar!**
> 
> Verbeterde offline functionaliteit voor mobiele telefoons:
> - ✅ Betere detectie van slechte verbindingen
> - ✅ Automatische retries wanneer opslaan mislukt
> - ✅ Duidelijker feedback met badges en meldingen
> - ✅ Opslag beheer om vol raken te voorkomen
> 
> **Acties:**
> 1. Ververs de pagina met Ctrl+Shift+R (of Cmd+Shift+R op Mac)
> 2. Klaar! De app werkt nu beter offline.

## Rollback Plan (if needed)

If critical issues found:

1. **Revert Service Worker**
   ```javascript
   // In sw.js, change:
   const CACHE_NAME = 'preeknotities-v10';
   ```

2. **Revert functions.js version**
   ```javascript
   // Change version back to 2.0.0
   ```

3. **Deploy revert**
   ```bash
   git revert HEAD
   git push origin main
   ```

## Success Criteria

- [x] Version shows 2.1.0 in console
- [x] Service Worker v11 activated
- [x] Offline save works (tested with DevTools offline mode)
- [x] Auto-sync works when back online
- [x] Storage info displays correctly
- [x] Mobile UI responsive and touch-friendly
- [x] No console errors
- [x] Pending badge shows/hides correctly
- [x] Retry logic triggers on timeout

## Monitoring

**Watch for in first 24 hours:**
- Service Worker activation rate
- IndexedDB errors in logs
- Sync success/failure ratio
- Storage quota warnings
- User feedback on mobile experience

## Notes

- IndexedDB stays at v4 (no migration needed)
- Backward compatible with v2.0.0 data
- No user data loss expected
- All changes are additive (no breaking changes)

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Build Number:** _____________  
**Status:** ✅ SUCCESS / ❌ ROLLBACK
