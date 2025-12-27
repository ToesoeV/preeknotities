# PWA Testing Checklist

## Manual Testing Guide for Preeknotities PWA

### 1. Installation Testing

- [ ] **Test on Chrome Desktop**
  - Navigate to the app
  - Check for install prompt in address bar
  - Click install and verify app opens in standalone window
  - Check app icon appears on desktop/start menu

- [ ] **Test on Chrome Mobile (Android)**
  - Navigate to the app
  - Check for "Add to Home Screen" banner
  - Install and verify app opens in standalone mode
  - Check app icon appears on home screen

- [ ] **Test on Safari (iOS)**
  - Navigate to the app
  - Share > Add to Home Screen
  - Verify app icon and splash screen
  - Check standalone mode

### 2. Offline Functionality Testing

#### Service Worker Registration
- [ ] Open DevTools > Application > Service Workers
- [ ] Verify Service Worker is registered and activated
- [ ] Check "Update on reload" is working

#### Offline Cache Testing
- [ ] Load the app while online
- [ ] Open DevTools > Application > Cache Storage
- [ ] Verify 'preeknotities-v4' cache exists
- [ ] Check all static files are cached:
  - [ ] /index.html
  - [ ] /styles.css
  - [ ] /static-data.js
  - [ ] /functions.js
  - [ ] /offline-db.js
  - [ ] /manifest.json
  - [ ] /icons/logo.svg

#### Offline Mode Testing
- [ ] Load app while online
- [ ] Open DevTools > Network tab
- [ ] Enable "Offline" mode
- [ ] Refresh page - app should still load
- [ ] Check offline indicator shows "📱 Offline"
- [ ] Try to add a sermon
- [ ] Verify sermon is saved to IndexedDB
- [ ] Check pending count badge appears
- [ ] Open DevTools > Application > IndexedDB
- [ ] Verify 'PreeknotitiesOffline' database exists
- [ ] Check pending-sermons object store has data

#### Sync Testing
- [ ] With pending sermons in IndexedDB
- [ ] Disable offline mode
- [ ] Wait for auto-sync or refresh
- [ ] Verify pending count badge disappears
- [ ] Check sermon appears in sermon list

### 3. Manifest Testing

- [ ] Open DevTools > Application > Manifest
- [ ] Verify all fields are present:
  - [ ] Name: "Preeknotities Beheer"
  - [ ] Short name: "Preeknotities"
  - [ ] Start URL: "/"
  - [ ] Display: "standalone"
  - [ ] Theme color: "#2563eb"
  - [ ] Background color: "#f8fafc"
- [ ] Check for icon warnings (will show SVG icon issues)
- [ ] Verify no manifest errors

### 4. Security Testing

#### HTTPS
- [ ] Verify app is served over HTTPS (or localhost for dev)
- [ ] Service Worker only works on HTTPS

#### Content Security Policy
- [ ] Open DevTools > Console
- [ ] Check for CSP violations (there will be many due to inline handlers)
- [ ] Note: This is a security issue that needs fixing

#### XSS Testing
- [ ] Try entering `<script>alert('XSS')</script>` in:
  - [ ] Location field
  - [ ] Preacher name
  - [ ] Core text
  - [ ] Point content
