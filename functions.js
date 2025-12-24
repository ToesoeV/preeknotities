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
    loadBibleBooks();
    loadOccasions();
    setupEventListeners();
    setTodayDate();
});

function setupEventListeners() {
    document.getElementById('sermon-form').addEventListener('submit', handleSermonSubmit);
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

// ===== BIJBELBOEKEN LADEN =====
async function loadBibleBooks() {
    try {
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/bible-books`);
        const books = await response.json();
        
        if (books.error) {
            console.error('Error loading bible books:', books.error);
            return;
        }
        
        populateBibleBookSelects(books);
    } catch (error) {
        console.error('Error loading bible books:', error);
    }
}

function populateBibleBookSelects(books) {
    const selects = document.querySelectorAll('.bible-book');
    
    selects.forEach(select => {
        select.innerHTML = '<option value="">-- Selecteer boek --</option>';
        
        // Groepeer per testament
        const otBooks = books.filter(b => b.testament === 'OT');
        const ntBooks = books.filter(b => b.testament === 'NT');

        if (otBooks.length > 0) {
            const otGroup = document.createElement('optgroup');
            otGroup.label = 'Oud Testament';
            otBooks.forEach(book => {
                const option = document.createElement('option');
                option.value = book.id;
                option.textContent = book.name;
                option.dataset.chapters = book.total_chapters;
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
                option.dataset.chapters = book.total_chapters;
                ntGroup.appendChild(option);
            });
            select.appendChild(ntGroup);
        }
    });
}

// ===== GELEGENHEDEN LADEN =====
async function loadOccasions() {
    try {
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/occasions`);
        const occasions = await response.json();
        
        if (occasions.error) {
            console.error('Error loading occasions:', occasions.error);
            return;
        }
        
        populateOccasionSelects(occasions);
    } catch (error) {
        console.error('Error loading occasions:', error);
    }
}

function populateOccasionSelects(occasions) {
    const selects = ['occasion', 'filter-occasion'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (! select) return;

        const defaultOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (defaultOption) {
            select.appendChild(defaultOption.cloneNode(true));
        }

        occasions.forEach(occ => {
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
    loadBibleBooks(); // Reload voor nieuwe select
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

        // Verstuur naar API
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sermon: sermonData,
                passages: passages,
                points: points
            })
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        if (result.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = '✓ Preek succesvol opgeslagen!';
            messageDiv.style.display = 'block';
            
            setTimeout(() => {
                resetForm();
                messageDiv.style.display = 'none';
            }, 2000);
        }

    } catch (error) {
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
    listDiv.innerHTML = '<div class="loading">Preken laden</div>';

    try {
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons`);
        const sermons = await response.json();
        
        if (sermons.error) {
            throw new Error(sermons.error);
        }

        displaySermons(sermons, listDiv);
        populateFilterOptions(sermons);
    } catch (error) {
        listDiv.innerHTML = `<div class="message error">Fout bij laden:  ${error.message}</div>`;
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

    resultsDiv.innerHTML = '<div class="loading">Zoeken</div>';

    try {
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons? search=${encodeURIComponent(searchTerm)}`);
        const results = await response.json();
        
        if (results.error) {
            throw new Error(results.error);
        }
        
        displaySermons(results, resultsDiv);
    } catch (error) {
        resultsDiv.innerHTML = `<div class="message error">Fout bij zoeken: ${error.message}</div>`;
    }
}

// ===== STATISTIEKEN =====
async function loadStatistics() {
    try {
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

// Close modal bij klikken buiten de modal
window.onclick = function(event) {
    const modal = document.getElementById('sermon-modal');
    if (event.target === modal) {
        closeModal();
    }
}