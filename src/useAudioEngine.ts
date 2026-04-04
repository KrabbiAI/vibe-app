import * as Tone from "tone"
import { generateSamples, type GeneratedSamples } from "./sampleGenerator"

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
    samples: null as GeneratedSamples | null,
    players: null as Tone.Players | null,
    filter: null as Tone.Filter | null,
    reverb: null as Tone.Reverb | null,
    distortion: null as Tone.Distortion | null,
    sequencer: null as Tone.Sequence | null,
    currentMood: "sunny",
    currentEnergy: 50,
    activePads: new Set([0, 2, 3]),
  }}

  // Step patterns: which step each pad fires on (8 steps per bar)
  // Each mood can override these
  const STEP_PATTERNS: Record<string, Record<number, number[]>> = {
    sunny:    { 0: [0],    1: [2],    2: [0,4],  3: [0],    4: [4],    5: [7]   },
    electric: { 0: [0,6],  1: [2,6],  2: [0,4],  3: [0,4],  4: [2,6],  5: [0,4] },
    dreamy:   { 0: [0],   1: [3],    2: [0,4],  3: [0],    4: [2,4],  5: [6]   },
    dark:     { 0: [0,6],  1: [2,6],  2: [0,4],  3: [0,4],  4: [0],    5: [4]   },
    forest:   { 0: [0],    1: [3],    2: [0,4],  3: [0,4],  4: [0,2],  5: [6]   },
    fire:     { 0: [0,6],  1: [4],    2: [0,4],  3: [0,2,4],4: [0,4],  5: [0,4] },
  }

  // Sample names per pad
  const PAD_SAMPLES: Record<number, string> = {
    0: "kick",
    1: "snare",
    2: "bass",
    3: "chord",
    4: "chord",
    5: "fx",
  }

  const setupAudio = async (mood: string, energy: number) => {
    const r = engineRef.current

    // Dispose old
    if (r.sequencer) { r.sequencer.dispose(); r.sequencer = null }
    if (r.players) { r.players.dispose(); r.players = null }
    if (r.filter) { r.filter.dispose() }
    if (r.reverb) { r.reverb.dispose() }
    if (r.distortion) { r.distortion.dispose() }

    // Generate samples once on first start
    if (!r.samples) {
      r.samples = await generateSamples()
    }

    // Build sample URLs for Tone.Players
    const urls: Record<string, string> = {}
    const sampleNames = ["kick", "snare", "hihat", "bass", "chord", "fx"]
    for (const name of sampleNames) {
      urls[name] = r.samples[name as keyof GeneratedSamples]
    }

    // Create players with all samples
    const players = new Tone.Players(urls).toDestination()

    // Effects chain
    const filter = new Tone.Filter({
      frequency: 800 + (energy / 100) * 3500,
      type: "lowpass",
      rolloff: -24,
    })

    const reverb = new Tone.Reverb({
      decay: 1.5 + (energy / 100) * 4,
      wet: 0.15 + (energy / 100) * 0.3,
    })

    const distortion = new Tone.Distortion({
      distortion: 0.05 + (1 - energy / 100) * 0.15,
    })

    // Chain: players → filter → distortion → reverb → destination
    players.chain(filter, distortion, reverb, Tone.getDestination())

    r.players = players
    r.filter = filter
    r.reverb = reverb
    r.distortion = distortion
    r.currentMood = mood
    r.currentEnergy = energy

    // Set BPM
    const bpm = 60 + (energy / 100) * 100
    Tone.getTransport().bpm.value = bpm

    // Create sequencer
    const steps = 8
    r.sequencer = new Tone.Sequence(
      (time, step) => {
        onBeatStep(step)
        const pattern = STEP_PATTERNS[mood] || STEP_PATTERNS.sunny
        r.activePads.forEach(padId => {
          const hitSteps = pattern[padId] || []
          if (hitSteps.includes(step)) {
            onPadPulse(padId)
            const sampleName = PAD_SAMPLES[padId]
            r.players?.player(sampleName)?.start(time)
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
      if (!r.isStarted || !r.players) return
      onPadPulse(id)
      const sampleName = PAD_SAMPLES[id]
      r.players.player(sampleName)?.start()
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
          engineRef.current.filter.frequency.value = 800 + (energy / 100) * 3500
        }
        if (engineRef.current.reverb) {
          engineRef.current.reverb.decay = 1.5 + (energy / 100) * 4
        }
        if (engineRef.current.distortion) {
          engineRef.current.distortion.distortion = 0.05 + (1 - energy / 100) * 0.15
        }
      } catch (_) { /* Tone not initialized in test env */ }
    },
    setActivePads: (pads: Set<number>) => {
      engineRef.current.activePads = pads
    },
  }
}