- [ ] Check if script executes (it shouldn't, but might in sermon display)
- [ ] Note any XSS vulnerabilities

### 5. Accessibility Testing

#### Keyboard Navigation
- [ ] Tab through all form fields
- [ ] Verify logical tab order
- [ ] Press Enter on tab buttons - should switch tabs
- [ ] Press Escape on modal - should close (if implemented)
- [ ] Navigate form with only keyboard

#### Screen Reader Testing (if available)
- [ ] Enable screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Navigate through tabs
- [ ] Fill out form
- [ ] Check if form labels are announced
- [ ] Check if error messages are announced
- [ ] Check if loading states are announced

#### Color Contrast
- [ ] Use DevTools > More tools > CSS Overview
- [ ] Check for color contrast issues
- [ ] Verify text is readable on all backgrounds

#### Focus Indicators
- [ ] Tab through interactive elements
- [ ] Verify all have visible focus indicators
- [ ] Check focus is never lost

### 6. Functionality Testing

#### Add Sermon
- [ ] Fill out basic information
- [ ] Select occasion
- [ ] Add main Bible passage
- [ ] Add additional Bible passage
- [ ] Remove a passage
- [ ] Add inleiding point
- [ ] Add multiple punt points
- [ ] Add toepassing point
- [ ] Remove a point
- [ ] Submit form
- [ ] Verify success message
- [ ] Check form resets

#### View Sermons
- [ ] Switch to "Preken Bekijken" tab
- [ ] Verify sermons load
- [ ] Test filters:
  - [ ] Filter by preacher
  - [ ] Filter by occasion
  - [ ] Filter by year
- [ ] Click on a sermon card
- [ ] Verify modal opens with full details
- [ ] Check all sermon data is displayed
- [ ] Test delete button
- [ ] Close modal

#### Search
- [ ] Switch to "Zoeken" tab
- [ ] Search for a preacher name
- [ ] Search for a Bible book
- [ ] Search for keywords
- [ ] Verify results are relevant

#### Statistics
- [ ] Switch to "Statistieken" tab
- [ ] Verify stats load:
  - [ ] Total sermons count
  - [ ] Total preachers count
  - [ ] Most used Bible book
  - [ ] Sermons this year
- [ ] Check detailed stats:
  - [ ] Sermons per preacher
  - [ ] Sermons per occasion
  - [ ] Top 10 Bible books
- [ ] Click "Statistieken Vernieuwen"

### 7. Performance Testing

#### Load Time
- [ ] Open DevTools > Network tab
- [ ] Hard reload (Ctrl+Shift+R / Cmd+Shift+R)
- [ ] Check DOMContentLoaded time
- [ ] Check Load time
- [ ] Verify < 3 seconds on 3G

#### Lighthouse Audit (if available)
- [ ] Open DevTools > Lighthouse tab
- [ ] Select all categories
- [ ] Run audit in incognito mode
- [ ] Check scores:
  - [ ] Performance: Target > 90
  - [ ] Accessibility: Target > 90
  - [ ] Best Practices: Target > 90
  - [ ] PWA: Target > 90

### 8. Cross-Browser Testing

- [ ] **Chrome/Edge**
  - [ ] All functionality works
  - [ ] Service Worker registers
  - [ ] Can install as PWA

- [ ] **Firefox**
  - [ ] All functionality works
  - [ ] Service Worker registers
  - [ ] UI looks correct

- [ ] **Safari**
  - [ ] All functionality works
  - [ ] Service Worker registers
  - [ ] Can add to home screen

### 9. Mobile Testing

#### Responsive Design
- [ ] Open DevTools > Toggle device toolbar
- [ ] Test on various sizes:
  - [ ] iPhone SE (375px)
  - [ ] iPhone 12 Pro (390px)
  - [ ] Pixel 5 (393px)
  - [ ] iPad (768px)
  - [ ] iPad Pro (1024px)
- [ ] Verify layout adapts
- [ ] Check all content is accessible
- [ ] Verify no horizontal scroll

#### Touch Interactions
- [ ] Test on actual mobile device
- [ ] Tap targets are large enough (min 44x44px)
- [ ] No accidental taps
- [ ] Swipe gestures don't conflict
- [ ] Virtual keyboard doesn't hide inputs

### 10. Edge Cases

#### Empty States
- [ ] View sermons with no data
- [ ] Search with no results
- [ ] Statistics with no data
- [ ] Check error messages are helpful

#### Validation
- [ ] Submit form with missing required fields
- [ ] Enter invalid date
- [ ] Enter negative numbers for chapters/verses
- [ ] Enter invalid URL
- [ ] Very long text inputs

#### Network Errors
- [ ] Simulate slow 3G
- [ ] Simulate failed API requests
- [ ] Check error handling
- [ ] Verify user feedback

#### Data Limits
- [ ] Add sermon with 10+ passages
- [ ] Add sermon with 20+ points
- [ ] Very long text content
- [ ] Check performance with 100+ sermons

### 11. Background Sync Testing

- [ ] Add sermon while offline
- [ ] Check pending badge appears
- [ ] Go back online
- [ ] Wait for background sync (may need to wait up to 30s)
- [ ] Check notification appears (if supported)
- [ ] Verify sermon synced to server
- [ ] Confirm pending badge removed

### 12. Update Testing

- [ ] Make change to service worker version
- [ ] Load app
- [ ] Check for update notification (if implemented)
- [ ] Refresh page
- [ ] Verify new version loads
- [ ] Check old cache is cleaned up

---

## Test Results Template

### Test Date: ________________
### Tester: ___________________
### Browser/Device: ___________

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Installation | ⬜ | ⬜ | |
| Offline Functionality | ⬜ | ⬜ | |
| Manifest | ⬜ | ⬜ | |
| Security | ⬜ | ⬜ | |
| Accessibility | ⬜ | ⬜ | |
| Functionality | ⬜ | ⬜ | |
| Performance | ⬜ | ⬜ | |
| Cross-Browser | ⬜ | ⬜ | |
| Mobile | ⬜ | ⬜ | |
| Edge Cases | ⬜ | ⬜ | |
| Background Sync | ⬜ | ⬜ | |
| Updates | ⬜ | ⬜ | |

### Issues Found:
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 

---

## Automated Testing Script (Future)

```javascript
// Example Jest test for OfflineDB
describe('OfflineDB', () => {
  let db;
  
  beforeEach(async () => {
    db = new OfflineDB();
    await db.init();
  });
  
  test('should save pending sermon', async () => {
    const sermon = {
      sermon: { location: 'Test Church' },
      passages: [],
      points: []
    };
    
    const id = await db.savePendingSermon(sermon);
    expect(id).toBeDefined();
  });
  
  test('should retrieve pending sermons', async () => {
    const sermon = {
      sermon: { location: 'Test Church' },
      passages: [],
      points: []
    };
    
    await db.savePendingSermon(sermon);
    const pending = await db.getPendingSermons();
    
    expect(pending.length).toBeGreaterThan(0);
    expect(pending[0].sermon.location).toBe('Test Church');
  });
});
```
