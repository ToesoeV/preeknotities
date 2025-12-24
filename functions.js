// ===== CONFIGURATIE =====
const DB_CONFIG = {
    useMockData: false,  // Zet op false! 
    apiEndpoint: '/api'
};

// Verwijder de hele mockDB sectie en vervang database functies: 

// ===== BIJBELBOEKEN LADEN =====
async function loadBibleBooks() {
    try {
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/bible-books`);
        const books = await response.json();
        populateBibleBookSelects(books);
    } catch (error) {
        console.error('Error loading bible books:', error);
    }
}

// ===== GELEGENHEDEN LADEN =====
async function loadOccasions() {
    try {
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/occasions`);
        const occasions = await response.json();
        populateOccasionSelects(occasions);
    } catch (error) {
        console.error('Error loading occasions:', error);
    }
}

// ===== PREEK OPSLAAN =====
async function handleSermonSubmit(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('form-message');
    
    try {
        const sermonData = {
            location: document.getElementById('location').value,
            preacher: document.getElementById('preacher').value,
            sermon_date: document.getElementById('sermon-date').value,
            core_text: document.getElementById('core-text').value,
            occasion_id: document.getElementById('occasion').value || null
        };

        const passages = [];
        document.querySelectorAll('.passage-entry').forEach((entry) => {
            passages.push({
                bible_book_id: entry.querySelector('.bible-book').value,
                chapter_start: parseInt(entry.querySelector('.chapter-start').value),
                verse_start: parseInt(entry.querySelector('.verse-start').value) || null,
                chapter_end: parseInt(entry.querySelector('.chapter-end').value) || null,
                verse_end: parseInt(entry.querySelector('.verse-end').value) || null,
                is_main_passage:  entry.querySelector('.is-main').checked ?  1 : 0,
                passage_url: entry.querySelector('.passage-url').value || null
            });
        });

        const points = [];
        document.querySelectorAll('.point-entry').forEach((entry, index) => {
            const content = entry.querySelector('.point-content').value;
            if (content. trim()) {
                points.push({
                    point_type: entry.querySelector('.point-type').value,
                    point_order:  index + 1,
                    title: entry.querySelector('.point-title').value || null,
                    content: content
                });
            }
        });

        const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sermon: sermonData, passages, points })
        });

        const result = await response.json();

        if (result.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = '✓ Preek succesvol opgeslagen!';
            
            setTimeout(() => {
                resetForm();
                messageDiv.style.display = 'none';
            }, 2000);
        }

    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv. textContent = '✗ Fout bij opslaan:  ' + error.message;
    }
}

// ===== PREKEN LADEN =====
async function loadSermons() {
    const listDiv = document.getElementById('sermons-list');
    listDiv.innerHTML = '<div class="loading">Preken laden</div>';

    try {
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons`);
        const sermons = await response.json();
        displaySermons(sermons, listDiv);
        
        // Update filters
        const preachers = [... new Set(sermons.map(s => s.preacher))];
        const preacherSelect = document.getElementById('filter-preacher');
        preacherSelect.innerHTML = '<option value="">Alle predikanten</option>';
        preachers.forEach(p => {
            const option = document.createElement('option');
            option.value = p;
            option.textContent = p;
            preacherSelect.appendChild(option);
        });

        const years = [...new Set(sermons.map(s => s. sermon_date. substring(0, 4)))];
        const yearSelect = document.getElementById('filter-year');
        yearSelect.innerHTML = '<option value="">Alle jaren</option>';
        years.sort().reverse().forEach(y => {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            yearSelect.appendChild(option);
        });

    } catch (error) {
        listDiv.innerHTML = `<div class="message error">Fout bij laden:  ${error.message}</div>`;
    }
}

// ===== PREEK DETAILS =====
async function showSermonDetails(sermonId) {
    currentSermonId = sermonId;
    
    try {
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/sermons/${sermonId}`);
        const data = await response.json();
        
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
            detailsHTML += `<p>📖 ${passage.bible_book_id} ${passage.chapter_start}</p>`;
        });

        if (points.length > 0) {
            detailsHTML += '<h3>Preekpunten</h3>';
            points.forEach(point => {
                detailsHTML += `
                    <div style="margin-bottom: 15px;">
                        <strong>${point.title || point.point_type}</strong>
                        <p>${point.content}</p>
                    </div>
                `;
            });
        }

        document.getElementById('sermon-details').innerHTML = detailsHTML;
        document.getElementById('sermon-modal').classList.add('active');

    } catch (error) {
        alert('Fout bij laden preek:  ' + error.message);
    }
}

// ===== DELETE SERMON =====
async function deleteSermon() {
    if (! currentSermonId) return;
    
    if (confirm('Weet je zeker dat je deze preek wilt verwijderen? ')) {
        try {
            await fetch(`${DB_CONFIG.apiEndpoint}/sermons/${currentSermonId}`, {
                method: 'DELETE'
            });
            
            closeModal();
            loadSermons();
            alert('Preek verwijderd!');
        } catch (error) {
            alert('Fout bij verwijderen: ' + error.message);
        }
    }
}

// ===== STATISTIEKEN =====
async function loadStatistics() {
    try {
        const response = await fetch(`${DB_CONFIG.apiEndpoint}/stats`);
        const stats = await response.json();
        
        document.getElementById('total-sermons').textContent = stats.totalSermons;
        document.getElementById('total-preachers').textContent = stats.totalPreachers;
        document.getElementById('sermons-this-year').textContent = stats.sermonsThisYear;
        
        if (stats.bookStats. length > 0) {
            document.getElementById('most-used-book').textContent = stats. bookStats[0].name;
        }

        // Display detailed stats
        displayPreachersStatsFromAPI(stats.preacherStats, stats.totalSermons);
        displayOccasionsStatsFromAPI(stats. occasionStats, stats.totalSermons);
        displayBooksStatsFromAPI(stats. bookStats);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function displayPreachersStatsFromAPI(stats, total) {
    const container = document.getElementById('preachers-stats');
    container.innerHTML = '';
    
    stats.forEach(stat => {
        const percentage = (stat.count / total * 100).toFixed(1);
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
    
    stats. forEach(stat => {
        const percentage = (stat.count / total * 100).toFixed(1);
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
        displaySermons(results, resultsDiv);
    } catch (error) {
        resultsDiv.innerHTML = `<div class="message error">Fout bij zoeken: ${error. message}</div>`;
    }
}