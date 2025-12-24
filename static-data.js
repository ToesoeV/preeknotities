// ===== STATISCHE DATA VOOR BIJBELBOEKEN EN GELEGENHEDEN =====
// Version: 2.0.0 - Authoritative Source (geen API calls!)
// Laatste update: 2025-12-23
// Deze data is ALTIJD lokaal beschikbaar en werkt volledig offline
// Geen API calls nodig - dit is de authoritative source
// Gebruikt door: functions.js voor dropdown menu's

const BIBLE_BOOKS = [
    // Oude Testament
    { id: 1, name: 'Genesis', testament: 'OT', book_order: 1 },
    { id: 2, name: 'Exodus', testament: 'OT', book_order: 2 },
    { id: 3, name: 'Leviticus', testament: 'OT', book_order: 3 },
    { id: 4, name: 'Numeri', testament: 'OT', book_order: 4 },
    { id: 5, name: 'Deuteronomium', testament: 'OT', book_order: 5 },
    { id: 6, name: 'Jozua', testament: 'OT', book_order: 6 },
    { id: 7, name: 'Richteren', testament: 'OT', book_order: 7 },
    { id: 8, name: 'Ruth', testament: 'OT', book_order: 8 },
    { id: 9, name: '1 Samuël', testament: 'OT', book_order: 9 },
    { id: 10, name: '2 Samuël', testament: 'OT', book_order: 10 },
    { id: 11, name: '1 Koningen', testament: 'OT', book_order: 11 },
    { id: 12, name: '2 Koningen', testament: 'OT', book_order: 12 },
    { id: 13, name: '1 Kronieken', testament: 'OT', book_order: 13 },
    { id: 14, name: '2 Kronieken', testament: 'OT', book_order: 14 },
    { id: 15, name: 'Ezra', testament: 'OT', book_order: 15 },
    { id: 16, name: 'Nehemia', testament: 'OT', book_order: 16 },
    { id: 17, name: 'Esther', testament: 'OT', book_order: 17 },
    { id: 18, name: 'Job', testament: 'OT', book_order: 18 },
    { id: 19, name: 'Psalmen', testament: 'OT', book_order: 19 },
    { id: 20, name: 'Spreuken', testament: 'OT', book_order: 20 },
    { id: 21, name: 'Prediker', testament: 'OT', book_order: 21 },
    { id: 22, name: 'Hooglied', testament: 'OT', book_order: 22 },
    { id: 23, name: 'Jesaja', testament: 'OT', book_order: 23 },
    { id: 24, name: 'Jeremia', testament: 'OT', book_order: 24 },
    { id: 25, name: 'Klaagliederen', testament: 'OT', book_order: 25 },
    { id: 26, name: 'Ezechiël', testament: 'OT', book_order: 26 },
    { id: 27, name: 'Daniël', testament: 'OT', book_order: 27 },
    { id: 28, name: 'Hosea', testament: 'OT', book_order: 28 },
    { id: 29, name: 'Joël', testament: 'OT', book_order: 29 },
    { id: 30, name: 'Amos', testament: 'OT', book_order: 30 },
    { id: 31, name: 'Obadja', testament: 'OT', book_order: 31 },
    { id: 32, name: 'Jona', testament: 'OT', book_order: 32 },
    { id: 33, name: 'Micha', testament: 'OT', book_order: 33 },
    { id: 34, name: 'Nahum', testament: 'OT', book_order: 34 },
    { id: 35, name: 'Habakuk', testament: 'OT', book_order: 35 },
    { id: 36, name: 'Zefanja', testament: 'OT', book_order: 36 },
    { id: 37, name: 'Haggai', testament: 'OT', book_order: 37 },
    { id: 38, name: 'Zacharia', testament: 'OT', book_order: 38 },
    { id: 39, name: 'Maleachi', testament: 'OT', book_order: 39 },
    
    // Nieuwe Testament
    { id: 40, name: 'Mattheüs', testament: 'NT', book_order: 40 },
    { id: 41, name: 'Marcus', testament: 'NT', book_order: 41 },
    { id: 42, name: 'Lucas', testament: 'NT', book_order: 42 },
    { id: 43, name: 'Johannes', testament: 'NT', book_order: 43 },
    { id: 44, name: 'Handelingen', testament: 'NT', book_order: 44 },
    { id: 45, name: 'Romeinen', testament: 'NT', book_order: 45 },
    { id: 46, name: '1 Korinthe', testament: 'NT', book_order: 46 },
    { id: 47, name: '2 Korinthe', testament: 'NT', book_order: 47 },
    { id: 48, name: 'Galaten', testament: 'NT', book_order: 48 },
    { id: 49, name: 'Efeze', testament: 'NT', book_order: 49 },
    { id: 50, name: 'Filippenzen', testament: 'NT', book_order: 50 },
    { id: 51, name: 'Kolossenzen', testament: 'NT', book_order: 51 },
    { id: 52, name: '1 Thessalonicenzen', testament: 'NT', book_order: 52 },
    { id: 53, name: '2 Thessalonicenzen', testament: 'NT', book_order: 53 },
    { id: 54, name: '1 Timotheüs', testament: 'NT', book_order: 54 },
    { id: 55, name: '2 Timotheüs', testament: 'NT', book_order: 55 },
    { id: 56, name: 'Titus', testament: 'NT', book_order: 56 },
    { id: 57, name: 'Filemon', testament: 'NT', book_order: 57 },
    { id: 58, name: 'Hebreeën', testament: 'NT', book_order: 58 },
    { id: 59, name: 'Jakobus', testament: 'NT', book_order: 59 },
    { id: 60, name: '1 Petrus', testament: 'NT', book_order: 60 },
    { id: 61, name: '2 Petrus', testament: 'NT', book_order: 61 },
    { id: 62, name: '1 Johannes', testament: 'NT', book_order: 62 },
    { id: 63, name: '2 Johannes', testament: 'NT', book_order: 63 },
    { id: 64, name: '3 Johannes', testament: 'NT', book_order: 64 },
    { id: 65, name: 'Judas', testament: 'NT', book_order: 65 },
    { id: 66, name: 'Openbaring', testament: 'NT', book_order: 66 }
];

const OCCASIONS = [
    { id: 1, name: 'Avondmaal' },
    { id: 2, name: 'Doop' },
    { id: 3, name: 'Belijdenis' },
    { id: 4, name: 'Trouwdienst' },
    { id: 5, name: 'Rouwdienst' },
    { id: 6, name: 'Kerst' },
    { id: 7, name: 'Pasen' },
    { id: 8, name: 'Pinksteren' },
    { id: 9, name: 'Hemelvaart' },
    { id: 10, name: 'Nieuwjaar' },
    { id: 11, name: 'Goede Vrijdag' },
    { id: 12, name: 'Biddag' },
    { id: 13, name: 'Dankdag' },
    { id: 14, name: 'Eeuwigheidszondag' },
    { id: 15, name: 'Advent' }
];

// ===== BELANGRIJK =====
// Deze arrays worden DIRECT gebruikt door de app - geen API calls!
// Bible books: 66 boeken (39 OT + 27 NT)
// Occasions: 15 standaard kerkelijke gelegenheden
// IDs moeten overeenkomen met database voor synchronisatie
