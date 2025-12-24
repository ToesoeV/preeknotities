// ===== PREEKNOTITIES APP - FUNCTIONS =====
// Version: 2.2.0 - Hamburger Menu & Improved Text Editing
// Laatste update: 2025-12-24
// Service Worker: v11
// Bible books en occasions worden NIET meer van API geladen!

// ===== CONFIGURATIE =====
const DB_CONFIG = {
    useMockData: false,  // Zet op FALSE voor productie! 
    apiEndpoint: '/api'
};

let currentSermonId = null;
let pointCounter = 0;
let passageCounter = 1;
let syncRetryCount = 0;
const MAX_SYNC_RETRIES = 3;

// ===== INITIALISATIE =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Preeknotities App v2.2.0 - Hamburger Menu & Improved Text Editing');
    console.log('📱 Service Worker: v11');
    console.log('📚 Bible books:', BIBLE_BOOKS.length, 'boeken geladen vanuit lokale data');
    console.log('🎯 Occasions:', OCCASIONS.length, 'gelegenheden geladen vanuit lokale data');
    
    initializeTheme();
    initializeToastContainer();
    initializeNavigation(); // Setup top navigation
    
    // Laad LOKALE statische data (werkt altijd, ook offline!)
    populateBibleBookSelects(); // Gebruikt BIBLE_BOOKS uit static-data.js
    populateOccasionSelects(); // Gebruikt OCCASIONS uit static-data.js
    
    // Setup dynamic dropdowns
    initializeLocationDropdown();
    initializePreacherDropdown();
    
    // Setup auto-generatie voor eerste bijbelgedeelte
    const firstPassage = document.querySelector('[data-passage-id="1"]');
    if (firstPassage) {
        setupPassageUrlAutoGeneration(firstPassage);
    }
    
    // Setup core text auto-generation
    setupCoreTextAutoGeneration();
    
    // Auto-add default sermon structure
    initializeDefaultPoints();
    
    setupEventListeners();
    setTodayDate();
    updatePendingCount();
    checkAndSyncPending();
    updateOnlineStatus(); // Zet initiële status
    
    // Listen voor online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for Service Worker sync messages
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'SYNC_COMPLETE') {
                console.log(`📬 Sync message: ${event.data.count} preken gesynchroniseerd`);
                updatePendingCount();
                
                if (event.data.count > 0) {
                    showToast(`✅ ${event.data.count} preek${event.data.count > 1 ? 'en' : ''} gesynchroniseerd`, 'success');
                }
                
                // Refresh sermon list if visible
                if (document.getElementById('view-sermons').classList.contains('active')) {
                    loadSermons();
                }
            }
        });
    }
});

function setupEventListeners() {
    document.getElementById('sermon-form').addEventListener('submit', handleSermonSubmit);
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ===== KEYBOARD SHORTCUTS =====
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K = Toggle theme
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleTheme();
        showToast('Thema gewisseld', 'info', 1500);
    }
    
    // Ctrl/Cmd + S = Save form (if on add-sermon tab)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const addSermonTab = document.getElementById('add-sermon');
        if (addSermonTab && addSermonTab.classList.contains('active')) {
            e.preventDefault();
            document.getElementById('sermon-form').dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape = Close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('sermon-modal');
        if (modal && modal.classList.contains('active')) {
            closeModal();
        }
    }
}

// ===== THEME MANAGEMENT =====
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Update manifest theme-color
    const metaThemeColor = document.querySelector('meta[name=\"theme-color\"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#1e293b' : '#2563eb');
    }
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

