import * as Tone from "tone"

// Mood → Chord Progression (root notes + quality)
const CHORD_PROGRESSIONS: Record<string, string[]> = {
  sunny:     ["C", "G", "Am", "F"],          // I - V - vi - IV  (pop major)
  electric:  ["G", "Em", "C", "D"],           // vi - IV - I - V  (classic club)
  dreamy:    ["Ab", "Eb", "Fm", "Db"],        // I - VI - ii - V  (dreamy, minor-ish)
  dark:      ["Dm", "Am", "Gm", "F"],         // i - VI - III - VII (dark drama)
  forest:    ["Em", "C", "G", "D"],           // i - VI - III - VII (nature, earthy)
  fire:      ["Cm", "Ab", "Eb", "Bb"],        // i - VI - III - VII (power, intensity)
}

// Mood → Synth preset
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOOD_SYNTH_CONFIG: Record<string, any> = {
  sunny:    { oscillator: "triangle",  envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.8 }, filterFreq: 4000, filterType: "lowpass" },
  electric: { oscillator: "sawtooth",  envelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.5 }, filterFreq: 2000, filterType: "bandpass" },
  dreamy:   { oscillator: "sine",      envelope: { attack: 0.05, decay: 0.5, sustain: 0.7, release: 1.2 }, filterFreq: 1500, filterType: "lowpass" },
  dark:     { oscillator: "square",    envelope: { attack: 0.01, decay: 0.4, sustain: 0.5, release: 1.0 }, filterFreq: 800,  filterType: "lowpass" },
  forest:   { oscillator: "triangle",  envelope: { attack: 0.02, decay: 0.35, sustain: 0.65, release: 0.9 }, filterFreq: 2500, filterType: "lowpass" },
  fire:     { oscillator: "sawtooth",  envelope: { attack: 0.005, decay: 0.3, sustain: 0.5, release: 0.7 }, filterFreq: 3000, filterType: "lowpass" },
}

// Pad instrument definitions
type PadId = 0 | 1 | 2 | 3 | 4 | 5

interface PadConfig {
  name: string
  synthType: string
  note: string
  duration: Tone.Unit.Time
  filterFreq: number
  color: string
}

const PAD_CONFIGS: Record<number, PadConfig> = {
  0: { name: "KICK",  synthType: "membrane", note: "C1", duration: "8n",  filterFreq: 200,  color: "#FF6B6B" },
  1: { name: "SNARE", synthType: "noise",     note: "C3", duration: "8n",  filterFreq: 4000, color: "#FFD93D" },
  2: { name: "BASS",  synthType: "monoSynth", note: "C2", duration: "4n",  filterFreq: 800,  color: "#6BCB77" },
  3: { name: "CHORD", synthType: "polySynth",  note: "C3", duration: "2n",  filterFreq: 3000, color: "#4D96FF" },
  4: { name: "LEAD",  synthType: "leadSynth",  note: "C4", duration: "4n",  filterFreq: 4000, color: "#C77DFF" },
  5: { name: "FX",    synthType: "fxSynth",     note: "C5", duration: "2n",  filterFreq: 6000, color: "#FF9A3C" },
}

// Step patterns per mood (which beat steps each pad fires on)
const STEP_PATTERNS: Record<string, Record<number, number[]>> = {
  sunny:    { 0: [0, 4],    1: [2, 6],    2: [0, 3, 6], 3: [0],       4: [0, 4],  5: [7] },
  electric: { 0: [0, 2, 6],  1: [4],       2: [0, 4],     3: [0, 4],    4: [0, 2],  5: [0, 4] },
  dreamy:   { 0: [0],       1: [3, 7],    2: [0, 4],     3: [0],       4: [0, 4],  5: [7] },
  dark:     { 0: [0, 6],    1: [2, 6],    2: [0, 4],     3: [0, 4],    4: [0],    5: [0, 4] },
  forest:   { 0: [0],       1: [3],       2: [0, 4],     3: [0, 4],    4: [0, 2],  5: [6] },
  fire:     { 0: [0, 2, 6], 1: [4],       2: [0, 4],     3: [0, 2, 4], 4: [0, 4],  5: [0, 4] },
}

export interface VibeAudioEngine {
  isStarted: boolean
  start: () => Promise<void>
  stop: () => void
  triggerPad: (id: number) => void
  setMood: (mood: string) => void
  setEnergy: (energy: number) => void
  setActivePads: (pads: Set<number>) => void
}

