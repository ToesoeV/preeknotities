// ===== CONFIGURATIE =====
const DB_CONFIG = {
    // Voor lokale test gebruik je mock data
    // Voor productie vervang je dit met je echte D1 database endpoint
    useMockData: true,
    apiEndpoint: '/api/sermons' // Pas dit aan naar je Cloudflare Worker endpoint
};

// Mock database (tijdelijk voor testen zonder echte database)
let mockDB = {
    sermons: [],
    passages: [],
    points: [],
    bibleBooks: [],
    occasions: []
};

let currentSermonId = null;
let pointCounter = 0;
let passageCounter = 1;

// ===== INITIALISATIE =====
document.addEventListener('DOMContentLoaded', function() {
    initializeMockData();
    loadBibleBooks();
    loadOccasions();
    setupEventListeners();
    setTodayDate();
});

function initializeMockData() {
    if (! DB_CONFIG.useMockData) return;

    // Mock bijbelboeken (eerste 10 als voorbeeld)
    mockDB.bibleBooks = [
        { id: 1, name: 'Genesis', testament: 'OT', book_order: 1, total_chapters: 50 },
        { id: 40, name: 'Mattheüs', testament: 'NT', book_order: 40, total_chapters: 28 },
        { id: 41, name: 'Marcus', testament: 'NT', book_order: 41, total_chapters: 16 },
        { id: 42, name: 'Lucas', testament: 'NT', book_order: 42, total_chapters: 24 },
        { id: 43, name: 'Johannes', testament: 'NT', book_order: 43, total_chapters: 21 },
        { id: 45, name: 'Romeinen', testament: 'NT', book_order: 45, total_chapters: 16 },
        { id: 19, name: 'Psalmen', testament: 'OT', book_order: 19, total_chapters: 150 },
        { id: 23, name: 'Jesaja', testament: 'OT', book_order: 23, total_chapters: 66 }
    ];

    // Mock gelegenheden
    mockDB.occasions = [
        { id: 1, name: 'Advent', description: '1e t/m 4e zondag van de Advent' },
        { id: 2, name: 'Kerst', description: 'Kerstdiensten' },
        { id: 3, name: 'Pasen', description: 'Eerste en Tweede Paasdag' },
        { id: 4, name: 'Pinksteren', description: 'Eerste en Tweede Pinksterdag' },
        { id: 5, name: 'Regulier', description: 'Gewone zondagse dienst' }
    ];
}

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
    const tabs = document. querySelectorAll('.tab-content');
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
    let books = [];
    
    if (DB_CONFIG.useMockData) {
        books = mockDB.bibleBooks;
    } else {
        // Hier zou je je D1 database aanroepen
        // books = await fetchFromD1('SELECT * FROM bible_books ORDER BY book_order');
    }

    populateBibleBookSelects(books);
}

function populateBibleBookSelects(books) {
    const selects = document.querySelectorAll('.bible-book');
    
    selects.forEach(select => {
        select.innerHTML = '<option value="">-- Selecteer boek --</option>';
        
        // Groepeer per testament
        const otBooks = books.filter(b => b.testament === 'OT');
        const ntBooks = books.filter(b => b. testament === 'NT');

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
            ntBooks. forEach(book => {
                const option = document.createElement('option');
                option.value = book. id;
                option.textContent = book.name;
                option.dataset.chapters = book.total_chapters;
                ntGroup. appendChild(option);
            });
            select.appendChild(ntGroup);
        }
    });
}

// ===== GELEGENHEDEN LADEN =====
async function loadOccasions() {
    let occasions = [];
    
    if (DB_CONFIG.useMockData) {
        occasions = mockDB.occasions;
    } else {
        // occasions = await fetchFromD1('SELECT * FROM occasions ORDER BY name');
    }

    populateOccasionSelects(occasions);
}

