let audioCtx: AudioContext | null = null

async function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume()
  }
  return audioCtx
}

export async function playCompletionSound() {
  try {
    const ctx = await getAudioContext()
    const now = ctx.currentTime

    // Two-tone chime: C5 -> E5 (major third)
    const notes = [523.25, 659.25]
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.1)
      osc.connect(gain)
      osc.start(now + i * 0.1)
      osc.stop(now + 0.6)
    })
  } catch { /* Audio not available */ }
}

export async function playFocusStartSound() {
  try {
    const ctx = await getAudioContext()
    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(110, now + 1.2)
    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 1.5)
  } catch { /* Audio not available */ }
}

export async function playDeleteSound() {
  try {
    const ctx = await getAudioContext()
    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.03, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25)
    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.3)
  } catch { /* Audio not available */ }
}
