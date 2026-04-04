import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

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
    expect(screen.getByTestId('energy-slider')).toBeInTheDocument()
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
    // BPM shown in header badge: 60 + (50/100)*100 = 110
    expect(document.body.textContent).toContain('110 BPM')
  })

  it('updates BPM label when energy changes', () => {
    render(<App />)
    const slider = screen.getByTestId('energy-slider')
    fireEvent.change(slider, { target: { value: '0' } })
    expect(screen.getByTestId('energy-label')).toHaveTextContent('😴 Chill')
    expect(document.body.textContent).toContain('60 BPM')
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
    expect(pad0).toHaveAttribute('data-active', 'true') // default active
    await user.click(pad0)
    expect(pad0).toHaveAttribute('data-active', 'false')
  })

  it('starts playing when play button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    const playBtn = screen.getByTestId('play-button')
    await user.click(playBtn)
    expect(playBtn).toHaveTextContent('⏹ STOP')
    expect(screen.getByTestId('status-bar')).toHaveTextContent('● LIVE')
  })

  it('stops playing when stop button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    const playBtn = screen.getByTestId('play-button')
    await user.click(playBtn) // start
    await user.click(playBtn) // stop
    expect(playBtn).toHaveTextContent('▶ PLAY')
    expect(screen.getByTestId('status-bar')).not.toHaveTextContent('● LIVE')
  })

  it('shows beat visualizer steps when playing', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await user.click(screen.getByTestId('play-button'))
    expect(screen.getByTestId('beat-step-0')).toBeInTheDocument()
  })

  it('remix button is clickable without error', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await user.click(screen.getByTestId('remix-button'))
    // No crash — remix works
    expect(screen.getByTestId('remix-button')).toBeInTheDocument()
  })
})
