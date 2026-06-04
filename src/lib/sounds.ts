let audioCtx: AudioContext | null = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

export function playCompletionSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Two-tone chime: C5 -> E5 (major third)
    const notes = [523.25, 659.25]
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.12)
      osc.connect(gain)
      osc.start(now + i * 0.12)
      osc.stop(now + 0.5)
    })
  } catch {
    // Audio not available
  }
}