// ===== TOAST NOTIFICATIONS =====
function initializeToastContainer() {
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

function showToast(message, type = 'info', duration = 3000) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Close">×</button>
        ${duration > 0 ? '<div class="toast-progress"></div>' : ''}
    `;
    
    container.appendChild(toast);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto dismiss
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
}

function removeToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// ===== ONLINE/OFFLINE HANDLERS =====
function updateOnlineStatus() {
    const statusDiv = document.getElementById('offline-status');
    if (statusDiv) {
        if (navigator.onLine) {
            statusDiv.textContent = '🌐 Online';
            statusDiv.className = 'online-status online';
        } else {
            statusDiv.textContent = '📱 Offline';
            statusDiv.className = 'online-status offline';
        }
    }
}

function handleOnline() {
    console.log('🌐 Online - controleer pending sermons...');
    updateOnlineStatus();
    showToast('Je bent weer online! Synchroniseren...', 'success', 2000);
    checkAndSyncPending();
}

function handleOffline() {
    console.log('📱 Offline mode');
    updateOnlineStatus();
    showToast('Je bent offline. Wijzigingen worden lokaal opgeslagen.', 'warning', 3000);
}

async function updatePendingCount() {
    try {
        await offlineDB.init();
        const count = await offlineDB.getPendingCount();
        
        const badge = document.getElementById('pending-badge');
        if (count > 0) {
            if (!badge) {
                const header = document.querySelector('header p');
                const badgeHTML = `<span id="pending-badge" class="pending-badge" title="${count} preek${count > 1 ? 'en' : ''} wacht${count === 1 ? '' : 'en'} op synchronisatie">📱 ${count} offline opgeslagen</span>`;
                header.insertAdjacentHTML('afterend', badgeHTML);
            } else {
                badge.textContent = `📱 ${count} offline opgeslagen`;
                badge.title = `${count} preek${count > 1 ? 'en' : ''} wacht${count === 1 ? '' : 'en'} op synchronisatie`;
            }
        } else if (badge) {
            badge.remove();
        }
    } catch (error) {
        console.error('Error updating pending count:', error);
        // Don't throw - this is not critical
    }
}

// Check actual connection quality with timeout
async function checkConnectionQuality(timeout = 5000) {
    if (!navigator.onLine) {
        return false;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Test actual connectivity by pinging our API
        const response = await fetch('/api/user-info', {
            method: 'GET',
            signal: controller.signal,
            cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        // Timeout, network error, or other issue
        console.log('Connection quality check failed:', error.message);
        return false;
    }
}

async function checkAndSyncPending(isRetry = false) {
    if (!navigator.onLine) {
        console.log('📱 Offline - sync uitgesteld');
        return;
    }
    
    // Verify actual connection quality before attempting sync
    const hasConnection = await checkConnectionQuality();
    if (!hasConnection) {
        console.log('📱 Geen echte verbinding - sync uitgesteld');
        
        // Schedule retry with exponential backoff
        if (syncRetryCount < MAX_SYNC_RETRIES) {
            const retryDelay = Math.min(1000 * Math.pow(2, syncRetryCount), 30000); // Max 30s
            console.log(`⏱️ Retry sync in ${retryDelay / 1000}s...`);
            syncRetryCount++;
            setTimeout(() => checkAndSyncPending(true), retryDelay);
        }
        return;
    }
    
    try {
        await offlineDB.init();
        const pendingSermons = await offlineDB.getPendingSermons();
        
        if (pendingSermons.length === 0) {
            syncRetryCount = 0;
            return;
        }
        
        console.log(`📤 Synchroniseren ${pendingSermons.length} pending sermons...`);
        if (!isRetry) {
            showToast(`Synchroniseren van ${pendingSermons.length} preek${pendingSermons.length > 1 ? 'en' : ''}...`, 'info', 2000);
        }
        
        let syncCount = 0;
        let failCount = 0;
        
        for (const sermon of pendingSermons) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
                
                const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sermon: sermon.sermon,
                        passages: sermon.passages,
                        points: sermon.points
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                const result = await response.json();
                
                if (result.success) {
                    await offlineDB.deleteSynced(sermon.id);
                    console.log(`✅ Preek ${sermon.id} gesynchroniseerd`);
                    syncCount++;
                } else {
                    failCount++;
                    console.error(`❌ Preek ${sermon.id} niet geaccepteerd:`, result.error);
                }
            } catch (error) {
                failCount++;
                console.error(`❌ Fout bij synchroniseren preek ${sermon.id}:`, error);
                
                // Stop met sync als we offline zijn gegaan
                if (!navigator.onLine || error.name === 'AbortError') {
                    console.log('⏸️ Sync gestopt - verbinding verloren');
                    break;
                }
            }
        }
        
        await updatePendingCount();
        
        // Toon melding als er iets gesynchroniseerd is
        if (syncCount > 0) {
            console.log(`✅ ${syncCount} preek${syncCount > 1 ? 'en' : ''} gesynchroniseerd`);
            showToast(`✅ ${syncCount} preek${syncCount > 1 ? 'en' : ''} gesynchroniseerd`, 'success');
            syncRetryCount = 0; // Reset on success
        }
        
        // Retry if some failed and we have connection
        if (failCount > 0 && syncRetryCount < MAX_SYNC_RETRIES) {
            const retryDelay = Math.min(2000 * Math.pow(2, syncRetryCount), 30000);
            console.log(`⏱️ ${failCount} mislukt - retry in ${retryDelay / 1000}s...`);
            syncRetryCount++;
            setTimeout(() => checkAndSyncPending(true), retryDelay);
        }
        
        // Refresh sermon list if we're on that tab
        if (navigator.onLine && document.getElementById('view-sermons').classList.contains('active')) {
            loadSermons();
        }
        
    } catch (error) {
        console.error('Error checking pending sermons:', error);
        
        // Retry on error if not too many attempts
        if (syncRetryCount < MAX_SYNC_RETRIES) {
            const retryDelay = Math.min(3000 * Math.pow(2, syncRetryCount), 30000);
            console.log(`⏱️ Error - retry in ${retryDelay / 1000}s...`);
            syncRetryCount++;
            setTimeout(() => checkAndSyncPending(true), retryDelay);
        }
    }
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sermon-date').value = today;
}

// ===== NAVIGATION =====
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    // Navigation button clicks
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            showTab(tabName);
            
            // Update active state
            navButtons.forEach(nav => nav.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

// ===== TAB NAVIGATIE =====
function showTab(tabName) {
    // Verberg alle tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Toon geselecteerde tab
    document.getElementById(tabName).classList.add('active');

    // Load data voor specifieke tabs
    if (tabName === 'view-sermons') {
        loadSermons();
    } else if (tabName === 'stats') {
        loadStatistics();
    }
}

// ===== BIJBELBOEKEN EN GELEGENHEDEN (Lokale Statische Data) =====
// Deze functies gebruiken ALTIJD de lokale data uit static-data.js
// Geen API calls nodig - werkt volledig offline!

function populateBibleBookSelects() {
    const selects = document.querySelectorAll('.bible-book');
    
    selects.forEach(select => {
        select.innerHTML = '<option value="">-- Selecteer boek --</option>';
        
        // Groepeer per testament uit lokale data
        const otBooks = BIBLE_BOOKS.filter(b => b.testament === 'OT');
        const ntBooks = BIBLE_BOOKS.filter(b => b.testament === 'NT');

        if (otBooks.length > 0) {
            const otGroup = document.createElement('optgroup');
            otGroup.label = 'Oud Testament';
            otBooks.forEach(book => {
                const option = document.createElement('option');
                option.value = book.id;
                option.textContent = book.name;
                otGroup.appendChild(option);
            });
            select.appendChild(otGroup);
        }

        if (ntBooks.length > 0) {
            const ntGroup = document.createElement('optgroup');
            ntGroup.label = 'Nieuw Testament';
            ntBooks.forEach(book => {
                const option = document.createElement('option');
                option.value = book.id;
                option.textContent = book.name;
                ntGroup.appendChild(option);
            });
            select.appendChild(ntGroup);
        }
    });
}

function populateOccasionSelects() {
    const selects = ['occasion', 'filter-occasion'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        const defaultOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (defaultOption) {
            select.appendChild(defaultOption.cloneNode(true));
        }

        // Gebruik lokale OCCASIONS data - geen API nodig!
        OCCASIONS.forEach(occ => {
            const option = document.createElement('option');
            option.value = occ.id;
            option.textContent = occ.name;
            select.appendChild(option);
        });
    });
}

// ===== DYNAMIC DROPDOWNS =====
function initializeLocationDropdown() {
    const locationSelect = document.getElementById('location');
    const locationCustom = document.getElementById('location-custom');
    
    // Load saved locations from localStorage
    loadSavedLocations();
    
    // Handle dropdown change
    locationSelect.addEventListener('change', function() {
        if (this.value === '__add_new__') {
            locationCustom.style.display = 'block';
            locationCustom.focus();
            locationCustom.required = true;
            this.required = false;
        } else {
            locationCustom.style.display = 'none';
            locationCustom.required = false;
            this.required = true;
        }
    });
    
    // Handle custom input
    locationCustom.addEventListener('blur', function() {
        if (this.value.trim()) {
            addNewLocation(this.value.trim());
            locationSelect.value = this.value.trim();
            this.style.display = 'none';
            this.required = false;
            locationSelect.required = true;
        }
    });
    
    locationCustom.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
    });
}

function initializePreacherDropdown() {
    const preacherSelect = document.getElementById('preacher');
    const preacherCustom = document.getElementById('preacher-custom');
    
    // Load saved preachers from localStorage
    loadSavedPreachers();
    
    // Handle dropdown change
    preacherSelect.addEventListener('change', function() {
        if (this.value === '__add_new__') {
            preacherCustom.style.display = 'block';
            preacherCustom.focus();
            preacherCustom.required = true;
            this.required = false;
        } else {
            preacherCustom.style.display = 'none';
            preacherCustom.required = false;
            this.required = true;
        }
    });
    
    // Handle custom input
    preacherCustom.addEventListener('blur', function() {
        if (this.value.trim()) {
            addNewPreacher(this.value.trim());
            preacherSelect.value = this.value.trim();
            this.style.display = 'none';
            this.required = false;
            preacherSelect.required = true;
        }
    });
    
    preacherCustom.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
    });
}

function loadSavedLocations() {
    const locations = JSON.parse(localStorage.getItem('savedLocations') || '[]');
    const select = document.getElementById('location');
    
    // Clear existing options except default and add new
    const defaultOption = select.querySelector('option[value=""]');
    const addNewOption = select.querySelector('option[value="__add_new__"]');
    select.innerHTML = '';
    
    if (defaultOption) select.appendChild(defaultOption.cloneNode(true));
    
    // Add saved locations
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        select.appendChild(option);
    });
    
    if (addNewOption) select.appendChild(addNewOption.cloneNode(true));
}

function loadSavedPreachers() {
    const preachers = JSON.parse(localStorage.getItem('savedPreachers') || '[]');
    const select = document.getElementById('preacher');
    
    // Clear existing options except default and add new
    const defaultOption = select.querySelector('option[value=""]');
    const addNewOption = select.querySelector('option[value="__add_new__"]');
    select.innerHTML = '';
    
    if (defaultOption) select.appendChild(defaultOption.cloneNode(true));
    
    // Add saved preachers
    preachers.forEach(preacher => {
        const option = document.createElement('option');
        option.value = preacher;
        option.textContent = preacher;
        select.appendChild(option);
    });
    
    if (addNewOption) select.appendChild(addNewOption.cloneNode(true));
}

function addNewLocation(location) {
    const locations = JSON.parse(localStorage.getItem('savedLocations') || '[]');
    if (!locations.includes(location)) {
        locations.push(location);
        locations.sort();
        localStorage.setItem('savedLocations', JSON.stringify(locations));
        loadSavedLocations();
    }
}

function addNewPreacher(preacher) {
    const preachers = JSON.parse(localStorage.getItem('savedPreachers') || '[]');
    if (!preachers.includes(preacher)) {
        preachers.push(preacher);
        preachers.sort();
        localStorage.setItem('savedPreachers', JSON.stringify(preachers));
        loadSavedPreachers();
    }
}

function getFieldValue(fieldName) {
    const select = document.getElementById(fieldName);
    const customInput = document.getElementById(fieldName + '-custom');
    
    // If custom input is visible and has value, use that
    if (customInput.style.display !== 'none' && customInput.value.trim()) {
        return customInput.value.trim();
    }
    
    // Otherwise use the select value (unless it's the add new option)
    if (select.value && select.value !== '__add_new__') {
        return select.value;
    }
    
    return '';
}

// ===== BIJBELGEDEELTE TOEVOEGEN =====
function addPassageEntry() {
    passageCounter++;
    const container = document.getElementById('passages-container');
    
    const passageHTML = `
        <div class="passage-entry" data-passage-id="${passageCounter}">
            <button type="button" class="remove-passage" onclick="removePassage(${passageCounter})">Verwijderen</button>
            <h4>Bijbelgedeelte ${passageCounter}</h4>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Bijbelboek *</label>
                    <select class="bible-book" required>
                        <option value="">-- Selecteer boek --</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Hoofdstuk *</label>
                    <input type="number" class="chapter-start" min="1" required>
                </div>

                <div class="form-group">
                    <label>Vers (optioneel)</label>
                    <input type="number" class="verse-start" min="1">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Tot hoofdstuk (optioneel)</label>
                    <input type="number" class="chapter-end" min="1">
                </div>

                <div class="form-group">
                    <label>Tot vers (optioneel)</label>
                    <input type="number" class="verse-end" min="1">
                </div>
            </div>

            <div class="form-group">
                <label>Link naar bijbelgedeelte</label>
                <a href="#" class="passage-url" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 12px; background: #dbeafe; color: #1e40af; border-radius: 4px; text-decoration: none; font-size: 0.9rem;">Vul eerst bijbelboek en hoofdstuk in...</a>
            </div>

            <div class="form-group checkbox-group">
                <input type="checkbox" class="is-main">
                <label>Hoofdgedeelte</label>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', passageHTML);
    populateBibleBookSelects();
    
    // Voeg event listeners toe voor auto-generatie URL
    const newEntry = container.querySelector(`[data-passage-id="${passageCounter}"]`);
    setupPassageUrlAutoGeneration(newEntry);
}