export function createAudioEngine(
  onBeatStep: (step: number) => void,
  onPadPulse: (padId: number) => void
): VibeAudioEngine {
  const engineRef = { current: {
    isStarted: false,
    synths: {} as Record<number, any>,
    chordSynth: null as Tone.PolySynth | null,
    filter: null as Tone.Filter | null,
    reverb: null as Tone.Reverb | null,
    distortion: null as Tone.Distortion | null,
    sequencer: null as Tone.Sequence | null,
    currentMood: "sunny",
    currentEnergy: 50,
    activePads: new Set([0, 2, 3]),
    currentChordIndex: 0,
  }}

  const getChordNotes = (mood: string, index: number): string[] => {
    const progression = CHORD_PROGRESSIONS[mood] || CHORD_PROGRESSIONS.sunny
    const root = progression[index % progression.length]
    // Major chord: root, +4 semitones (major third), +7 (fifth)
    // Minor chord: root, +3 semitones (minor third), +7 (fifth)
    const isMinor = root.includes("m") || ["Am", "Em", "Dm", "Cm", "Fm"].includes(root)
    const base = root.replace("m", "")
    const third = isMinor ? `${base}Eb` : `${base}E`
    const fifth = isMinor ? `${base}Bb` : `${base}G`
    return [`${base}3`, third, fifth]
  }

  const createPadSynth = (padId: number, mood: string): Tone.Synth | Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth | Tone.FMSynth | Tone.AMSynth | Tone.MonoSynth | Tone.PolySynth | Tone.Sampler => {
    const config = PAD_CONFIGS[padId]
    const moodConfig = MOOD_SYNTH_CONFIG[mood]

    if (config.synthType === "membrane") {
      // KICK: punchy sub-bass with pitch sweep from ~150Hz → 40Hz
      return new Tone.MembraneSynth({
        pitchDecay: 0.08,
        octaves: 6,
        resonantHarmonics: false,
        envelope: {
          attack: 0.001,
          decay: 0.25,
          sustain: 0.01,
          release: 0.1,
        },
      } as any)
    }

    if (config.synthType === "noise") {
      // SNARE: sharp attack, quick decay, tonal snap at the front
      return new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: {
          attack: 0.001,
          decay: 0.15,
          sustain: 0,
          release: 0.1,
        },
      } as any)
    }

    if (config.synthType === "monoSynth") {
      // BASS: monophonic, portamento, punchy filter envelope
      return new Tone.MonoSynth({
        oscillator: { type: "sawtooth" },
        envelope: {
          attack: 0.005,
          decay: 0.2,
          sustain: 0.4,
          release: 0.2,
        },
        filterEnvelope: {
          attack: 0.001,
          decay: 0.1,
          sustain: 0.3,
          release: 0.2,
          baseFrequency: 200,
          octaves: 2.5,
        },
        filter: { type: "lowpass", rolloff: -24 },
      } as any)
    }

    if (config.synthType === "polySynth") {
      // CHORD: lush, detuned, warm pad
      return new Tone.PolySynth(Tone.AMSynth, {
        harmonicity: 1.5,
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.05,
          decay: 0.4,
          sustain: 0.6,
          release: 0.8,
        },
      } as any)
    }

    if (config.synthType === "leadSynth") {
      // LEAD: bright, penetrating, slightly detuned for width
      return new Tone.FMSynth({
        harmonicity: 4,
        modulationIndex: 6,
        oscillator: { type: "square" },
        envelope: {
          attack: 0.005,
          decay: 0.1,
          sustain: 0.4,
          release: 0.3,
        },
        modulationEnvelope: {
          attack: 0.001,
          decay: 0.1,
          sustain: 0.2,
          release: 0.2,
        },
      } as any)
    }

    if (config.synthType === "fxSynth") {
      // FX: riser/impact - noise burst with pitch sweep
      return new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.1,
          release: 0.4,
        },
      } as any)
    }

    // Fallback
    return new Tone.Synth({
      oscillator: { type: moodConfig.oscillator },
      envelope: moodConfig.envelope,
    } as any)
  }

  const setupAudio = async (mood: string, energy: number) => {
    const r = engineRef.current

    // Dispose old
    if (r.sequencer) { r.sequencer.dispose(); r.sequencer = null }
    if (r.chordSynth) { r.chordSynth.dispose(); r.chordSynth = null }
    Object.values(r.synths).forEach(s => s.dispose())
    if (r.filter) { r.filter.dispose() }
    if (r.reverb) { r.reverb.dispose() }
    if (r.distortion) { r.distortion.dispose() }

    // Create effects chain
    const filter = new Tone.Filter({
      frequency: 1000 + (energy / 100) * 4000,
      type: "lowpass",
    })

    const reverb = new Tone.Reverb({
      decay: 1 + (energy / 100) * 3,
      wet: 0.15 + (energy / 100) * 0.25,
    })

    const distortion = new Tone.Distortion({
      distortion: 0.05 + (1 - energy / 100) * 0.2,
    })

    await reverb.generate()

    // Create pad synths - each with its own chain for better sound control
    const synths: Record<number, any> = {}
    ;[0, 1, 2, 3, 4, 5].forEach(padId => {
      const synth = createPadSynth(padId as PadId, mood)
      synth.chain(distortion, filter, reverb, Tone.getDestination())
      synths[padId] = synth
    })

    r.synths = synths
    r.filter = filter
    r.reverb = reverb
    r.distortion = distortion
    r.currentMood = mood
    r.currentEnergy = energy

    // Create sequencer
    const steps = 8
    const bpm = 60 + (energy / 100) * 100
    Tone.getTransport().bpm.value = bpm

    r.sequencer = new Tone.Sequence(
      (time, step) => {
        onBeatStep(step)
        const pattern = STEP_PATTERNS[mood] || STEP_PATTERNS.sunny
        r.activePads.forEach(padId => {
          const hitSteps = pattern[padId] || []
          if (hitSteps.includes(step)) {
            const config = PAD_CONFIGS[padId]
            const effectiveMood = r.currentMood
            const chordNotes = getChordNotes(effectiveMood, step)
            onPadPulse(padId)

            if (padId === 3) {
              // CHORD: trigger chord notes on polySynth
              r.synths[3]?.triggerAttackRelease(chordNotes, config.duration, time)
            } else if (padId === 4) {
              // LEAD: single note melody using leadSynth
              r.synths[4]?.triggerAttackRelease(config.note, config.duration, time)
            } else if (padId === 1) {
              // SNARE: noise burst
              r.synths[1]?.triggerAttackRelease("8n", time)
            } else if (padId === 5) {
              // FX: pink noise riser
              r.synths[5]?.triggerAttackRelease("8n", time)
            } else if (padId === 0) {
              // KICK: sub bass with pitch sweep
              r.synths[0]?.triggerAttackRelease(config.note, config.duration, time)
            } else {
              // BASS: mono synth
              r.synths[padId]?.triggerAttackRelease(config.note, config.duration, time)
            }
          }
        })
      },
      Array.from({ length: steps }, (_, i) => i),
      "8n"
    )

    r.sequencer.start(0)
  }

  return {
    get isStarted() { return engineRef.current.isStarted },
    start: async () => {
      if (engineRef.current.isStarted) return
      await Tone.start()
      engineRef.current.isStarted = true
      await setupAudio(engineRef.current.currentMood, engineRef.current.currentEnergy)
      Tone.getTransport().start()
    },
    stop: () => {
      Tone.getTransport().stop()
      Tone.getTransport().cancel()
    },
    triggerPad: (id: number) => {
      const r = engineRef.current
      if (!r.isStarted) return
      const config = PAD_CONFIGS[id]
      onPadPulse(id)
      if (id === 3) {
        const chordNotes = getChordNotes(r.currentMood, 0)
        r.synths[3]?.triggerAttackRelease(chordNotes, config.duration)
      } else if (id === 4) {
        r.synths[4]?.triggerAttackRelease(config.note, config.duration)
      } else if (id === 1) {
        r.synths[1]?.triggerAttackRelease("8n")
      } else if (id === 5) {
        r.synths[5]?.triggerAttackRelease("8n")
      } else if (id === 0) {
        r.synths[0]?.triggerAttackRelease(config.note, config.duration)
      } else {
        r.synths[id]?.triggerAttackRelease(config.note, config.duration)
      }
    },
    setMood: async (mood: string) => {
      engineRef.current.currentMood = mood
      if (engineRef.current.isStarted) {
        await setupAudio(mood, engineRef.current.currentEnergy)
      }
    },
    setEnergy: (energy: number) => {
      engineRef.current.currentEnergy = energy
      if (!engineRef.current.isStarted) return
      try {
        const bpm = 60 + (energy / 100) * 100
        Tone.getTransport().bpm.value = bpm
        if (engineRef.current.filter) {
          engineRef.current.filter.frequency.value = 1000 + (energy / 100) * 4000
        }
        if (engineRef.current.reverb) {
          engineRef.current.reverb.decay = 1 + (energy / 100) * 3
        }
        if (engineRef.current.distortion) {
          engineRef.current.distortion.distortion = 0.1 + (1 - energy / 100) * 0.3
        }
      } catch (_) { /* Tone not initialized in test env */ }
    },
    setActivePads: (pads: Set<number>) => {
      engineRef.current.activePads = pads
    },
  }
}
