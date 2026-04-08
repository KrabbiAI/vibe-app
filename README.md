# Vibe — Web Audio Synth Pad

**Browser-based audio synthesizer with 6 mood presets and 6 interactive synth pads.**

**Live:** https://vibe-xyz.vercel.app

## What It Does

Web Audio API-powered synth pad. Six mood presets change background visuals + audio characteristics. Six pads (Kick, Snare, Bass, Chord, Lead, FX) trigger procedurally generated sounds. Real-time waveform visualization via Canvas.

## Restore from Scratch

```bash
# Requires: Node.js 18+
cd /home/dobby/.openclaw/workspace/vibe

# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login (opens browser)
vercel login

# Deploy from vibe directory
cd /home/dobby/.openclaw/workspace/vibe
vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deploys:
```
https://github.com/KrabbiAI/vibe-app
```
Enable the Vercel GitHub App on the repo for zero-config deployments.
```

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.x | UI |
| typescript | ~5.9 | Type safety |
| vite | ^8.0.1 | Build tool |
| tailwindcss | ^4.2.2 | Styling |

Note: No external audio libraries — all sound generated via Web Audio API.

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

## Project Structure

```
vibe/src/
├── App.tsx              # Main UI, mood/pad state
├── useAudioEngine.ts    # Web Audio synthesis engine
├── sampleGenerator.ts   # Procedural sound functions
├── App.css              # Visual styles
└── App.test.tsx         # Tests
```

## Key Implementation Notes

- All audio is **procedurally generated** — no audio files
- Web Audio API context created on first user interaction (browser policy)
- Each mood changes: background gradient, oscillator frequencies, filter cutoff, reverb
- Canvas waveform visualizer uses `AnalyserNode.getByteTimeDomainData()`
- Touch events supported via `onTouchStart` + `onTouchEnd`

## Controls

- **Click/Tap pad** — Trigger sound
- **Click mood button** — Switch mood (instant visual + audio change)
- **Hold pad** — Sustained sound with envelope

## Verify Installation

```bash
npm run build  # Must succeed without errors
npm run lint   # No TypeScript/lint errors
```
