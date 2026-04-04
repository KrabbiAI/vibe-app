# 🎵 VIBE — Musik ohne Noten

Mood-based music creation. Keine Akkorde, kein BPM — nur Farben und Gefühl.

**Live:** https://candid-begonia-1e5b20.netlify.app

## ✨ Features

- 🎛 **6 Moods** — Warm, Electric, Dreamy, Dark, Forest, Fire (jedes mit eigenem Farbschema)
- 🥁 **6 Sound-Pads** — KICK, SNARE, BASS, CHORD, LEAD, FX (toggle an/aus)
- 🎚 **Energie-Slider** — 😴 Chill (60 BPM) bis 🤯 Banger (160 BPM)
- ▶️ **PLAY/STOP** — 8-Step Beat-Visualizer
- 🎲 **REMIX** — alles zufällig neu mischen
- Ripple-Effekte, Ambient Glow, Puls-Animationen

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 19 + Vite (TypeScript) |
| Audio | Tone.js (noch nicht aktiv — MVP visuell) |
| Animation | Framer Motion |
| State | Zustand |
| Styling | Inline Styles (CSS Custom Properties) |
| Tests | Vitest + Testing Library |
| Hosting | Netlify (auto-deploy on push) |

## 🚀 Setup

```bash
# Clone
git clone https://github.com/KrabbiAI/vibe-app.git
cd vibe-app

# Install dependencies
npm install

# Install additional deps (Tone.js, Framer Motion, Zustand, Vitest)
npm install tone framer-motion zustand
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom

# Run tests
npm test

# Run dev server
npm run dev

# Build for production
npm run build
```

## 🧪 Tests

```bash
npm test        # Run all tests (15 tests)
npm run test:watch  # Watch mode
```

**Test Coverage:**
- Mood button rendering (all 6)
- Pad rendering (all 6)
- Energy slider → BPM conversion
- Play/Stop toggle
- Beat visualizer
- Remix button
- Status bar updates

## 🌐 Deployment

**Auto-Deploy (Netlify):**
Push to `main` → Netlify baut und deployt automatisch.

**Manual:**
```bash
npm run build
netlify deploy --prod --dir=dist
```

## 📁 Project Structure

```
vibe-app/
├── src/
│   ├── App.tsx          # Main component (all UI)
│   ├── App.css         # Minimal reset
│   ├── App.test.tsx    # Vitest tests
│   ├── setupTests.ts   # Testing Library setup
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── vite.config.ts      # Vite config
├── vitest.config.ts    # Test config
├── package.json
└── tsconfig.json
```

## 🎛 Moods & Colors

| Mood | Color | Vibe |
|------|-------|------|
| ☀️ Warm | `#FFB347` | Sommer, Euphorie |
| ⚡ Electric | `#7DF9FF` | Energie, Club |
| 🌙 Dreamy | `#B39DDB` | Tief, Träumerisch |
| 🌑 Dark | `#2D2D3A` | Intensiv, Drama |
| 🌿 Forest | `#52B788` | Entspannt, Natur |
| 🔥 Fire | `#FF4500` | Wut, Power |

## ⚠️ Known Limitations

- Tone.js ist installiert aber noch nicht im Code aktiviert — Audio-Engine kommt als nächstes Feature
- URL State für Share-Funktion ist noch nicht implementiert
- Mobile Touch-Events können bei Sound-Pads verzögern (geplant: Touch-optimierte Pads)

## 🔮 Next Steps

1. Tone.js Audio-Engine integrieren (echte Synth-Sounds pro Mood)
2. Sound-Pads mit echtem Audio-Trigger
3. URL-enconded State für Share-Links
4. Aufnahme-Funktion (导出 als WAV/MP3)
5. Mobile-optimierte Touch-Gesten

---

*Built by Krabbi 🦀 — React + Vite + Framer Motion + Tone.js*