function setupPassageUrlAutoGeneration(passageEntry) {
    const bookSelect = passageEntry.querySelector('.bible-book');
    const chapterStart = passageEntry.querySelector('.chapter-start');
    const verseStart = passageEntry.querySelector('.verse-start');
    const urlLink = passageEntry.querySelector('.passage-url');
    
    // Functie om URL te genereren
    const updateUrl = () => {
        const bookId = bookSelect.value;
        const chapter = chapterStart.value;
        
        if (bookId && chapter) {
            const url = generateBibleUrl(
                bookId,
                chapter,
                verseStart.value || null
            );
            
            // Update link href en text
            urlLink.href = url;
            urlLink.textContent = url;
            urlLink.style.pointerEvents = 'auto';
        } else {
            // Reset naar placeholder staat
            urlLink.href = '#';
            urlLink.textContent = 'Vul eerst bijbelboek en hoofdstuk in...';
            urlLink.style.pointerEvents = 'none';
        }
    };
    
    // Luister naar wijzigingen
    bookSelect.addEventListener('change', updateUrl);
    chapterStart.addEventListener('input', updateUrl);
    verseStart.addEventListener('input', updateUrl);
}

// Setup core text auto-generation
function setupCoreTextAutoGeneration() {
    const bookSelect = document.getElementById('core-text-book');
    const chapterInput = document.getElementById('core-text-chapter');
    const verseInput = document.getElementById('core-text-verse');
    const verseEndInput = document.getElementById('core-text-verse-end');
    const urlLink = document.getElementById('core-text-url');
    
    if (!bookSelect || !chapterInput || !verseInput || !urlLink) {
        console.warn('Core text elements not found');
        return;
    }
    
    const updateUrl = () => {
        const bookId = parseInt(bookSelect.value);
        const chapter = parseInt(chapterInput.value);
        const verse = parseInt(verseInput.value);
        const verseEnd = verseEndInput ? parseInt(verseEndInput.value) : null;
        
        if (bookId && chapter && verse) {
            // Always use only the first verse for the link
            const url = generateBibleUrl(bookId, chapter, verse);
            
            // Build display text with range if end verse is provided
            const book = BIBLE_BOOKS.find(b => b.id === bookId);
            let displayText = url;
            if (book && verseEnd && verseEnd > verse) {
                // Show range in text but link stays to first verse
                displayText = `${book.name} ${chapter}:${verse}-${verseEnd} (link to verse ${verse})`;
            }
            
            // Update link
            urlLink.href = url;
            urlLink.textContent = displayText;
            urlLink.style.pointerEvents = 'auto';
            urlLink.style.background = '#dbeafe';
        } else {
            // Reset
            urlLink.href = '#';
            urlLink.textContent = 'Selecteer eerst kerntekst...';
            urlLink.style.pointerEvents = 'none';
            urlLink.style.background = '#e5e7eb';
        }
    };
    
    bookSelect.addEventListener('change', updateUrl);
    chapterInput.addEventListener('input', updateUrl);
    verseInput.addEventListener('input', updateUrl);
    if (verseEndInput) {
        verseEndInput.addEventListener('input', updateUrl);
    }
}

