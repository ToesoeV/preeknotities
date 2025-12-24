// ===== CONFIGURATIE =====
const DB_CONFIG = {
    useMockData: false,  // Zet op FALSE voor productie! 
    apiEndpoint: '/api'
};

let currentSermonId = null;
let pointCounter = 0;
let passageCounter = 1;

// ===== INITIALISATIE =====
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeToastContainer();
    populateBibleBookSelects(); // Gebruik statische data
    populateOccasionSelects(); // Gebruik statische data
    setupEventListeners();
    setTodayDate();
    displayUserInfo();
    updatePendingCount();
    checkAndSyncPending();
    updateOnlineStatus(); // Zet initiële status
    
    // Listen voor online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
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
                const badgeHTML = `<span id="pending-badge" class="pending-badge">${count} preek${count > 1 ? 'en' : ''} wacht op synchronisatie</span>`;
                header.insertAdjacentHTML('afterend', badgeHTML);
            } else {
                badge.textContent = `${count} preek${count > 1 ? 'en' : ''} wacht op synchronisatie`;
            }
        } else if (badge) {
            badge.remove();
        }
    } catch (error) {
        console.error('Error updating pending count:', error);
    }
}

async function checkAndSyncPending() {
    if (!navigator.onLine) return;
    
    try {
        await offlineDB.init();
        const pendingSermons = await offlineDB.getPendingSermons();
        
        if (pendingSermons.length === 0) return;
        
        console.log(`📤 Synchroniseren ${pendingSermons.length} pending sermons...`);
        
        let syncCount = 0;
        
        for (const sermon of pendingSermons) {
            try {
                const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sermon: sermon.sermon,
                        passages: sermon.passages,
                        points: sermon.points
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    await offlineDB.deleteSynced(sermon.id);
                    console.log(`✅ Preek ${sermon.id} gesynchroniseerd`);
                    syncCount++;
                }
            } catch (error) {
                console.error(`❌ Fout bij synchroniseren preek ${sermon.id}:`, error);
                // Stop met sync als we offline zijn gegaan
                if (!navigator.onLine) break;
            }
        }
        
        await updatePendingCount();
        
        // Toon melding als er iets gesynchroniseerd is
        if (syncCount > 0) {
            console.log(`✅ ${syncCount} preek${syncCount > 1 ? 'en' : ''} gesynchroniseerd`);
            showToast(`${syncCount} preek${syncCount > 1 ? 'en' : ''} succesvol gesynchroniseerd`, 'success');
        }
        
        // Refresh sermon list if we're on that tab
        if (navigator.onLine && document.getElementById('view-sermons').classList.contains('active')) {
            loadSermons();
        }
        
    } catch (error) {
        console.error('Error checking pending sermons:', error);
    }
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sermon-date').value = today;
}

// ===== TAB NAVIGATIE =====
function showTab(tabName) {
    // Verberg alle tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Verwijder active van alle buttons
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Toon geselecteerde tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    // Load data voor specifieke tabs
    if (tabName === 'view-sermons') {
        loadSermons();
    } else if (tabName === 'stats') {
        loadStatistics();
    }
}

