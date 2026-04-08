# Vibe — Web Audio Synth Pad

**Browser-based audio synthesizer with 6 mood presets and 6 interactive synth pads.**

**Live:** https://vibe-xyz.vercel.app
**GitHub:** https://github.com/KrabbiAI/vibe-app

## Was Es Macht

Web Audio API-powered synth pad. Six mood presets ändern background visuals + audio characteristics. Six pads (Kick, Snare, Bass, Chord, Lead, FX) trigger procedurally generated sounds. Real-time waveform visualization via Canvas.

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.x | UI |
| typescript | ~5.9 | Type safety |
| vite | ^8.0.1 | Build tool |
| tailwindcss | ^4.2.2 | Styling |

**Note:** No external audio libraries — all sound generated via Web Audio API.

## Restore from Scratch

### 1. System Requirements

```bash
node --version  # must be >= 18
npm --version
```

### 2. Dependencies

```bash
cd /home/dobby/.openclaw/workspace/vibe
npm install
```

### 3. Environment Variables

Keine Environment Variables benötigt.

## Local Development

```bash
cd /home/dobby/.openclaw/workspace/vibe
npm run dev      # Dev server auf localhost:5173
npm run build    # Production build
npm run preview # Preview production build
```

## Deploy to Vercel

```bash
# Vercel CLI
npm install -g vercel

# Login (opens browser)
vercel login

# Deploy
cd /home/dobby/.openclaw/workspace/vibe
vercel --prod
```

**Oder:** GitHub repo mit Vercel verbinden für automatic deploys:
```
https://github.com/KrabbiAI/vibe-app
```

## Moods

| Mood | Emoji | Color | Vibe |
|------|-------|-------|------|
| Warm | ☀️ | Orange/Gold | Summer, Euphoria |
| Electric | ⚡ | Cyan/Blue | Energy, Club |
| Dreamy | 🌙 | Purple | Deep, Träumerisch |
| Dark | 🌑 | Dark Violet | Intense, Drama |
| Forest | 🌿 | Green | Relaxed, Nature |
| Fire | 🔥 | Red/Orange | Anger, Power |

## Pads

| Pad | Icon | Sound Type |
|-----|------|------------|
| KICK | ● | Low frequency sine + envelope |
| SNARE | ◆ | White noise + bandpass |
| BASS | ▼ | Sawtooth + lowpass |
| CHORD | ■ | Stacked oscillators |
| LEAD | ★ | Detuned saws |
| FX | ◉ | Filtered noise sweep |

## Audio Implementation

**All audio is procedurally generated** — no audio files.

**Web Audio API Context Creation:**
- AudioContext wird bei first user interaction erstellt (Browser policy)
- Kein vor-laden von Sounds möglich

**Pro Pad (Kick, Snare, etc.):**
1. OscillatorNode oder AudioBufferSourceNode erstellen
2. GainNode für envelope (attack, decay, sustain, release)
3. BiquadFilterNode für tone shaping
4. AnalyserNode für visualization

**Mood ändert:**
- Background gradient
- Oscillator frequencies
- Filter cutoff
- Reverb/delay settings

## Controls

| Action | Keyboard | Touch |
|--------|----------|-------|
| Trigger pad | Click | Tap |
| Switch mood | Click mood button | Tap mood button |
| Hold sound | Hold pad | Hold tap |

## Projekt Struktur

```
vibe/src/
├── App.tsx              # Main UI, mood/pad state
├── useAudioEngine.ts    # Web Audio synthesis engine
├── sampleGenerator.ts   # Procedural sound functions
├── App.css              # Visual styles
└── App.test.tsx         # Tests
```

## Canvas Waveform Visualizer

- `AnalyserNode.getByteTimeDomainData()` für waveform data
- 60fps render loop via `requestAnimationFrame`
- Canvas 2D context für rendering

## Troubleshooting

**Kein Sound auf Mobile:**
- Browser policy erfordert user interaction vor audio
- Erster tap auf pad startet AudioContext
- Safe area contexts für iOS notch beachten

**Sound funktioniert nur einmal:**
- AudioContext.resume() prüfen
- Eventuellen browser tab mute check

**Performance Probleme:**
- Viele sounds gleichzeitig → Reduce oscillator count
- Mobile → simpler waveforms nutzen

## Verify Installation

```bash
npm run build  # Muss ohne errors durchlaufen
npm run lint   # Keine TypeScript/lint errors
```

## API Endpoints

Keine Backend API — reines frontend.