function removePassage(passageId) {
    const passage = document.querySelector(`[data-passage-id="${passageId}"]`);
    if (passage) {
        passage.remove();
    }
}

// ===== PREEKPUNTEN TOEVOEGEN =====
function addPoint(type) {
    pointCounter++;
    const container = document.getElementById('points-container');
    
    const typeLabels = {
        'inleiding': 'Inleiding',
        'punt': 'Punt',
        'toepassing': 'Toepassing'
    };
    
    const pointHTML = `
        <div class="point-entry" data-point-id="${pointCounter}">
            <button type="button" class="remove-point" onclick="removePoint(${pointCounter})">×</button>
            <h4>${typeLabels[type]} <span class="badge ${type}">${typeLabels[type]}</span></h4>
            
            <div class="form-group">
                <label>Titel (optioneel)</label>
                <input type="text" class="point-title" placeholder="bijv.Gods liefde voor de wereld">
            </div>

            <div class="form-group">
                <label>Inhoud</label>
                <textarea class="point-content" rows="4" placeholder="Notities..."></textarea>
            </div>

            <input type="hidden" class="point-type" value="${type}">
            <input type="hidden" class="point-order" value="${pointCounter}">
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', pointHTML);
}

function removePoint(pointId) {
    const point = document.querySelector(`[data-point-id="${pointId}"]`);
    if (point) {
        point.remove();
    }
}

function initializeDefaultPoints() {
    // Only add default points if container is empty
    const container = document.getElementById('points-container');
    if (container && container.children.length === 0) {
        addPoint('inleiding');
        addPoint('punt');
        addPoint('punt');
        addPoint('punt');
        addPoint('toepassing');
    }
}

// ===== PREEK OPSLAAN =====
async function handleSermonSubmit(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('form-message');
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    
    // Disable button during save
    submitButton.disabled = true;
    submitButton.textContent = '💾 Opslaan...';
    
    try {
        // Verzamel sermon data with new core text format
        const coreTextBook = document.getElementById('core-text-book').value;
        const coreTextChapter = document.getElementById('core-text-chapter').value;
        const coreTextVerse = document.getElementById('core-text-verse').value;
        const coreTextVerseEnd = document.getElementById('core-text-verse-end').value;
        
        // Generate core text reference string with range support
        let coreTextReference = '';
        let coreTextUrl = '';
        if (coreTextBook && coreTextChapter && coreTextVerse) {
            const book = BIBLE_BOOKS.find(b => b.id == coreTextBook);
            if (book) {
                coreTextReference = `${book.name} ${coreTextChapter}:${coreTextVerse}`;
                if (coreTextVerseEnd && parseInt(coreTextVerseEnd) > parseInt(coreTextVerse)) {
                    coreTextReference += `-${coreTextVerseEnd}`;
                }
                
                // Get the core text URL from the link element
                const coreTextUrlElement = document.getElementById('core-text-url');
                if (coreTextUrlElement && coreTextUrlElement.href && coreTextUrlElement.href !== '#') {
                    coreTextUrl = coreTextUrlElement.href;
                }
            }
        }
        
        const sermonData = {
            location: getFieldValue('location'),
            preacher: getFieldValue('preacher'),
            sermon_date: document.getElementById('sermon-date').value,
            core_text: coreTextReference,
            core_text_url: coreTextUrl,
            occasion_id: document.getElementById('occasion').value || 16 // Default to "Reguliere dienst"
        };

        // Debug: Log exactly what we're sending to the API
        console.log('📤 Sending to API:', JSON.stringify(sermonData, null, 2));
        
        // Verzamel passages
        const passages = [];
        document.querySelectorAll('.passage-entry').forEach((entry) => {
            const bibleBookId = entry.querySelector('.bible-book').value;
            if (!bibleBookId) return; // Skip als geen boek geselecteerd
            
            const urlLink = entry.querySelector('.passage-url');
            const passageUrl = urlLink.href !== '#' && urlLink.href !== window.location.href ? urlLink.href : null;
            
            passages.push({
                bible_book_id: parseInt(bibleBookId),
                chapter_start: parseInt(entry.querySelector('.chapter-start').value),
                verse_start: parseInt(entry.querySelector('.verse-start').value) || null,
                chapter_end: parseInt(entry.querySelector('.chapter-end').value) || null,
                verse_end: parseInt(entry.querySelector('.verse-end').value) || null,
                is_main_passage: entry.querySelector('.is-main').checked ? 1 : 0,
                passage_url: passageUrl
            });
        });

        // Verzamel points
        const points = [];
        document.querySelectorAll('.point-entry').forEach((entry, index) => {
            const content = entry.querySelector('.point-content').value;
            if (content.trim()) {
                points.push({
                    point_type: entry.querySelector('.point-type').value,
                    point_order: index + 1,
                    title: entry.querySelector('.point-title').value || null,
                    content: content
                });
            }
        });

        const payload = {
            sermon: sermonData,
            passages: passages,
            points: points
        };

        // Check connection quality (not just navigator.onLine)
        const isOnline = navigator.onLine && await checkConnectionQuality();

        if (!isOnline) {
            // Offline: sla op in IndexedDB
            await offlineDB.init();
            await offlineDB.savePendingSermon(payload);
            
            showToast('📱 Offline opgeslagen - wordt gesynchroniseerd zodra je online bent', 'success', 4000);
            
            updatePendingCount();
            
            setTimeout(() => {
                resetForm();
            }, 1000);
            
            return;
        }

        // Online: verstuur naar API met timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        submitButton.textContent = '📤 Verzenden...';
        
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const result = await response.json();

        // Debug: Compare what we sent vs what was saved
        console.log('📥 API Response:', JSON.stringify(result, null, 2));
        if (result.sermon && result.sermon.occasion_id) {
            console.log(`🔍 Occasion ID comparison:
                Sent: ${payload.sermon.occasion_id}
                Saved: ${result.sermon.occasion_id}
                Match: ${payload.sermon.occasion_id == result.sermon.occasion_id ? '✅' : '❌'}`);
        }

        if (result.error) {
            throw new Error(result.error);
        }

        if (result.success) {
            showToast('✅ Preek succesvol opgeslagen!', 'success');
            
            setTimeout(() => {
                resetForm();
            }, 1000);
        }

    } catch (error) {
        console.error('Save error:', error);
        
        // Network error or timeout - probeer offline op te slaan
        if (error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            try {
                // Re-collect form data with new core text format
                const coreTextBook = document.getElementById('core-text-book').value;
                const coreTextChapter = document.getElementById('core-text-chapter').value;
                const coreTextVerse = document.getElementById('core-text-verse').value;
                const coreTextVerseEnd = document.getElementById('core-text-verse-end').value;
                
                let coreTextReference = '';
                if (coreTextBook && coreTextChapter && coreTextVerse) {
                    const book = BIBLE_BOOKS.find(b => b.id == coreTextBook);
                    if (book) {
                        coreTextReference = `${book.name} ${coreTextChapter}:${coreTextVerse}`;
                        if (coreTextVerseEnd && parseInt(coreTextVerseEnd) > parseInt(coreTextVerse)) {
                            coreTextReference += `-${coreTextVerseEnd}`;
                        }
                    }
                }
                
                const payload = {
                    sermon: {
                        location: document.getElementById('location').value,
                        preacher: document.getElementById('preacher').value,
                        sermon_date: document.getElementById('sermon-date').value,
                        core_text: coreTextReference,
                        occasion_id: document.getElementById('occasion').value || null
                    },
                    passages: Array.from(document.querySelectorAll('.passage-entry')).map(entry => {
                        const bibleBookId = entry.querySelector('.bible-book').value;
                        if (!bibleBookId) return null;
                        
                        const urlLink = entry.querySelector('.passage-url');
                        const passageUrl = urlLink.href !== '#' && urlLink.href !== window.location.href ? urlLink.href : null;
                        
                        return {
                            bible_book_id: parseInt(bibleBookId),
                            chapter_start: parseInt(entry.querySelector('.chapter-start').value),
                            verse_start: parseInt(entry.querySelector('.verse-start').value) || null,
                            chapter_end: parseInt(entry.querySelector('.chapter-end').value) || null,
                            verse_end: parseInt(entry.querySelector('.verse-end').value) || null,
                            is_main_passage: entry.querySelector('.is-main').checked ? 1 : 0,
                            passage_url: passageUrl
                        };
                    }).filter(p => p !== null),
                    points: Array.from(document.querySelectorAll('.point-entry')).map((entry, index) => {
                        const content = entry.querySelector('.point-content').value;
                        if (!content.trim()) return null;
                        return {
                            point_type: entry.querySelector('.point-type').value,
                            point_order: index + 1,
                            title: entry.querySelector('.point-title').value || null,
                            content: content
                        };
                    }).filter(p => p !== null)
                };
                
                await offlineDB.init();
                await offlineDB.savePendingSermon(payload);
                
                const errorMsg = error.name === 'AbortError' ? 
                    '⏱️ Verbinding te traag - offline opgeslagen voor latere synchronisatie' :
                    '📱 Verbinding mislukt - offline opgeslagen voor latere synchronisatie';
                    
                showToast(errorMsg, 'warning', 5000);
                
                updatePendingCount();
                
                setTimeout(() => {
                    resetForm();
                }, 1000);
                
                return;
            } catch (dbError) {
                console.error('Failed to save offline:', dbError);
                showToast('❌ Opslaan mislukt: ' + dbError.message, 'error', 5000);
            }
        } else {
            showToast('❌ Fout bij opslaan: ' + error.message, 'error', 5000);
        }
    } finally {
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

function resetForm() {
    document.getElementById('sermon-form').reset();
    document.getElementById('points-container').innerHTML = '';
    
    // Reset passages naar alleen de eerste
    const passagesContainer = document.getElementById('passages-container');
    const allPassages = passagesContainer.querySelectorAll('.passage-entry');
    allPassages.forEach((passage, index) => {
        if (index > 0) passage.remove();
    });
    
    // Reset core text URL
    const coreTextUrl = document.getElementById('core-text-url');
    if (coreTextUrl) {
        coreTextUrl.href = '#';
        coreTextUrl.textContent = 'Selecteer eerst kerntekst...';
        coreTextUrl.style.pointerEvents = 'none';
        coreTextUrl.style.background = '#e5e7eb';
    }
    
    pointCounter = 0;
    passageCounter = 1;
    setTodayDate();
}

// ===== PREKEN LADEN EN TONEN =====
async function loadSermons() {
    const listDiv = document.getElementById('sermons-list');
    
    // Check of we offline zijn
    if (!navigator.onLine) {
        listDiv.innerHTML = `
            <div class="message" style="background-color: var(--warning-color); color: #92400e; border-left: 4px solid #f59e0b;">
                📱 Offline - preken bekijken is alleen beschikbaar wanneer je online bent
            </div>
        `;
        return;
    }
    
    // Show skeleton loading
    listDiv.innerHTML = `
        <div class="skeleton sermon-skeleton"></div>
        <div class="skeleton sermon-skeleton"></div>
        <div class="skeleton sermon-skeleton"></div>
    `;

    try {
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons`);
        const sermons = await response.json();
        
        if (sermons.error) {
            throw new Error(sermons.error);
        }

        // Small delay to show loading state (prevents flash)
        await new Promise(resolve => setTimeout(resolve, 200));
        
        displaySermons(sermons, listDiv);
        populateFilterOptions(sermons);
    } catch (error) {
        if (!navigator.onLine || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            listDiv.innerHTML = `
                <div class="message" style="background-color: var(--warning-color); color: #92400e; border-left: 4px solid #f59e0b;">
                    📱 Offline - preken bekijken is alleen beschikbaar wanneer je online bent
                </div>
            `;
        } else {
            listDiv.innerHTML = `<div class="message error">Fout bij laden: ${error.message}</div>`;
        }
    }
}

