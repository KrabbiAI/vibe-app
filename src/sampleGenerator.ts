/**
 * Generate realistic audio samples using Web Audio API.
 * Returns AudioBuffers that can be loaded into Tone.Sampler.
 */

function createAudioContext(): AudioContext {
  return new AudioContext()
}

function audioBufferToWavUrl(buffer: AudioBuffer): string {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const dataSize = buffer.length * blockAlign
  const headerSize = 44
  const totalSize = headerSize + dataSize

  const ab = new ArrayBuffer(totalSize)
  const view = new DataView(ab)

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, totalSize - 8, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  // Interleave channels
  const channelData: Float32Array[] = []
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c))
  }

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channelData[c][i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }
  }

  return URL.createObjectURL(new Blob([ab], { type: 'audio/wav' }))
}

function generateKick(ctx: AudioContext, duration = 0.5): AudioBuffer {
  const sr = ctx.sampleRate
  const len = Math.floor(sr * duration)
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)

  for (let i = 0; i < len; i++) {
    const t = i / sr
    // Pitch envelope: 150Hz → 40Hz sweep
    const freq = 40 + 110 * Math.exp(-t * 40)
    const phase = 2 * Math.PI * freq * t
    // Amplitude envelope
    const amp = Math.exp(-t * 8)
    // Add a bit of click at the start
    const click = Math.exp(-t * 200) * 0.3
    data[i] = (Math.sin(phase) * amp + click) * 0.9
  }
  return buf
}

function generateSnare(ctx: AudioContext, duration = 0.3): AudioBuffer {
  const sr = ctx.sampleRate
  const len = Math.floor(sr * duration)
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)

  for (let i = 0; i < len; i++) {
    const t = i / sr
    // Tone component (200Hz tuned noise)
    const tone = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 30) * 0.4
    // Noise component
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 15)
    // Snap transient
    const snap = Math.exp(-t * 100) * 0.3
    data[i] = (tone + noise + snap) * 0.8
  }
  return buf
}

function generateHihat(ctx: AudioContext, duration = 0.15): AudioBuffer {
  const sr = ctx.sampleRate
  const len = Math.floor(sr * duration)
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)

  for (let i = 0; i < len; i++) {
    const t = i / sr
    // High-frequency metallic noise
    const noise = Math.random() * 2 - 1
    // Resonant bandpass simulation via ring modulation
    const ring = Math.sin(2 * Math.PI * 8000 * t) * 0.3
    // Shimmer
    const shimmer = Math.sin(2 * Math.PI * 12000 * t) * 0.2
    const amp = Math.exp(-t * 40)
    data[i] = (noise * 0.5 + ring + shimmer) * amp * 0.6
  }
  return buf
}

function generateBass(ctx: AudioContext, note = 55, duration = 0.4): AudioBuffer {
  const sr = ctx.sampleRate
  const len = Math.floor(sr * duration)
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)

  for (let i = 0; i < len; i++) {
    const t = i / sr
    const freq = note
    // Sawtooth-ish via additive
    const saw = (Math.sin(2 * Math.PI * freq * t) +
                 0.5 * Math.sin(2 * Math.PI * freq * 2 * t) +
                 0.25 * Math.sin(2 * Math.PI * freq * 3 * t)) / 1.75
    const amp = Math.exp(-t * 4)
    data[i] = saw * amp * 0.7
  }
  return buf
}

function generateChord(ctx: AudioContext, notes = [261, 329, 392], duration = 1.0): AudioBuffer {
  const sr = ctx.sampleRate
  const len = Math.floor(sr * duration)
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)

  for (let i = 0; i < len; i++) {
    const t = i / sr
    let sample = 0
    for (const freq of notes) {
      // Add slight detune for width
      sample += Math.sin(2 * Math.PI * freq * t) * 0.33
      sample += Math.sin(2 * Math.PI * freq * 1.003 * t) * 0.33
    }
    const amp = Math.exp(-t * 2)
    data[i] = sample * amp * 0.5
  }
  return buf
}

function generateFx(ctx: AudioContext, duration = 0.5): AudioBuffer {
  const sr = ctx.sampleRate
  const len = Math.floor(sr * duration)
  const buf = ctx.createBuffer(1, len, sr)
  const data = buf.getChannelData(0)

  for (let i = 0; i < len; i++) {
    const t = i / sr
    // Rising white noise sweep
    const noise = Math.random() * 2 - 1
    const riser = Math.sin(2 * Math.PI * 200 * t * (1 + t * 2)) * 0.3
    const amp = t < 0.7 ? t / 0.7 * Math.exp(-(t - 0.7) * 5) : Math.exp(-(t - 0.7) * 10)
    data[i] = (noise * 0.4 + riser) * amp * 0.6
  }
  return buf
}

export interface GeneratedSamples {
  kick: string   // WAV URL
  snare: string
  hihat: string
  bass: string
  chord: string
  fx: string
}

export async function generateSamples(): Promise<GeneratedSamples> {
  const ctx = createAudioContext()

  const kick = generateKick(ctx)
  const snare = generateSnare(ctx)
  const hihat = generateHihat(ctx)
  const bass = generateBass(ctx)
  const chord = generateChord(ctx)
  const fx = generateFx(ctx)

  const samples: GeneratedSamples = {
    kick: audioBufferToWavUrl(kick),
    snare: audioBufferToWavUrl(snare),
    hihat: audioBufferToWavUrl(hihat),
    bass: audioBufferToWavUrl(bass),
    chord: audioBufferToWavUrl(chord),
    fx: audioBufferToWavUrl(fx),
  }

  // Don't close context - Tone.js needs it
  return samples
}
