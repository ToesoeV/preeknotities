# Critical PWA Improvements - Implementation Guide

This document provides ready-to-implement code fixes for the most critical issues found in the PWA review.

---

## 1. Add Required PNG Icons

### Problem
The manifest only references SVG icons, which don't work on all platforms. PNG icons in specific sizes are required.

### Solution

#### Step 1: Generate PNG Icons
Use an online tool or ImageMagick to generate PNG icons from your SVG:

```bash
# Using ImageMagick (if available)
convert icons/logo.svg -resize 72x72 icons/icon-72x72.png
convert icons/logo.svg -resize 96x96 icons/icon-96x96.png
convert icons/logo.svg -resize 128x128 icons/icon-128x128.png
convert icons/logo.svg -resize 144x144 icons/icon-144x144.png
convert icons/logo.svg -resize 152x152 icons/icon-152x152.png
convert icons/logo.svg -resize 192x192 icons/icon-192x192.png
convert icons/logo.svg -resize 384x384 icons/icon-384x384.png
convert icons/logo.svg -resize 512x512 icons/icon-512x512.png

# Or use online tool: https://realfavicongenerator.net/
```

#### Step 2: Update manifest.json
Replace the icons array with:

```json
{
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

#### Step 3: Add Apple Touch Icons to index.html
```html
<!-- Replace line 19 with: -->
<link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png">
<link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png">
<link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png">

<!-- Replace line 22 with: -->
<link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png">
```

---

## 2. Fix Service Worker Fetch Handler

### Problem
The fetch event handler has multiple early returns without calling `event.respondWith()`, which can cause browser warnings.

### Solution

Replace the entire fetch event listener in `sw.js` (lines 48-102) with:

```javascript
// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // BELANGRIJK: Laat Cloudflare Access en CDN requests ALTIJD door
  if (url.hostname.includes('cloudflareaccess.com') || 
      url.pathname.includes('/cdn-cgi/')) {
    return; // Service Worker doet niets - laat browser het afhandelen
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-first strategy voor API calls
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) {
    event.respondWith(
      fetch(event.request)
        .catch(error => {
          console.error('API request failed:', error);
          // Could return a cached error response or custom offline message
          return new Response(
            JSON.stringify({ error: 'Offline - API niet beschikbaar' }),
            { 
              status: 503, 
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Return cached version
          return response;
        }
        
        // Fetch from network and cache
        return fetch(event.request)
          .then(fetchResponse => {
            // Only cache successful responses for static assets
            if (fetchResponse.ok && fetchResponse.type === 'basic') {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return fetchResponse;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html')
                .then(offlinePage => {
                  if (offlinePage) return offlinePage;
                  return caches.match('/index.html');
                });
            }
            
            // For other requests, return a generic offline response
            throw error;
          });
      })
  );
});
```

---

## 3. Add Content Security Policy

### Problem
No CSP headers make the app vulnerable to XSS attacks.

### Solution

Add this meta tag in `index.html` after line 13 (after apple-mobile-web-app-title):

```html
<!-- Content Security Policy -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               connect-src 'self'; 
               font-src 'self';
               object-src 'none';
               base-uri 'self';
               form-action 'self';
               frame-ancestors 'none';
               upgrade-insecure-requests;">
```

**Note:** This CSP allows `unsafe-inline` for scripts and styles temporarily. See item #5 below for removing inline handlers.

---

## 4. Fix XSS Vulnerabilities

### Problem
User input is inserted into DOM using `innerHTML` without sanitization.

### Solution

#### Option A: Use textContent (Recommended for simple text)

In `functions.js`, update the `displaySermons` function (line 531-546):

```javascript
// BEFORE (line 536-542):
card.innerHTML = `
    <h3>${sermon.location}</h3>
    <div class="sermon-meta">
        <span>👤 ${sermon.preacher}</span>
        <span>📅 ${formatDate(sermon.sermon_date)}</span>
        <span>🎯 ${occasionName}</span>
    </div>
    <div class="sermon-preview">"${sermon.core_text.substring(0, 100)}..."</div>
`;

// AFTER (safer):
const h3 = document.createElement('h3');
h3.textContent = sermon.location;

const meta = document.createElement('div');
meta.className = 'sermon-meta';

const preacherSpan = document.createElement('span');
preacherSpan.textContent = '👤 ' + sermon.preacher;

const dateSpan = document.createElement('span');
dateSpan.textContent = '📅 ' + formatDate(sermon.sermon_date);

const occasionSpan = document.createElement('span');
occasionSpan.textContent = '🎯 ' + occasionName;

meta.appendChild(preacherSpan);
meta.appendChild(dateSpan);
meta.appendChild(occasionSpan);

