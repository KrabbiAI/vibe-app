/**
 * Generate mood-specific audio samples using Web Audio API.
 * Returns AudioBuffers cached per mood — only generated once per mood.
 */

type Mood = string

interface SampleBuffers {
  kick: AudioBuffer
  snare: AudioBuffer
  hihat: AudioBuffer
  bass: AudioBuffer
  chord_major: AudioBuffer
  chord_minor: AudioBuffer
  chord_electric: AudioBuffer
  lead_bright: AudioBuffer
  lead_soft: AudioBuffer
  lead_aggressive: AudioBuffer
  fx_riser: AudioBuffer
  fx_glitch: AudioBuffer
  fx_nature: AudioBuffer
}

const cache = new Map<Mood, SampleBuffers>()

function createCtx(): AudioContext {
  return new AudioContext()
}

function bufToWavUrl(buffer: AudioBuffer): string {
  const numChannels = buffer.numberOfChannels
  const sr = buffer.sampleRate
  const bitDepth = 16
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const dataSize = buffer.length * blockAlign
  const totalSize = 44 + dataSize
  const ab = new ArrayBuffer(totalSize)
  const view = new DataView(ab)

  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)) }
  writeStr(0, 'RIFF');    view.setUint32(4, totalSize - 8, true)
  writeStr(8, 'WAVE');    writeStr(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true); view.setUint32(24, sr, true)
  view.setUint32(28, sr * blockAlign, true)
  view.setUint16(32, blockAlign, true); view.setUint16(34, bitDepth, true)
  writeStr(36, 'data'); view.setUint32(40, dataSize, true)

  const chData: Float32Array[] = []
  for (let c = 0; c < numChannels; c++) chData.push(buffer.getChannelData(c))
  let off = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, chData[c][i]))
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      off += 2
    }
  }
  return URL.createObjectURL(new Blob([ab], { type: 'audio/wav' }))
}

function mkBuf(ctx: AudioContext, len: number, fn: (t: number, i: number, sr: number) => number): AudioBuffer {
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  const sr = ctx.sampleRate
  for (let i = 0; i < len; i++) d[i] = fn(i / sr, i, sr)
  return buf
}

// ── KICK ──────────────────────────────────────────────────────────────────────
function genKick(ctx: AudioContext): AudioBuffer {
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 0.5), (t) => {
    const freq = 55 + 95 * Math.exp(-t * 35)
    return (Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 6) + Math.exp(-t * 150) * 0.4) * 0.85
  })
}

// ── SNARE ─────────────────────────────────────────────────────────────────────
function genSnare(ctx: AudioContext): AudioBuffer {
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 0.3), (t) => {
    const tone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 25) * 0.45
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 12)
    return (tone + noise * 0.7) * 0.8
  })
}

// ── HIHAT ─────────────────────────────────────────────────────────────────────
function genHihat(ctx: AudioContext): AudioBuffer {
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 0.1), (t) => {
    const n = Math.random() * 2 - 1
    const ring = Math.sin(2 * Math.PI * 7500 * t) * 0.3 + Math.sin(2 * Math.PI * 11000 * t) * 0.2
    return (n * 0.5 + ring) * Math.exp(-t * 50) * 0.6
  })
}

// ── BASS ──────────────────────────────────────────────────────────────────────
function genBass(ctx: AudioContext): AudioBuffer {
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 0.5), (t) => {
    const saw = Math.sin(2 * Math.PI * 55 * t) + 0.5 * Math.sin(2 * Math.PI * 110 * t) + 0.25 * Math.sin(2 * Math.PI * 165 * t)
    return saw / 1.75 * Math.exp(-t * 5) * 0.75
  })
}

// ── CHORD MAJOR (sunny, forest) ──────────────────────────────────────────────
function genChordMajor(ctx: AudioContext): AudioBuffer {
  const notes = [261.63, 329.63, 392.00] // C E G
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 2), (t) => {
    let s = 0
    for (const f of notes) {
      s += Math.sin(2 * Math.PI * f * t) * 0.33
      s += Math.sin(2 * Math.PI * f * 1.003 * t) * 0.33 // slight detune
    }
    return s * Math.min(1, t * 8) * Math.exp(-t * 1.5) * 0.4 // slow attack, reverb tail
  })
}

// ── CHORD MINOR (dark, fire) ─────────────────────────────────────────────────
function genChordMinor(ctx: AudioContext): AudioBuffer {
  const notes = [261.63, 311.13, 392.00] // C Eb G
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 2), (t) => {
    let s = 0
    for (const f of notes) {
      s += Math.sin(2 * Math.PI * f * t) * 0.33
      s += Math.sin(2 * Math.PI * f * 0.998 * t) * 0.33 // slight detune down
    }
    // add a fifth up ghost
    s += Math.sin(2 * Math.PI * 523 * t) * 0.15
    return s * Math.min(1, t * 5) * Math.exp(-t * 2) * 0.45
  })
}

// ── CHORD ELECTRIC (club) ────────────────────────────────────────────────────
function genChordElectric(ctx: AudioContext): AudioBuffer {
  const notes = [130.81, 164.81, 196.00] // C3 E3 G3 — lower register, punchy
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 1.5), (t) => {
    let s = 0
    for (const f of notes) {
      // Square-ish for punch
      s += (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 2 * t)) / 1.5 * 0.5
    }
    return s * Math.min(1, t * 20) * Math.exp(-t * 4) * 0.5
  })
}