// ===== BIJBELBOEKEN EN GELEGENHEDEN (Statische Data) =====
function populateBibleBookSelects() {
    const selects = document.querySelectorAll('.bible-book');
    
    selects.forEach(select => {
        select.innerHTML = '<option value="">-- Selecteer boek --</option>';
        
        // Groepeer per testament
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
        if (! select) return;

        const defaultOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (defaultOption) {
            select.appendChild(defaultOption.cloneNode(true));
        }

        OCCASIONS.forEach(occ => {
            const option = document.createElement('option');
            option.value = occ.id;
            option.textContent = occ.name;
            select.appendChild(option);
        });
    });
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
                <input type="url" class="passage-url" placeholder="https://debijbel.nl/...">
            </div>

            <div class="form-group checkbox-group">
                <input type="checkbox" class="is-main">
                <label>Hoofdgedeelte</label>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', passageHTML);
    populateBibleBookSelects(); // Populate nieuwe select
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

// ===== PREEK OPSLAAN =====
async function handleSermonSubmit(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('form-message');
    
    try {
        // Verzamel sermon data
        const sermonData = {
            location: document.getElementById('location').value,
            preacher: document.getElementById('preacher').value,
            sermon_date: document.getElementById('sermon-date').value,
            core_text: document.getElementById('core-text').value,
            occasion_id: document.getElementById('occasion').value || null
        };

        // Verzamel passages
        const passages = [];
        document.querySelectorAll('.passage-entry').forEach((entry) => {
            const bibleBookId = entry.querySelector('.bible-book').value;
            if (! bibleBookId) return; // Skip als geen boek geselecteerd
            
            passages.push({
                bible_book_id: parseInt(bibleBookId),
                chapter_start: parseInt(entry.querySelector('.chapter-start').value),
                verse_start: parseInt(entry.querySelector('.verse-start').value) || null,
                chapter_end: parseInt(entry.querySelector('.chapter-end').value) || null,
                verse_end: parseInt(entry.querySelector('.verse-end').value) || null,
                is_main_passage:  entry.querySelector('.is-main').checked ?  1 : 0,
                passage_url: entry.querySelector('.passage-url').value || null
            });
        });

        // Verzamel points
        const points = [];
        document.querySelectorAll('.point-entry').forEach((entry, index) => {
            const content = entry.querySelector('.point-content').value;
            if (content.trim()) {
                points.push({
                    point_type:  entry.querySelector('.point-type').value,
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

        // Check of we online zijn
        if (!navigator.onLine) {
            // Offline: sla op in IndexedDB
            await offlineDB.init();
            await offlineDB.savePendingSermon(payload);
            
            messageDiv.className = 'message success';
            messageDiv.textContent = '📱 Offline opgeslagen - wordt gesynchroniseerd zodra je online bent';
            messageDiv.style.display = 'block';
            
            updatePendingCount();
            
            setTimeout(() => {
                resetForm();
                messageDiv.style.display = 'none';
            }, 3000);
            
            return;
        }

        // Online: verstuur naar API
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        if (result.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = '✓ Preek succesvol opgeslagen!';
            messageDiv.style.display = 'block';
            
            // Add success animation
            messageDiv.style.animation = 'slideInDown 0.4s ease';
            
            setTimeout(() => {
                messageDiv.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    resetForm();
                    messageDiv.style.display = 'none';
                    messageDiv.style.animation = '';
                }, 300);
            }, 2500);
        }

    } catch (error) {
        // Network error - probeer offline op te slaan
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            try {
                await offlineDB.init();
                const payload = {
                    sermon: {
                        location: document.getElementById('location').value,
                        preacher: document.getElementById('preacher').value,
                        sermon_date: document.getElementById('sermon-date').value,
                        core_text: document.getElementById('core-text').value,
                        occasion_id: document.getElementById('occasion').value || null
                    },
                    passages: Array.from(document.querySelectorAll('.passage-entry')).map(entry => {
                        const bibleBookId = entry.querySelector('.bible-book').value;
                        if (!bibleBookId) return null;
                        return {
                            bible_book_id: parseInt(bibleBookId),
                            chapter_start: parseInt(entry.querySelector('.chapter-start').value),
                            verse_start: parseInt(entry.querySelector('.verse-start').value) || null,
                            chapter_end: parseInt(entry.querySelector('.chapter-end').value) || null,
                            verse_end: parseInt(entry.querySelector('.verse-end').value) || null,
                            is_main_passage: entry.querySelector('.is-main').checked ? 1 : 0,
                            passage_url: entry.querySelector('.passage-url').value || null
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
                
                await offlineDB.savePendingSermon(payload);
                
                messageDiv.className = 'message success';
                messageDiv.textContent = '📱 Verbinding mislukt - offline opgeslagen voor latere synchronisatie';
                messageDiv.style.display = 'block';
                
                updatePendingCount();
                
                setTimeout(() => {
                    resetForm();
                    messageDiv.style.display = 'none';
                }, 3000);
                
                return;
            } catch (dbError) {
                console.error('Failed to save offline:', dbError);
            }
        }
        
        messageDiv.className = 'message error';
        messageDiv.textContent = '✗ Fout bij opslaan:  ' + error.message;
        messageDiv.style.display = 'block';
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
        const occasionName = sermon.occasion_name || 'Regulier';
        
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
            document.getElementById('most-used-book').textContent = stats.bookStats[0].name;
        } else {
            document.getElementById('most-used-book').textContent = '-';
        }

        // Display detailed stats
        if (stats.preacherStats) {
            displayPreachersStatsFromAPI(stats.preacherStats, stats.totalSermons);
        }
        if (stats.occasionStats) {
            displayOccasionsStatsFromAPI(stats.occasionStats, stats.totalSermons);
        }
        if (stats.bookStats) {
            displayBooksStatsFromAPI(stats.bookStats);
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

function displayOccasionsStatsFromAPI(stats, total) {
    const container = document.getElementById('occasions-stats');
    container.innerHTML = '';
    
    if (! stats || stats.length === 0) {
        container.innerHTML = '<p>Nog geen data beschikbaar</p>';
        return;
    }
    
    stats.forEach(stat => {
        const percentage = total > 0 ? (stat.count / total * 100).toFixed(1) : 0;
        container.innerHTML += `
            <div class="stat-bar">
                <span>${stat.name || 'Geen gelegenheid'}</span>
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
        const percentage = (stat.count / maxCount * 100).toFixed(1);
        container.innerHTML += `
            <div class="stat-bar">
                <span>${stat.name}</span>
                <span><strong>${stat.count}</strong> keer gebruikt</span>
            </div>
            <div class="stat-bar-fill" style="width:  ${percentage}%"></div>
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
            <p style="font-style: italic; margin-bottom: 20px;">"${sermon.core_text}"</p>

            <h3>Bijbelgedeelten</h3>
        `;

        passages.forEach(passage => {
            const reference = formatPassageReference(passage, passage.book_name);
            
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