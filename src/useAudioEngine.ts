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
    isPlaying: false,
    samples: null as GeneratedSamples | null,
    players: null as Tone.Players | null,
    filter: null as Tone.Filter | null,
    reverb: null as Tone.Reverb | null,
    distortion: null as Tone.Distortion | null,
    sequencer: null as Tone.Sequence | null,
    currentMood: "sunny",
    currentEnergy: 50,
    activePads: new Set([0, 2, 3]),
    pendingMood: null as string | null,
  }}

  const STEP_PATTERNS: Record<string, Record<number, number[]>> = {
    sunny:    { 0: [0],    1: [2],    2: [0,4],  3: [0],    4: [4],    5: [7]   },
    electric: { 0: [0,6],  1: [2,6],  2: [0,4],  3: [0,4],  4: [2,6],  5: [0,4] },
    dreamy:   { 0: [0],   1: [3],    2: [0,4],  3: [0],    4: [2,4],  5: [6]   },
    dark:     { 0: [0,6],  1: [2,6],  2: [0,4],  3: [0,4],  4: [0],    5: [4]   },
    forest:   { 0: [0],   1: [3],    2: [0,4],  3: [0,4],  4: [0,2],  5: [6]   },
    fire:     { 0: [0,6], 1: [4],    2: [0,4],  3: [0,2,4],4: [0,4],  5: [0,4] },
  }

  const PAD_SAMPLES: Record<number, string> = {
    0: "kick", 1: "snare", 2: "bass", 3: "chord", 4: "chord", 5: "fx",
  }

  const buildSequencer = (mood: string) => {
    const r = engineRef.current
    if (!r.players) return

    if (r.sequencer) { r.sequencer.dispose(); r.sequencer = null }

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
            try {
              r.players?.player(sampleName)?.start(time)
            } catch (_) { /* ignore timing edge cases */ }
          }
        })
      },
      Array.from({ length: steps }, (_, i) => i),
      "8n"
    )
    r.sequencer.start(0)
  }

  const setupAudio = async () => {
    const r = engineRef.current

    // Generate samples once
    if (!r.samples) {
      r.samples = await generateSamples()
    }

    // Create players (only once, reuse for all mood changes)
    if (!r.players) {
      const urls: Record<string, string> = {}
      for (const name of ["kick", "snare", "hihat", "bass", "chord", "fx"]) {
        urls[name] = r.samples[name as keyof GeneratedSamples]
      }
      r.players = new Tone.Players(urls)
    }

    // Create effects (only once)
    if (!r.filter) {
      r.filter = new Tone.Filter({
        frequency: 800 + (r.currentEnergy / 100) * 3500,
        type: "lowpass",
        rolloff: -24,
      })
    }
    if (!r.reverb) {
      r.reverb = new Tone.Reverb({
        decay: 1.5 + (r.currentEnergy / 100) * 4,
        wet: 0.15 + (r.currentEnergy / 100) * 0.3,
      })
    }
    if (!r.distortion) {
      r.distortion = new Tone.Distortion({
        distortion: 0.05 + (1 - r.currentEnergy / 100) * 0.15,
      })
      r.reverb.generate()
    }

    // Chain: players → filter → distortion → reverb → destination
    r.players.disconnect()
    r.players.chain(r.filter, r.distortion, r.reverb, Tone.getDestination())

    const bpm = 60 + (r.currentEnergy / 100) * 100
    Tone.getTransport().bpm.value = bpm

    // Build sequencer for current mood
    buildSequencer(r.currentMood)
  }

  return {
    get isStarted() { return engineRef.current.isStarted },
    start: async () => {
      if (engineRef.current.isStarted) {
        // Already started, just resume
        engineRef.current.isPlaying = true
        Tone.getTransport().start()
        return
      }
      await Tone.start()
      engineRef.current.isStarted = true
      engineRef.current.isPlaying = true
      await setupAudio()
      Tone.getTransport().start()
    },
    stop: () => {
      engineRef.current.isPlaying = false
      Tone.getTransport().stop()
      Tone.getTransport().cancel()
    },
    triggerPad: (id: number) => {
      const r = engineRef.current
      if (!r.isStarted || !r.isPlaying || !r.players) return
      onPadPulse(id)
      const sampleName = PAD_SAMPLES[id]
      try {
        r.players.player(sampleName)?.start()
      } catch (_) { /* ignore */ }
    },
    setMood: (mood: string) => {
      engineRef.current.currentMood = mood
      if (!engineRef.current.isStarted) return
      // Rebuild sequencer with new mood pattern (keep players alive)
      buildSequencer(mood)
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
      } catch (_) { /* ignore */ }
    },
    setActivePads: (pads: Set<number>) => {
      engineRef.current.activePads = pads
    },
  }
}