function displaySermons(sermons, container) {
    if (sermons.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Geen preken gevonden</h3>
                <p>Er zijn nog geen preken toegevoegd of je filters leveren geen resultaten op.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    sermons.forEach(sermon => {
        // Lookup occasion name from local OCCASIONS array
        // Convert both to numbers for proper comparison
        const occasionId = sermon.occasion_id ? parseInt(sermon.occasion_id) : 16;
        const occasion = OCCASIONS.find(o => o.id === occasionId);
        const occasionName = occasion ? occasion.name : 'Reguliere dienst';
        
        const card = document.createElement('div');
        card.className = 'sermon-card';
        card.onclick = () => showSermonDetails(sermon.id);
        
        card.innerHTML = `
            <h3>${sermon.location}</h3>
            <div class="sermon-meta">
                <span>👤 ${sermon.preacher}</span>
                <span>📅 ${formatDate(sermon.sermon_date)}</span>
                <span>🎯 ${occasionName}</span>
            </div>
            <div class="sermon-preview">"${sermon.core_text.substring(0, 100)}..."</div>
        `;
        
        container.appendChild(card);
    });
}

function populateFilterOptions(sermons) {
    // Unique preachers
    const preachers = [...new Set(sermons.map(s => s.preacher))];
    const preacherSelect = document.getElementById('filter-preacher');
    preacherSelect.innerHTML = '<option value="">Alle predikanten</option>';
    preachers.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        preacherSelect.appendChild(option);
    });

    // Unique years
    const years = [...new Set(sermons.map(s => s.sermon_date.substring(0, 4)))];
    const yearSelect = document.getElementById('filter-year');
    yearSelect.innerHTML = '<option value="">Alle jaren</option>';
    years.sort().reverse().forEach(y => {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    });
}