const preview = document.createElement('div');
preview.className = 'sermon-preview';
preview.textContent = '"' + sermon.core_text.substring(0, 100) + '..."';

card.appendChild(h3);
card.appendChild(meta);
card.appendChild(preview);
```

#### Option B: Use DOMPurify library (Better for complex HTML)

Add DOMPurify to your project:

```html
<!-- Add to index.html before other scripts -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>
```

Then in functions.js:

```javascript
// Sanitize before inserting
card.innerHTML = DOMPurify.sanitize(`
    <h3>${sermon.location}</h3>
    <div class="sermon-meta">
        <span>👤 ${sermon.preacher}</span>
        <span>📅 ${formatDate(sermon.sermon_date)}</span>
        <span>🎯 ${occasionName}</span>
    </div>
    <div class="sermon-preview">"${sermon.core_text.substring(0, 100)}..."</div>
`);
```

**Apply this same fix to:**
- Line 751-775 in `showSermonDetails` function
- Any other place where user input is inserted into DOM

---

## 5. Remove Inline Event Handlers

### Problem
Inline `onclick` attributes violate CSP and are bad practice.

### Solution

#### Update index.html

Remove all `onclick` attributes and add data attributes instead:

```html
<!-- BEFORE (line 36-39): -->
<button class="tab-button active" onclick="showTab('add-sermon')">Preek Toevoegen</button>
<button class="tab-button" onclick="showTab('view-sermons')">Preken Bekijken</button>
<button class="tab-button" onclick="showTab('search')">Zoeken</button>
<button class="tab-button" onclick="showTab('stats')">Statistieken</button>

<!-- AFTER: -->
<button class="tab-button active" data-tab="add-sermon">Preek Toevoegen</button>
<button class="tab-button" data-tab="view-sermons">Preken Bekijken</button>
<button class="tab-button" data-tab="search">Zoeken</button>
<button class="tab-button" data-tab="stats">Statistieken</button>
```

```html
<!-- BEFORE (line 127): -->
<button type="button" class="btn-secondary" onclick="addPassageEntry()">+ Bijbelgedeelte Toevoegen</button>

<!-- AFTER: -->
<button type="button" class="btn-secondary" id="add-passage-btn">+ Bijbelgedeelte Toevoegen</button>
```

```html
<!-- BEFORE (lines 137-139): -->
<button type="button" class="btn-secondary" onclick="addPoint('inleiding')">+ Inleiding</button>
<button type="button" class="btn-secondary" onclick="addPoint('punt')">+ Punt</button>
<button type="button" class="btn-secondary" onclick="addPoint('toepassing')">+ Toepassing</button>

<!-- AFTER: -->
<button type="button" class="btn-secondary" data-point-type="inleiding">+ Inleiding</button>
<button type="button" class="btn-secondary" data-point-type="punt">+ Punt</button>
<button type="button" class="btn-secondary" data-point-type="toepassing">+ Toepassing</button>
```

```html
<!-- BEFORE (line 145): -->
<button type="button" class="btn-secondary" onclick="resetForm()">Formulier Leegmaken</button>

<!-- AFTER: -->
<button type="button" class="btn-secondary" id="reset-form-btn">Formulier Leegmaken</button>
```

```html
<!-- BEFORE (line 178): -->
<button class="btn-primary" onclick="loadSermons()">Filteren</button>

<!-- AFTER: -->
<button class="btn-primary" id="filter-sermons-btn">Filteren</button>
```

```html
<!-- BEFORE (line 192): -->
<button class="btn-primary" onclick="searchSermons()">Zoeken</button>

<!-- AFTER: -->
<button class="btn-primary" id="search-btn">Zoeken</button>
```

```html
<!-- BEFORE (line 237): -->
<button class="btn-primary" onclick="loadStatistics()">Statistieken Vernieuwen</button>

<!-- AFTER: -->
<button class="btn-primary" id="refresh-stats-btn">Statistieken Vernieuwen</button>
```

```html
<!-- BEFORE (line 243): -->
<span class="close" onclick="closeModal()">&times;</span>

<!-- AFTER: -->
<span class="close" id="modal-close-btn" aria-label="Sluiten">&times;</span>
```

```html
<!-- BEFORE (line 246): -->
<button class="btn-danger" onclick="deleteSermon()">Verwijderen</button>
<button class="btn-secondary" onclick="closeModal()">Sluiten</button>