function populateOccasionSelects(occasions) {
    const selects = ['occasion', 'filter-occasion'];
    
    selects. forEach(selectId => {
        const select = document.getElementById(selectId);
        if (! select) return;

        const defaultOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (defaultOption) {
            select.appendChild(defaultOption. cloneNode(true));
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
                <input type="url" class="passage-url" placeholder="https://debijbel.nl/... ">
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
                <input type="text" class="point-title" placeholder="bijv. Gods liefde voor de wereld">
            </div>

            <div class="form-group">
                <label>Inhoud</label>
                <textarea class="point-content" rows="4" placeholder="Notities... "></textarea>
            </div>

            <input type="hidden" class="point-type" value="${type}">
            <input type="hidden" class="point-order" value="${pointCounter}">
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', pointHTML);
}

function removePoint(pointId) {
    const point = document. querySelector(`[data-point-id="${pointId}"]`);
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
        document.querySelectorAll('.passage-entry').forEach((entry, index) => {
            passages.push({
                bible_book_id: entry.querySelector('.bible-book').value,
                chapter_start: parseInt(entry.querySelector('.chapter-start').value),
                verse_start: parseInt(entry.querySelector('.verse-start').value) || null,
                chapter_end: parseInt(entry.querySelector('.chapter-end').value) || null,
                verse_end: parseInt(entry.querySelector('.verse-end').value) || null,
                is_main_passage: entry.querySelector('.is-main').checked ? 1 : 0,
                passage_url: entry.querySelector('.passage-url').value || null
            });
        });

        // Verzamel points
        const points = [];
        document.querySelectorAll('.point-entry').forEach((entry, index) => {
            const content = entry.querySelector('.point-content').value;
            if (content. trim()) {
                points.push({
                    point_type: entry.querySelector('.point-type').value,
                    point_order: index + 1,
                    title: entry.querySelector('.point-title').value || null,
                    content: content
                });
            }
        });

        // Opslaan in database
        if (DB_CONFIG.useMockData) {
            await saveMockSermon(sermonData, passages, points);
        } else {
            // await saveToD1(sermonData, passages, points);
        }

        // Toon success message
        messageDiv. className = 'message success';
        messageDiv.textContent = '✓ Preek succesvol opgeslagen!';
        
        // Reset form na 2 seconden
        setTimeout(() => {
            resetForm();
            messageDiv.style.display = 'none';
        }, 2000);

    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv. textContent = '✗ Fout bij opslaan: ' + error. message;
    }
}

async function saveMockSermon(sermonData, passages, points) {
    // Simuleer database save
    const sermonId = mockDB.sermons.length + 1;
    
    mockDB.sermons.push({
        id: sermonId,
        ... sermonData,
        created_at: new Date().toISOString()
    });

    passages.forEach(passage => {
        mockDB.passages.push({
            id: mockDB.passages.length + 1,
            sermon_id: sermonId,
            ...passage
        });
    });

    points.forEach(point => {
        mockDB.points.push({
            id: mockDB.points. length + 1,
            sermon_id: sermonId,
            ...point
        });
    });

    console.log('Mock sermon saved:', { sermonId, sermonData, passages, points });
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

    let sermons = [];
    
    if (DB_CONFIG.useMockData) {
        sermons = mockDB.sermons;
    } else {
        // sermons = await fetchFromD1('SELECT * FROM sermons ORDER BY sermon_date DESC');
    }

    // Apply filters
    const filterPreacher = document.getElementById('filter-preacher').value;
    const filterOccasion = document.getElementById('filter-occasion').value;
    const filterYear = document.getElementById('filter-year').value;

    if (filterPreacher) {
        sermons = sermons.filter(s => s.preacher === filterPreacher);
    }
    if (filterOccasion) {
        sermons = sermons.filter(s => s. occasion_id == filterOccasion);
    }
    if (filterYear) {
        sermons = sermons.filter(s => s.sermon_date.startsWith(filterYear));
    }

    displaySermons(sermons, listDiv);
    populateFilterOptions(mockDB.sermons);
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
        const occasion = mockDB.occasions.find(o => o.id == sermon.occasion_id);
        const occasionName = occasion ? occasion.name : 'Regulier';
        
        const card = document.createElement('div');
        card.className = 'sermon-card';
        card.onclick = () => showSermonDetails(sermon. id);
        
        card.innerHTML = `
            <h3>${sermon.location}</h3>
            <div class="sermon-meta">
                <span>👤 ${sermon.preacher}</span>
                <span>📅 ${formatDate(sermon.sermon_date)}</span>
                <span>🎯 ${occasionName}</span>
            </div>
            <div class="sermon-preview">"${sermon.core_text. substring(0, 100)}..."</div>
        `;
        
        container.appendChild(card);
    });
}