// ── LEAD BRIGHT (sunny, electric) ────────────────────────────────────────────
function genLeadBright(ctx: AudioContext): AudioBuffer {
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 0.6), (t) => {
    // Sine + harmonic
    const s = Math.sin(2 * Math.PI * 523 * t) * 0.6 + Math.sin(2 * Math.PI * 1047 * t) * 0.4
    return s * Math.exp(-t * 4) * 0.5
  })
}

// ── LEAD SOFT (dreamy, forest) ────────────────────────────────────────────────
function genLeadSoft(ctx: AudioContext): AudioBuffer {
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 1.0), (t) => {
    // Filtered sine with slow attack
    const s = Math.sin(2 * Math.PI * 392 * t)
    const vib = 1 + 0.005 * Math.sin(2 * Math.PI * 5 * t)
    return s * vib * Math.min(1, t * 2) * Math.exp(-t * 2.5) * 0.45
  })
}

// ── LEAD AGGRESSIVE (dark, fire) ──────────────────────────────────────────────
function genLeadAggressive(ctx: AudioContext): AudioBuffer {
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 0.5), (t) => {
    // Sawtooth-ish, fast attack
    const saw = Math.sin(2 * Math.PI * 349 * t) + 0.5 * Math.sin(2 * Math.PI * 698 * t) + 0.25 * Math.sin(2 * Math.PI * 1047 * t)
    return saw / 1.75 * Math.min(1, t * 40) * Math.exp(-t * 6) * 0.55
  })
}

// ── FX RISER ─────────────────────────────────────────────────────────────────
function genFxRiser(ctx: AudioContext): AudioBuffer {
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 0.8), (t) => {
    const noise = Math.random() * 2 - 1
    const freq = 200 * (1 + t * 3) // rising pitch
    const tone = Math.sin(2 * Math.PI * freq * t) * 0.3
    const amp = t < 0.7 ? t / 0.7 * 0.8 : Math.exp(-(t - 0.7) * 8) * 0.8
    return (noise * 0.4 + tone) * amp * 0.5
  })
}

// ── FX GLITCH (dark) ──────────────────────────────────────────────────────────
function genFxGlitch(ctx: AudioContext): AudioBuffer {
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 0.5), (t) => {
    // Bitcrushed-ish noise bursts
    const burst = Math.random() > 0.7 ? (Math.random() * 2 - 1) : 0
    const tone = Math.sin(2 * Math.PI * 220 * t) * Math.sin(2 * Math.PI * 4 * t) // AM at 4Hz
    const amp = Math.exp(-t * 6)
    return (burst * 0.6 + tone * 0.4) * amp * 0.5
  })
}

// ── FX NATURE (forest) ────────────────────────────────────────────────────────
function genFxNature(ctx: AudioContext): AudioBuffer {
  return mkBuf(ctx, Math.floor(ctx.sampleRate * 1.2), (t) => {
    // Filtered noise with slow swell + subtle tone
    const noise = (Math.random() * 2 - 1)
    const tone = Math.sin(2 * Math.PI * 330 * t) * 0.2
    const swell = Math.sin(2 * Math.PI * 0.5 * t) * 0.3 + 0.5
    return (noise * 0.5 + tone) * swell * Math.exp(-t * 2) * 0.4
  })
}

// ── Main generator ────────────────────────────────────────────────────────────
export interface MoodSamples {
  kick: string; snare: string; hihat: string; bass: string
  chord: string
  lead: string
  fx: string
}

export async function generateMoodSamples(mood: Mood): Promise<MoodSamples> {
  if (cache.has(mood)) {
    const b = cache.get(mood)!
    return {
      kick:   bufToWavUrl(b.kick),
      snare:  bufToWavUrl(b.snare),
      hihat:  bufToWavUrl(b.hihat),
      bass:   bufToWavUrl(b.bass),
      chord:  bufToWavUrl(mood === 'electric' ? b.chord_electric : mood === 'dark' || mood === 'fire' ? b.chord_minor : b.chord_major),
      lead:   bufToWavUrl(mood === 'dreamy' || mood === 'forest' ? b.lead_soft : mood === 'dark' || mood === 'fire' ? b.lead_aggressive : b.lead_bright),
      fx:     bufToWavUrl(mood === 'dark' ? b.fx_glitch : mood === 'forest' ? b.fx_nature : b.fx_riser),
    }
  }

  const ctx = createCtx()
  const b: SampleBuffers = {
    kick:            genKick(ctx),
    snare:           genSnare(ctx),
    hihat:           genHihat(ctx),
    bass:            genBass(ctx),
    chord_major:     genChordMajor(ctx),
    chord_minor:     genChordMinor(ctx),
    chord_electric:  genChordElectric(ctx),
    lead_bright:     genLeadBright(ctx),
    lead_soft:       genLeadSoft(ctx),
    lead_aggressive:  genLeadAggressive(ctx),
    fx_riser:        genFxRiser(ctx),
    fx_glitch:       genFxGlitch(ctx),
    fx_nature:       genFxNature(ctx),
  }
  cache.set(mood, b)

  return {
    kick:   bufToWavUrl(b.kick),
    snare:  bufToWavUrl(b.snare),
    hihat:  bufToWavUrl(b.hihat),
    bass:   bufToWavUrl(b.bass),
    chord:  bufToWavUrl(mood === 'electric' ? b.chord_electric : mood === 'dark' || mood === 'fire' ? b.chord_minor : b.chord_major),
    lead:   bufToWavUrl(mood === 'dreamy' || mood === 'forest' ? b.lead_soft : mood === 'dark' || mood === 'fire' ? b.lead_aggressive : b.lead_bright),
    fx:     bufToWavUrl(mood === 'dark' ? b.fx_glitch : mood === 'forest' ? b.fx_nature : b.fx_riser),
  }
}
