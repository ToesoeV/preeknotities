// ===== STATISCHE DATA VOOR BIJBELBOEKEN EN GELEGENHEDEN =====
// Version: 2.0.0 - Authoritative Source (geen API calls!)
// Laatste update: 2025-12-23
// Deze data is ALTIJD lokaal beschikbaar en werkt volledig offline
// Geen API calls nodig - dit is de authoritative source
// Gebruikt door: functions.js voor dropdown menu's

const BIBLE_BOOKS = [
    // Oude Testament
    { id: 1, name: 'Genesis', testament: 'OT', book_order: 1, abbr: 'gen' },
    { id: 2, name: 'Exodus', testament: 'OT', book_order: 2, abbr: 'exo' },
    { id: 3, name: 'Leviticus', testament: 'OT', book_order: 3, abbr: 'lev' },
    { id: 4, name: 'Numeri', testament: 'OT', book_order: 4, abbr: 'num' },
    { id: 5, name: 'Deuteronomium', testament: 'OT', book_order: 5, abbr: 'deu' },
    { id: 6, name: 'Jozua', testament: 'OT', book_order: 6, abbr: 'jos' },
    { id: 7, name: 'Richteren', testament: 'OT', book_order: 7, abbr: 'jdg' },
    { id: 8, name: 'Ruth', testament: 'OT', book_order: 8, abbr: 'rut' },
    { id: 9, name: '1 Samuël', testament: 'OT', book_order: 9, abbr: '1sa' },
    { id: 10, name: '2 Samuël', testament: 'OT', book_order: 10, abbr: '2sa' },
    { id: 11, name: '1 Koningen', testament: 'OT', book_order: 11, abbr: '1ki' },
    { id: 12, name: '2 Koningen', testament: 'OT', book_order: 12, abbr: '2ki' },
    { id: 13, name: '1 Kronieken', testament: 'OT', book_order: 13, abbr: '1ch' },
    { id: 14, name: '2 Kronieken', testament: 'OT', book_order: 14, abbr: '2ch' },
    { id: 15, name: 'Ezra', testament: 'OT', book_order: 15, abbr: 'ezr' },
    { id: 16, name: 'Nehemia', testament: 'OT', book_order: 16, abbr: 'neh' },
    { id: 17, name: 'Esther', testament: 'OT', book_order: 17, abbr: 'est' },
    { id: 18, name: 'Job', testament: 'OT', book_order: 18, abbr: 'job' },
    { id: 19, name: 'Psalmen', testament: 'OT', book_order: 19, abbr: 'psa' },
    { id: 20, name: 'Spreuken', testament: 'OT', book_order: 20, abbr: 'pro' },
    { id: 21, name: 'Prediker', testament: 'OT', book_order: 21, abbr: 'ecc' },
    { id: 22, name: 'Hooglied', testament: 'OT', book_order: 22, abbr: 'sng' },
    { id: 23, name: 'Jesaja', testament: 'OT', book_order: 23, abbr: 'isa' },
    { id: 24, name: 'Jeremia', testament: 'OT', book_order: 24, abbr: 'jer' },
    { id: 25, name: 'Klaagliederen', testament: 'OT', book_order: 25, abbr: 'lam' },
    { id: 26, name: 'Ezechiël', testament: 'OT', book_order: 26, abbr: 'ezk' },
    { id: 27, name: 'Daniël', testament: 'OT', book_order: 27, abbr: 'dan' },
    { id: 28, name: 'Hosea', testament: 'OT', book_order: 28, abbr: 'hos' },
    { id: 29, name: 'Joël', testament: 'OT', book_order: 29, abbr: 'jol' },
    { id: 30, name: 'Amos', testament: 'OT', book_order: 30, abbr: 'amo' },
    { id: 31, name: 'Obadja', testament: 'OT', book_order: 31, abbr: 'oba' },
    { id: 32, name: 'Jona', testament: 'OT', book_order: 32, abbr: 'jon' },
    { id: 33, name: 'Micha', testament: 'OT', book_order: 33, abbr: 'mic' },
    { id: 34, name: 'Nahum', testament: 'OT', book_order: 34, abbr: 'nam' },
    { id: 35, name: 'Habakuk', testament: 'OT', book_order: 35, abbr: 'hab' },
    { id: 36, name: 'Zefanja', testament: 'OT', book_order: 36, abbr: 'zep' },
    { id: 37, name: 'Haggai', testament: 'OT', book_order: 37, abbr: 'hag' },
    { id: 38, name: 'Zacharia', testament: 'OT', book_order: 38, abbr: 'zec' },
    { id: 39, name: 'Maleachi', testament: 'OT', book_order: 39, abbr: 'mal' },
    
    // Nieuwe Testament
    { id: 40, name: 'Mattheüs', testament: 'NT', book_order: 40, abbr: 'mat' },
    { id: 41, name: 'Marcus', testament: 'NT', book_order: 41, abbr: 'mrk' },
    { id: 42, name: 'Lucas', testament: 'NT', book_order: 42, abbr: 'luk' },
    { id: 43, name: 'Johannes', testament: 'NT', book_order: 43, abbr: 'jhn' },
    { id: 44, name: 'Handelingen', testament: 'NT', book_order: 44, abbr: 'act' },
    { id: 45, name: 'Romeinen', testament: 'NT', book_order: 45, abbr: 'rom' },
    { id: 46, name: '1 Korinthe', testament: 'NT', book_order: 46, abbr: '1co' },
    { id: 47, name: '2 Korinthe', testament: 'NT', book_order: 47, abbr: '2co' },
    { id: 48, name: 'Galaten', testament: 'NT', book_order: 48, abbr: 'gal' },
    { id: 49, name: 'Efeze', testament: 'NT', book_order: 49, abbr: 'eph' },
    { id: 50, name: 'Filippenzen', testament: 'NT', book_order: 50, abbr: 'php' },
    { id: 51, name: 'Kolossenzen', testament: 'NT', book_order: 51, abbr: 'col' },
    { id: 52, name: '1 Thessalonicenzen', testament: 'NT', book_order: 52, abbr: '1th' },
    { id: 53, name: '2 Thessalonicenzen', testament: 'NT', book_order: 53, abbr: '2th' },
    { id: 54, name: '1 Timotheüs', testament: 'NT', book_order: 54, abbr: '1ti' },
    { id: 55, name: '2 Timotheüs', testament: 'NT', book_order: 55, abbr: '2ti' },
    { id: 56, name: 'Titus', testament: 'NT', book_order: 56, abbr: 'tit' },
    { id: 57, name: 'Filemon', testament: 'NT', book_order: 57, abbr: 'phm' },
    { id: 58, name: 'Hebreeën', testament: 'NT', book_order: 58, abbr: 'heb' },
    { id: 59, name: 'Jakobus', testament: 'NT', book_order: 59, abbr: 'jas' },
    { id: 60, name: '1 Petrus', testament: 'NT', book_order: 60, abbr: '1pe' },
    { id: 61, name: '2 Petrus', testament: 'NT', book_order: 61, abbr: '2pe' },
    { id: 62, name: '1 Johannes', testament: 'NT', book_order: 62, abbr: '1jn' },
    { id: 63, name: '2 Johannes', testament: 'NT', book_order: 63, abbr: '2jn' },
    { id: 64, name: '3 Johannes', testament: 'NT', book_order: 64, abbr: '3jn' },
    { id: 65, name: 'Judas', testament: 'NT', book_order: 65, abbr: 'jud' },
    { id: 66, name: 'Openbaring', testament: 'NT', book_order: 66, abbr: 'rev' }
];

// ===== BELANGRIJK =====
// Deze array wordt DIRECT gebruikt door de app - geen API calls!
// Bible books: 66 boeken (39 OT + 27 NT)
// IDs moeten overeenkomen met database voor synchronisatie

// ===== HELPER FUNCTIES =====
// Genereer Bible.com URL voor een bijbelgedeelte
// Formaat: https://bible.com/bible/1990/{abbr}.{chapter}.{verse}.HSV
function generateBibleUrl(bookId, chapterStart, verseStart) {
    const book = BIBLE_BOOKS.find(b => b.id === parseInt(bookId));
    if (!book || !chapterStart) return '';
    
    let url = `https://bible.com/bible/1990/${book.abbr}.${chapterStart}`;
    
    // Voeg vers toe als opgegeven
    if (verseStart) {
        url += `.${verseStart}`;
    }
    
    url += '.HSV';
    return url;
}

// Maak functie beschikbaar
window.generateBibleUrl = generateBibleUrl;