function populateFilterOptions(sermons) {
    // Unique preachers
    const preachers = [... new Set(sermons.map(s => s.preacher))];
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
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const resultsDiv = document.getElementById('search-results');
    
    if (!searchTerm) {
        resultsDiv.innerHTML = '<div class="empty-state"><p>Voer een zoekterm in</p></div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="loading">Zoeken</div>';

    let allSermons = mockDB.sermons;
    
    const results = allSermons.filter(sermon => {
        return sermon.location.toLowerCase().includes(searchTerm) ||
               sermon.preacher.toLowerCase().includes(searchTerm) ||
               sermon.core_text.toLowerCase().includes(searchTerm);
    });

    displaySermons(results, resultsDiv);
}

// ===== STATISTIEKEN =====
async function loadStatistics() {
    const sermons = mockDB.sermons;
    
    // Total sermons
    document.getElementById('total-sermons').textContent = sermons.length;

    // Total preachers
    const uniquePreachers = [...new Set(sermons.map(s => s.preacher))];
    document.getElementById('total-preachers').textContent = uniquePreachers.length;

    // Most used book
    const bookCounts = {};
    mockDB.passages.forEach(p => {
        bookCounts[p.bible_book_id] = (bookCounts[p. bible_book_id] || 0) + 1;
    });
    const mostUsedBookId = Object.keys(bookCounts).reduce((a, b) => 
        bookCounts[a] > bookCounts[b] ? a : b, 0);
    const mostUsedBook = mockDB. bibleBooks.find(b => b.id == mostUsedBookId);
    document.getElementById('most-used-book').textContent = 
        mostUsedBook ? mostUsedBook.name : '-';

    // This year
    const thisYear = new Date().getFullYear().toString();
    const thisYearSermons = sermons. filter(s => s.sermon_date.startsWith(thisYear));
    document.getElementById('sermons-this-year').textContent = thisYearSermons.length;

    // Preachers stats
    displayPreachersStats(sermons, uniquePreachers);
    
    // Occasions stats
    displayOccasionsStats(sermons);
    
    // Books stats
    displayBooksStats(bookCounts);
}

function displayPreachersStats(sermons, preachers) {
    const container = document.getElementById('preachers-stats');
    container.innerHTML = '';
    
    preachers.forEach(preacher => {
        const count = sermons.filter(s => s.preacher === preacher).length;
        const percentage = (count / sermons.length * 100).toFixed(1);
        
        container.innerHTML += `
            <div class="stat-bar">
                <span>${preacher}</span>
                <span><strong>${count}</strong> preken</span>
            </div>
            <div class="stat-bar-fill" style="width: ${percentage}%"></div>
        `;
    });
}

function displayOccasionsStats(sermons) {
    const container = document. getElementById('occasions-stats');
    container.innerHTML = '';
    
    const occCounts = {};
    sermons. forEach(s => {
        const occId = s.occasion_id || 'none';
        occCounts[occId] = (occCounts[occId] || 0) + 1;
    });
    
    Object.entries(occCounts).forEach(([occId, count]) => {
        const occasion = mockDB.occasions.find(o => o.id == occId);
        const name = occasion ? occasion.name : 'Geen gelegenheid';
        const percentage = (count / sermons. length * 100).toFixed(1);
        
        container. innerHTML += `
            <div class="stat-bar">
                <span>${name}</span>
                <span><strong>${count}</strong> preken</span>
            </div>
            <div class="stat-bar-fill" style="width: ${percentage}%"></div>
        `;
    });
}

function displayBooksStats(bookCounts) {
    const container = document.getElementById('books-stats');
    container.innerHTML = '';
    
    const sorted = Object.entries(bookCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const maxCount = sorted[0] ?  sorted[0][1] : 1;
    
    sorted.forEach(([bookId, count]) => {
        const book = mockDB.bibleBooks.find(b => b. id == bookId);
        const name = book ? book.name : 'Onbekend';
        const percentage = (count / maxCount * 100).toFixed(1);
        
        container.innerHTML += `
            <div class="stat-bar">
                <span>${name}</span>
                <span><strong>${count}</strong> keer gebruikt</span>
            </div>
            <div class="stat-bar-fill" style="width:  ${percentage}%"></div>
        `;
    });
}

// ===== MODAL =====
function showSermonDetails(sermonId) {
    currentSermonId = sermonId;
    const sermon = mockDB.sermons.find(s => s.id === sermonId);
    if (!sermon) return;

    const passages = mockDB.passages.filter(p => p.sermon_id === sermonId);
    const points = mockDB.points.filter(p => p.sermon_id === sermonId);
    
    const occasion = mockDB.occasions.find(o => o.id == sermon.occasion_id);
    const occasionName = occasion ? occasion.name : 'Regulier';

    let detailsHTML = `
        <h2>${sermon.location}</h2>
        <div class="sermon-meta" style="margin-bottom: 20px;">
            <span>👤 ${sermon.preacher}</span>
            <span>📅 ${formatDate(sermon. sermon_date)}</span>
            <span>🎯 ${occasionName}</span>
        </div>

        <h3>Kerntekst</h3>
        <p style="font-style: italic; margin-bottom: 20px;">"${sermon.core_text}"</p>

        <h3>Bijbelgedeelten</h3>
    `;

    passages.forEach(passage => {
        const book = mockDB.bibleBooks. find(b => b.id == passage.bible_book_id);
        const bookName = book ? book.name : 'Onbekend';
        const reference = formatPassageReference(passage, bookName);
        
        detailsHTML += `
            <p>
                ${passage.is_main_passage ? '📌' : '📖'} 
                <strong>${reference}</strong>
                ${passage.passage_url ? `<a href="${passage.passage_url}" target="_blank">→ Open</a>` : ''}
            </p>
        `;
    });

    if (points.length > 0) {
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
}

function closeModal() {
    document.getElementById('sermon-modal').classList.remove('active');
    currentSermonId = null;
}

function deleteSermon() {
    if (! currentSermonId) return;
    
    if (confirm('Weet je zeker dat je deze preek wilt verwijderen?')) {
        // Verwijder uit mock database
        mockDB.sermons = mockDB.sermons.filter(s => s.id !== currentSermonId);
        mockDB.passages = mockDB.passages.filter(p => p.sermon_id !== currentSermonId);
        mockDB.points = mockDB. points.filter(p => p. sermon_id !== currentSermonId);
        
        closeModal();
        loadSermons();
        
        alert('Preek verwijderd!');
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
        } else if (passage.verse_end && passage.verse_end !== passage. verse_start) {
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