// ===== ZOEKEN =====
async function searchSermons() {
    const searchTerm = document.getElementById('search-input').value;
    const resultsDiv = document.getElementById('search-results');
    
    if (!searchTerm) {
        resultsDiv.innerHTML = '<div class="empty-state"><p>Voer een zoekterm in</p></div>';
        return;
    }
    
    // Check of we offline zijn
    if (!navigator.onLine) {
        resultsDiv.innerHTML = `
            <div class="message" style="background-color: var(--warning-color); color: #92400e; border-left: 4px solid #f59e0b;">
                📱 Offline - zoeken is alleen beschikbaar wanneer je online bent
            </div>
        `;
        return;
    }

    resultsDiv.innerHTML = `
        <div class="skeleton sermon-skeleton"></div>
        <div class="skeleton sermon-skeleton"></div>
    `;

    try {
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons?search=${encodeURIComponent(searchTerm)}`);
        const results = await response.json();
        
        if (results.error) {
            throw new Error(results.error);
        }
        
        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 200));
        
        displaySermons(results, resultsDiv);
    } catch (error) {
        if (!navigator.onLine || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            resultsDiv.innerHTML = `
                <div class="message" style="background-color: var(--warning-color); color: #92400e; border-left: 4px solid #f59e0b;">
                    📱 Offline - zoeken is alleen beschikbaar wanneer je online bent
                </div>
            `;
        } else {
            resultsDiv.innerHTML = `<div class="message error">Fout bij zoeken: ${error.message}</div>`;
        }
    }
}

// ===== STATISTIEKEN =====
async function loadStatistics() {
    try {
        // Check of we offline zijn
        if (!navigator.onLine) {
            document.querySelector('.stats-grid').innerHTML = `
                <div class="message" style="grid-column: 1/-1; background-color: #fef3c7; color: #92400e; border-left: 4px solid #f59e0b;">
                    📱 Offline - statistieken zijn alleen beschikbaar wanneer je online bent
                </div>
            `;
            return;
        }
        
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/stats`);
        const stats = await response.json();
        
        if (stats.error) {
            throw new Error(stats.error);
        }
        
        document.getElementById('total-sermons').textContent = stats.totalSermons || 0;
        document.getElementById('total-preachers').textContent = stats.totalPreachers || 0;
        document.getElementById('sermons-this-year').textContent = stats.sermonsThisYear || 0;
        
        if (stats.bookStats && stats.bookStats.length > 0) {
            // Lookup book name from local BIBLE_BOOKS array using bible_book_id
            const book = BIBLE_BOOKS.find(b => b.id == stats.bookStats[0].bible_book_id);
            document.getElementById('most-used-book').textContent = book ? book.name : '-';
        } else {
            document.getElementById('most-used-book').textContent = '-';
        }

        // Display detailed stats
        if (stats.preacherStats) {
            displayPreachersStatsFromAPI(stats.preacherStats, stats.totalSermons);
        }
        if (stats.bookStats) {
            displayBooksStatsFromAPI(stats.bookStats);
        }
        
        // Load all sermons to calculate occasion stats locally
        const sermonsResponse = await fetch(`${DB_CONFIG.apiEndpoint}/sermons`);
        const sermons = await sermonsResponse.json();
        if (!sermons.error && sermons.length > 0) {
            displayOccasionsStatsFromAPI(sermons);
        }

    } catch (error) {
        console.error('Error loading stats:', error);
        
        // Check of het een network error is
        if (!navigator.onLine || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            document.querySelector('.stats-grid').innerHTML = `
                <div class="message" style="grid-column: 1/-1; background-color: #fef3c7; color: #92400e; border-left: 4px solid #f59e0b;">
                    📱 Offline - statistieken zijn alleen beschikbaar wanneer je online bent
                </div>
            `;
        } else {
            document.querySelector('.stats-grid').innerHTML = `
                <div class="message error" style="grid-column: 1/-1;">
                    Fout bij laden statistieken: ${error.message}
                </div>
            `;
        }
    }
}

