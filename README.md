# 📖 Preeknotities Beheer

Een moderne, offline-first Progressive Web App (PWA) voor het beheren van preeknotities en bijbelgedeelten.

## ✨ Features

### 🎨 UI/UX
- **Light & Dark Mode** - Automatische thema-schakelaar met persistentie
- **Smooth Animations** - Vloeiende overgangen en feedback
- **Responsive Design** - Werkt perfect op desktop, tablet en mobiel
- **Accessible** - WCAG-compliant met toetsenbord shortcuts

### 📱 PWA Capabilities
- **Offline-First** - Werkt volledig offline met lokale opslag
- **Installeerbaar** - Installeer als native app op elk apparaat
- **Background Sync** - Automatische synchronisatie wanneer online
- **Service Worker** - Snelle loading met intelligente caching
- **Local Static Data** - Bijbelboeken en gelegenheden altijd beschikbaar (geen API nodig)

### 🔧 Functionaliteit
- Preken toevoegen met bijbelgedeelten en punten
- Zoeken en filteren door preken
- Statistieken en analyses
- Multi-user support met Cloudflare Access
- IndexedDB voor offline data opslag

## 🚀 Nieuwe Features

### Thema Schakelaar
- Klik op de maan/zon knop rechtsonder
- Of gebruik toetsenbord shortcut: `Ctrl/Cmd + K`
- Thema voorkeur wordt automatisch opgeslagen

### Toast Notificaties
- Visuele feedback voor acties
- Automatisch verdwijnend met voortgangsbalk
- Ondersteuning voor success, error, warning, en info types

### Keyboard Shortcuts
- `Ctrl/Cmd + K` - Wissel thema
- `Ctrl/Cmd + S` - Sla preek op (op toevoegen tab)
- `Escape` - Sluit modal

### Offline Functionaliteit
- Preken worden lokaal opgeslagen als je offline bent
- Automatische synchronisatie wanneer verbinding hersteld is
- Visuele indicator voor online/offline status
- Pending badges tonen aantal niet-gesynchroniseerde preken

### PWA Installatie
- Automatische installatie prompt op ondersteunde apparaten
- App shortcuts voor snelle toegang
- Standalone app ervaring
- Manifest met thema kleuren

## 🛠️ Technologie Stack

- **Frontend**: Vanilla JavaScript (ES6+), CSS3, HTML5
- **Storage**: IndexedDB voor offline data
- **Backend**: Cloudflare Workers + D1 Database
- **Auth**: Cloudflare Access
- **PWA**: Service Workers, Cache API, Background Sync

## 📦 Bestand Structuur

```
/
├── index.html          # Hoofd HTML
├── styles.css          # Styling met CSS variabelen voor theming
├── functions.js        # App logica en UI interacties
├── static-data.js      # Statische bijbel/gelegenheid data (ALTIJD lokaal!)
├── offline-db.js       # IndexedDB wrapper
├── sw.js              # Service Worker voor caching
├── manifest.json      # PWA manifest
└── functions/api/     # Cloudflare Workers API routes
    ├── bible-books.js  # [DEPRECATED - niet gebruikt]
    ├── occasions.js    # [DEPRECATED - niet gebruikt]
    ├── user-info.js
    ├── stats.js
    └── sermons/
        ├── index.js
        └── [id].js
```

## 🎯 Gebruik

1. **Nieuwe Preek Toevoegen**
   - Vul basis informatie in
   - Voeg bijbelgedeelten toe (hoofdgedeelte + extra)
   - Voeg preekpunten toe (inleiding, punten, toepassing)
   - Sla op (werkt ook offline!)

2. **Preken Bekijken**
   - Filter op predikant, gelegenheid, of jaar
   - Klik op een preek voor details
   - Verwijder preken indien nodig

3. **Zoeken**
   - Zoek op trefwoorden, predikant, of bijbelboek
   - Real-time resultaten

4. **Statistieken**
   - Overzicht van totaal aantal preken
   - Meest gebruikte bijbelboeken
   - Preken per predikant en gelegenheid

## 🔒 Security

- Cloudflare Access authenticatie
- User-scoped data (users zien alleen eigen preken)
- HTTPS only
- CSP headers via Cloudflare

## 🚀 Performance

- Service Worker caching voor instant loading
- Skeleton loaders voor betere UX
- Optimistische UI updates
- Minimal JavaScript bundle
- CSS custom properties voor theming zonder JS

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Alle moderne mobiele browsers

## 🎨 Customization

Pas kleuren aan via CSS variabelen in `styles.css`:

```css
:root {
    --primary-color: #2563eb;
    --success-color: #10b981;
    /* etc */
}

[data-theme="dark"] {
    --primary-color: #3b82f6;
    /* etc */
}
```

## 📄 License

Private project - All rights reserved

## 🤝 Contributing

Dit is een persoonlijk project, maar suggesties zijn welkom via issues.

---

**Made with ❤️ for better sermon note management**