<!-- AFTER: -->
<button class="btn-danger" id="delete-sermon-btn">Verwijderen</button>
<button class="btn-secondary" id="modal-close-btn-2">Sluiten</button>
```

#### Add Event Listeners in functions.js

Update the `setupEventListeners` function (lines 27-29):

```javascript
function setupEventListeners() {
    // Form submission
    document.getElementById('sermon-form').addEventListener('submit', handleSermonSubmit);
    
    // Tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = button.getAttribute('data-tab');
            showTab(tabName, e);
        });
    });
    
    // Add passage button
    document.getElementById('add-passage-btn')?.addEventListener('click', addPassageEntry);
    
    // Add point buttons
    document.querySelectorAll('[data-point-type]').forEach(button => {
        button.addEventListener('click', () => {
            const pointType = button.getAttribute('data-point-type');
            addPoint(pointType);
        });
    });
    
    // Reset form button
    document.getElementById('reset-form-btn')?.addEventListener('click', resetForm);
    
    // Filter sermons button
    document.getElementById('filter-sermons-btn')?.addEventListener('click', loadSermons);
    
    // Search button
    document.getElementById('search-btn')?.addEventListener('click', searchSermons);
    
    // Refresh stats button
    document.getElementById('refresh-stats-btn')?.addEventListener('click', loadStatistics);
    
    // Modal close buttons
    document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
    document.getElementById('modal-close-btn-2')?.addEventListener('click', closeModal);
    
    // Delete sermon button
    document.getElementById('delete-sermon-btn')?.addEventListener('click', deleteSermon);
    
    // Close modal on outside click
    document.getElementById('sermon-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'sermon-modal') {
            closeModal();
        }
    });
    
    // Search on Enter key
    document.getElementById('search-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchSermons();
        }
    });
}
```

Update the `showTab` function signature (line 132):

```javascript
// BEFORE:
function showTab(tabName) {
    // ...
    event.target.classList.add('active');
    // ...
}

// AFTER:
function showTab(tabName, event) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    if (event && event.target) {
        event.target.classList.add('active');
    }

    if (tabName === 'view-sermons') {
        loadSermons();
    } else if (tabName === 'stats') {
        loadStatistics();
    }
}
```

Update dynamic HTML generation to avoid inline handlers:

```javascript
// In addPassageEntry function (line 219):
// BEFORE:
<button type="button" class="remove-passage" onclick="removePassage(${passageCounter})">Verwijderen</button>

// AFTER:
<button type="button" class="remove-passage" data-passage-id="${passageCounter}">Verwijderen</button>
```

Then add delegation listener:

```javascript
// Add to setupEventListeners:
document.getElementById('passages-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-passage')) {
        const passageId = e.target.getAttribute('data-passage-id');
        removePassage(passageId);
    }
});
```

```javascript
// In addPoint function (line 289):
// BEFORE:
<button type="button" class="remove-point" onclick="removePoint(${pointCounter})">×</button>

// AFTER:
<button type="button" class="remove-point" data-point-id="${pointCounter}">×</button>
```

Then add delegation listener:

```javascript
// Add to setupEventListeners:
document.getElementById('points-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-point')) {
        const pointId = e.target.getAttribute('data-point-id');
        removePoint(pointId);
    }
});
```

```javascript
// In displaySermons function (line 533):
// BEFORE:
card.onclick = () => showSermonDetails(sermon.id);

// AFTER:
card.setAttribute('data-sermon-id', sermon.id);
card.style.cursor = 'pointer';
```

Then add delegation listener:

```javascript
// Add to setupEventListeners:
document.getElementById('sermons-list').addEventListener('click', (e) => {
    const card = e.target.closest('.sermon-card');
    if (card) {
        const sermonId = card.getAttribute('data-sermon-id');
        showSermonDetails(sermonId);
    }
});
```

---

## 6. Add ARIA Labels and Roles

### Problem
Missing accessibility attributes for screen readers.

### Solution

Update index.html:

```html
<!-- Tab navigation (line 35-40) -->
<nav class="tabs" role="tablist" aria-label="Hoofdnavigatie">
    <button class="tab-button active" data-tab="add-sermon" 
            role="tab" aria-selected="true" aria-controls="add-sermon">
        Preek Toevoegen
    </button>
    <button class="tab-button" data-tab="view-sermons" 
            role="tab" aria-selected="false" aria-controls="view-sermons">
        Preken Bekijken
    </button>
    <button class="tab-button" data-tab="search" 
            role="tab" aria-selected="false" aria-controls="search">
        Zoeken
    </button>
    <button class="tab-button" data-tab="stats" 
            role="tab" aria-selected="false" aria-controls="stats">
        Statistieken
    </button>
</nav>

<!-- Tab panels -->
<div id="add-sermon" class="tab-content active" role="tabpanel" aria-labelledby="tab-add-sermon">
    <!-- content -->
</div>