function displayPreachersStatsFromAPI(stats, total) {
    const container = document.getElementById('preachers-stats');
    container.innerHTML = '';
    
    if (! stats || stats.length === 0) {
        container.innerHTML = '<p>Nog geen data beschikbaar</p>';
        return;
    }
    
    stats.forEach(stat => {
        const percentage = total > 0 ? (stat.count / total * 100).toFixed(1) : 0;
        container.innerHTML += `
            <div class="stat-bar">
                <span>${stat.preacher}</span>
                <span><strong>${stat.count}</strong> preken</span>
            </div>
            <div class="stat-bar-fill" style="width: ${percentage}%"></div>
        `;
    });
}

function displayOccasionsStatsFromAPI(sermons) {
    const container = document.getElementById('occasions-stats');
    container.innerHTML = '';
    
    if (!sermons || sermons.length === 0) {
        container.innerHTML = '<p>Nog geen data beschikbaar</p>';
        return;
    }
    
    // Count occasions locally from sermon data
    const occasionCounts = {};
    sermons.forEach(sermon => {
        const occasionId = sermon.occasion_id || 16; // Default to 'Reguliere dienst'
        occasionCounts[occasionId] = (occasionCounts[occasionId] || 0) + 1;
    });
    
    // Convert to array and sort by count
    const stats = Object.entries(occasionCounts).map(([id, count]) => {
        const occasion = OCCASIONS.find(o => o.id == id);
        return {
            name: occasion ? occasion.name : 'Reguliere dienst',
            count: count
        };
    }).sort((a, b) => b.count - a.count);
    
    const total = sermons.length;
    stats.forEach(stat => {
        const percentage = total > 0 ? (stat.count / total * 100).toFixed(1) : 0;
        container.innerHTML += `
            <div class="stat-bar">
                <span>${stat.name}</span>
                <span><strong>${stat.count}</strong> preken</span>
            </div>
            <div class="stat-bar-fill" style="width: ${percentage}%"></div>
        `;
    });
}

function displayBooksStatsFromAPI(stats) {
    const container = document.getElementById('books-stats');
    container.innerHTML = '';
    
    if (! stats || stats.length === 0) {
        container.innerHTML = '<p>Nog geen data beschikbaar</p>';
        return;
    }
    
    const maxCount = stats[0] ? stats[0].count : 1;
    
    stats.forEach(stat => {
        // Lookup book name from local BIBLE_BOOKS array using bible_book_id
        const book = BIBLE_BOOKS.find(b => b.id == stat.bible_book_id);
        const bookName = book ? book.name : `Book ID ${stat.bible_book_id}`;
        
        const percentage = (stat.count / maxCount * 100).toFixed(1);
        container.innerHTML += `
            <div class="stat-bar">
                <span>${bookName}</span>
                <span><strong>${stat.count}</strong> keer gebruikt</span>
            </div>
            <div class="stat-bar-fill" style="width: ${percentage}%"></div>
        `;
    });
}

