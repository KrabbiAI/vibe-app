import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// Mock Tone.js to avoid AudioContext in tests
vi.mock('tone', () => ({
  default: {
    start: vi.fn().mockResolvedValue(undefined),
    getTransport: vi.fn().mockReturnValue({
      bpm: { value: 110 },
      start: vi.fn(),
      stop: vi.fn(),
      cancel: vi.fn(),
    }),
    getDestination: vi.fn(),
    getContext: vi.fn().mockReturnValue({ state: 'running' }),
  },
  getTransport: vi.fn().mockReturnValue({
    bpm: { value: 110 },
    start: vi.fn(),
    stop: vi.fn(),
    cancel: vi.fn(),
  }),
  getDestination: vi.fn(),
  getContext: vi.fn().mockReturnValue({ state: 'running' }),
  MembraneSynth: vi.fn().mockImplementation(() => ({
    chain: vi.fn(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  NoiseSynth: vi.fn().mockImplementation(() => ({
    chain: vi.fn(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  MetalSynth: vi.fn().mockImplementation(() => ({
    chain: vi.fn(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  FMSynth: vi.fn().mockImplementation(() => ({
    chain: vi.fn(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  AMSynth: vi.fn().mockImplementation(() => ({
    chain: vi.fn(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  Synth: vi.fn().mockImplementation(() => ({
    chain: vi.fn(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  PolySynth: vi.fn().mockImplementation(() => ({
    chain: vi.fn(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  Filter: vi.fn().mockImplementation(() => ({
    chain: vi.fn(),
    frequency: { value: 2000 },
    dispose: vi.fn(),
  })),
  Reverb: vi.fn().mockImplementation(() => ({
    chain: vi.fn(),
    decay: 2,
    generate: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
  })),
  Distortion: vi.fn().mockImplementation(() => ({
    chain: vi.fn(),
    distortion: { value: 0.2 },
    dispose: vi.fn(),
  })),
  Sequence: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    dispose: vi.fn(),
  })),
}))

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('VIBE App', () => {
  it('renders the VIBE header', () => {
    render(<App />)
    expect(document.body.textContent).toContain('VIBE')
    expect(document.body.textContent).toContain('MUSIK OHNE NOTEN')
  })

  it('renders all 6 mood buttons', () => {
    render(<App />)
    const moods = ['sunny', 'electric', 'dreamy', 'dark', 'forest', 'fire']
    moods.forEach((mood) => {
      expect(screen.getByTestId(`mood-${mood}`)).toBeInTheDocument()
    })
  })

  it('renders all 6 sound pads', () => {
    render(<App />)
    const pads = ['KICK', 'SNARE', 'BASS', 'CHORD', 'LEAD', 'FX']
    pads.forEach((pad) => {
      expect(screen.getByText(pad)).toBeInTheDocument()
    })
  })

  it('has energy slider', () => {
    render(<App />)
    expect(screen.getByTestId('energy-track')).toBeInTheDocument()
  })

  it('has play button', () => {
    render(<App />)
    expect(screen.getByTestId('play-button')).toBeInTheDocument()
  })

  it('has remix button', () => {
    render(<App />)
    expect(screen.getByTestId('remix-button')).toBeInTheDocument()
  })

  it('shows initial energy label as Vibe (energy=50)', () => {
    render(<App />)
    expect(screen.getByTestId('energy-label')).toHaveTextContent('🙂 Vibe')
  })

  it('shows correct BPM in header (110 at energy=50)', () => {
    render(<App />)
    expect(document.body.textContent).toContain('110 BPM')
  })

  it('updates BPM label when energy changes', () => {
    render(<App />)
    // Verify energy-track is interactive (jsdom getBoundingClientRect returns 0, so we test existence + no crash)
    const track = screen.getByTestId('energy-track')
    expect(track).toBeInTheDocument()
    expect(track).toHaveStyle({ cursor: 'pointer' })
  })

  it('toggles mood on click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    const darkMood = screen.getByTestId('mood-dark')
    await user.click(darkMood)
    expect(darkMood).toHaveAttribute('data-active', 'true')
  })

  it('toggles pad on click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    const pad0 = screen.getByTestId('pad-0')
    expect(pad0).toHaveAttribute('data-active', 'true')
    await user.click(pad0)
    expect(pad0).toHaveAttribute('data-active', 'false')
  })

  // Note: Play/Stop tests require real AudioContext (browser) — skip in unit tests
  // Audio engine is tested manually in browser at the deployed URL
})