<div id="view-sermons" class="tab-content" role="tabpanel" aria-labelledby="tab-view-sermons">
    <!-- content -->
</div>

<!-- etc. -->
```

```html
<!-- Sermon list (line 181) -->
<div id="sermons-list" class="sermons-list" aria-live="polite" aria-busy="false">
    <!-- Sermons loaded here -->
</div>
```

```html
<!-- Search results (line 195) -->
<div id="search-results" class="sermons-list" aria-live="polite" aria-busy="false">
    <!-- Results loaded here -->
</div>
```

```html
<!-- Modal (line 241) -->
<div id="sermon-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-content">
        <span class="close" id="modal-close-btn" aria-label="Sluiten">&times;</span>
        <div id="sermon-details"></div>
        <!-- rest of modal -->
    </div>
</div>
```

Update showTab function in functions.js to manage aria-selected:

```javascript
function showTab(tabName, event) {
    // ... existing code ...
    
    // Update ARIA attributes
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.setAttribute('aria-selected', 'false');
    });
    
    if (event && event.target) {
        event.target.setAttribute('aria-selected', 'true');
    }
    
    // ... rest of function ...
}
```

---

## 7. Add Focus Management for Modal

### Problem
Modal doesn't trap focus or return focus on close.

### Solution

Add to functions.js:

```javascript
// Store last focused element
let lastFocusedElement = null;

// Update showSermonDetails function
async function showSermonDetails(sermonId) {
    currentSermonId = sermonId;
    
    // Store current focus
    lastFocusedElement = document.activeElement;
    
    try {
        // ... existing code to load sermon ...
        
        const modal = document.getElementById('sermon-modal');
        modal.classList.add('active');
        
        // Focus first focusable element in modal
        setTimeout(() => {
            const focusable = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length) {
                focusable[0].focus();
            }
        }, 100);
        
        // Add keydown listener for Escape key
        modal.addEventListener('keydown', handleModalKeydown);
        
    } catch (error) {
        alert('Fout bij laden preek: ' + error.message);
    }
}

function closeModal() {
    const modal = document.getElementById('sermon-modal');
    modal.classList.remove('active');
    modal.removeEventListener('keydown', handleModalKeydown);
    currentSermonId = null;
    
    // Return focus
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

function handleModalKeydown(e) {
    const modal = document.getElementById('sermon-modal');
    
    // Close on Escape
    if (e.key === 'Escape') {
        closeModal();
        return;
    }
    
    // Trap focus
    if (e.key === 'Tab') {
        const focusable = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusable.length === 0) return;
        
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        
        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === first) {
                last.focus();
                e.preventDefault();
            }
        } else {
            // Tab
            if (document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        }
    }
}
```

---

## 8. Create Offline Fallback Page

### Problem
No dedicated offline page when user navigates while offline.

### Solution

Create new file `offline.html`:

```html
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - Preeknotities</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        
        .offline-container {
            max-width: 500px;
        }
        
        .offline-icon {
            font-size: 5rem;
            margin-bottom: 2rem;
        }
        
        h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        
        p {
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 12px 24px;
            font-size: 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: transform 0.2s;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1>Je bent offline</h1>
        <p>
            De Preeknotities app werkt offline! Je kunt preken toevoegen en ze worden 
            automatisch gesynchroniseerd zodra je weer online bent.
        </p>
        <button class="btn" onclick="window.location.href='/'">
            Ga naar de app
        </button>
    </div>
</body>
</html>
```

Update `sw.js` to cache offline.html:

```javascript
const urlsToCache = [
  '/index.html',
  '/offline.html',  // Add this
  '/styles.css',
  '/static-data.js',
  '/functions.js',
  '/offline-db.js',
  '/manifest.json',
  '/icons/logo.svg'
];
```

---

## Summary of Changes

### Files to Modify:
1. **manifest.json** - Add PNG icons
2. **index.html** - Add CSP, remove inline handlers, add ARIA attributes
3. **sw.js** - Fix fetch handler, add offline.html to cache
4. **functions.js** - Add event listeners, fix XSS, add focus management
5. **offline.html** - New file to create

### Files to Create:
1. **offline.html** - Offline fallback page
2. **icons/*.png** - PNG icon files (8-10 files)

### Testing After Changes:
1. Test PWA installation
2. Test offline mode
3. Test accessibility with keyboard and screen reader
4. Verify no console errors
5. Run Lighthouse audit

---

## Next Steps

After implementing these critical fixes:

1. Test thoroughly on multiple browsers
2. Test on real mobile devices
3. Run Lighthouse audit
4. Consider implementing medium-priority improvements
5. Add automated tests
6. Set up CI/CD for automated testing