// ===== MODAL =====
async function showSermonDetails(sermonId) {
    currentSermonId = sermonId;
    
    try {
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons/${sermonId}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        const { sermon, passages, points } = data;
        
        let detailsHTML = `
            <h2>${sermon.location}</h2>
            <div class="sermon-meta" style="margin-bottom: 20px;">
                <span>👤 ${sermon.preacher}</span>
                <span>📅 ${formatDate(sermon.sermon_date)}</span>
            </div>

            <h3>Kerntekst</h3>
            <p style="font-style: italic; margin-bottom: 10px;">"${sermon.core_text}"</p>
            ${sermon.core_text_url ? `<p><a href="${sermon.core_text_url}" target="_blank" rel="noopener noreferrer" class="passage-url">📖 Lees kerntekst online</a></p>` : ''}
            <div style="margin-bottom: 20px;"></div>

            <h3>Bijbelgedeelten</h3>
        `;

        passages.forEach(passage => {
            // Lookup book name from local BIBLE_BOOKS array
            const book = BIBLE_BOOKS.find(b => b.id == passage.bible_book_id);
            const bookName = book ? book.name : `Book ${passage.bible_book_id}`;
            const reference = formatPassageReference(passage, bookName);
            
            detailsHTML += `
                <p>
                    ${passage.is_main_passage ? '📌' : '📖'} 
                    <strong>${reference}</strong>
                    ${passage.passage_url ? `<a href="${passage.passage_url}" target="_blank">→ Open</a>` : ''}
                </p>
            `;
        });

        if (points && points.length > 0) {
            detailsHTML += '<h3>Preekpunten</h3>';
            points.forEach(point => {
                detailsHTML += `
                    <div style="margin-bottom: 15px;">
                        <strong>${point.title || point.point_type}</strong>
                        <span class="badge ${point.point_type}">${point.point_type}</span>
                        <p style="margin-top: 5px;">${point.content}</p>
                    </div>
                `;
            });
        }

        document.getElementById('sermon-details').innerHTML = detailsHTML;
        document.getElementById('sermon-modal').classList.add('active');

    } catch (error) {
        alert('Fout bij laden preek: ' + error.message);
    }
}

function closeModal() {
    document.getElementById('sermon-modal').classList.remove('active');
    currentSermonId = null;
}

async function deleteSermon() {
    if (!currentSermonId) return;
    
    if (confirm('Weet je zeker dat je deze preek wilt verwijderen?')) {
        try {
            const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons/${currentSermonId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            closeModal();
            loadSermons();
            alert('Preek verwijderd! ');
        } catch (error) {
            alert('Fout bij verwijderen: ' + error.message);
        }
    }
}

// ===== HELPER FUNCTIES =====
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatPassageReference(passage, bookName) {
    let ref = bookName;
    
    if (passage.chapter_start) {
        ref += ` ${passage.chapter_start}`;
        
        if (passage.verse_start) {
            ref += `:${passage.verse_start}`;
        }
        
        if (passage.chapter_end && passage.chapter_end !== passage.chapter_start) {
            ref += `-${passage.chapter_end}`;
            
            if (passage.verse_end) {
                ref += `:${passage.verse_end}`;
            }
        } else if (passage.verse_end && passage.verse_end !== passage.verse_start) {
            ref += `-${passage.verse_end}`;
        }
    }
    
    return ref;
}

async function displayUserInfo() {
    // Skip als offline
    if (!navigator.onLine) {
        return;
    }
    
    try {
        const response = await fetch('/api/user-info');
        const data = await response.json();
        
        if (data.email) {
            const userInfoEl = document.getElementById('user-info');
            userInfoEl.innerHTML = `✓ Ingelogd als: <strong>${data.email}</strong>`;
        }
    } catch (error) {
        console.error('Could not load user info:', error);
        // Niet erg - we zijn waarschijnlijk offline
    }
}

// Close modal bij klikken buiten de modal
window.onclick = function(event) {
    const modal = document.getElementById('sermon-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// ===== DEBUG HELPERS =====
// Force clear all caches (gebruik in console: clearAllCaches())
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('🗑️ All caches cleared!');
    
    // Unregister service worker
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
    console.log('🔄 Service worker unregistered!');
    
    console.log('✅ Reload de pagina om een verse versie te krijgen');
    showToast('Cache gewist - reload pagina', 'info', 3000);
}

// Reset IndexedDB (gebruik in console: resetOfflineDB())
async function resetOfflineDB() {
    try {
        await offlineDB.resetDatabase();
        console.log('✅ IndexedDB gereset! Reload de pagina.');
        showToast('Database gereset - reload pagina', 'info', 3000);
    } catch (error) {
        console.error('❌ Failed to reset IndexedDB:', error);
    }
}

// Show storage info (gebruik in console: showStorageInfo())
async function showStorageInfo() {
    const info = await offlineDB.getStorageInfo();
    if (info) {
        console.log(`📊 Storage Info:
  Usage: ${info.usageMB} MB / ${info.quotaMB} MB
  Percentage: ${info.percentUsed.toFixed(2)}%
  Available: ${(info.quotaMB - info.usageMB).toFixed(2)} MB`);
        showToast(`Storage: ${info.percentUsed.toFixed(1)}% gebruikt (${info.usageMB}/${info.quotaMB} MB)`, 'info', 4000);
    } else {
        console.log('Storage API niet beschikbaar');
    }
    return info;
}

// Clean old synced items (gebruik in console: cleanOldItems())
async function cleanOldItems(days = 30) {
    const count = await offlineDB.cleanOldSyncedItems(days);
    console.log(`✅ ${count} oude items verwijderd`);
    showToast(`${count} oude items verwijderd`, 'success');
    return count;
}

// Maak beschikbaar in console
window.clearAllCaches = clearAllCaches;
window.resetOfflineDB = resetOfflineDB;
window.showStorageInfo = showStorageInfo;
window.cleanOldItems = cleanOldItems;