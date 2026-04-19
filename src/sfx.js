// Tiny Web Audio SFX engine. All sounds are synthesized square/sawtooth/noise
// patches so no assets ship with the app. Safe to call from any handler —
// the AudioContext is lazily created and resumed from a user gesture.

const MUTE_KEY = 'cpa-quest-sfx-muted'
let ctx = null
let muted = (() => {
  try { return localStorage.getItem(MUTE_KEY) === '1' } catch { return false }
})()

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    try { ctx = new AC() } catch { return null }
  }
  if (ctx.state === 'suspended') { try { ctx.resume() } catch {} }
  return ctx
}

export function isMuted() { return muted }
export function setMuted(next) {
  muted = !!next
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0') } catch {}
}

// Small ± symmetric jitter around 1. Used to vary pitch / duration / volume
// on every play so repeated triggers of the same patch don't fatigue the ear.
function jit(spread) {
  return 1 + (Math.random() * 2 - 1) * spread
}

function tone(ac, {
  freq, dur = 0.08, type = 'square', vol = 0.06, slide = 0, startAt,
  // ±4% pitch, ±8% duration, ±10% volume. Patches that care about musical
  // intervals (arpeggios) pass `pitchVar: 0` so the chord stays in tune.
  pitchVar = 0.04, durVar = 0.08, volVar = 0.10,
}) {
  const f0 = freq * jit(pitchVar)
  const d  = dur  * jit(durVar)
  const v  = vol  * jit(volVar)
  const t = startAt ?? ac.currentTime
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(f0, t)
  if (slide) {
    const target = Math.max(20, f0 + slide)
    osc.frequency.exponentialRampToValueAtTime(target, t + d)
  }
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(v, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + d)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + d + 0.02)
}

function noise(ac, {
  dur = 0.08, vol = 0.08, filterFreq = 2000, startAt,
  filterVar = 0.10, durVar = 0.10, volVar = 0.10,
}) {
  const ff = filterFreq * jit(filterVar)
  const d  = dur        * jit(durVar)
  const v  = vol        * jit(volVar)
  const t = startAt ?? ac.currentTime
  const len = Math.max(1, Math.floor(ac.sampleRate * d))
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buf
  const filt = ac.createBiquadFilter()
  filt.type = 'lowpass'
  filt.frequency.value = ff
  const gain = ac.createGain()
  gain.gain.setValueAtTime(v, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + d)
  src.connect(filt).connect(gain).connect(ac.destination)
  src.start(t)
  src.stop(t + d + 0.02)
}

const PATCHES = {
  // UI
  click:   ac => tone(ac, { freq: 520, dur: 0.04, vol: 0.05 }),
  tick:    ac => tone(ac, { freq: 880, dur: 0.05, vol: 0.06 }),
  select:  ac => {
    const t = ac.currentTime
    tone(ac, { freq: 440, dur: 0.05, vol: 0.055, startAt: t })
    tone(ac, { freq: 660, dur: 0.06, vol: 0.055, startAt: t + 0.04 })
  },
  confirm: ac => {
    const t = ac.currentTime
    tone(ac, { freq: 523, dur: 0.07, vol: 0.06, startAt: t,        pitchVar: 0 })
    tone(ac, { freq: 659, dur: 0.07, vol: 0.06, startAt: t + 0.07, pitchVar: 0 })
    tone(ac, { freq: 784, dur: 0.10, vol: 0.06, startAt: t + 0.14, pitchVar: 0 })
  },
  cancel:  ac => tone(ac, { freq: 330, dur: 0.12, vol: 0.05, slide: -120, type: 'square' }),

  // Combat
  swing:   ac => tone(ac, { freq: 520, dur: 0.08, vol: 0.06, type: 'sawtooth', slide: -320 }),
  throw:   ac => {
    noise(ac, { dur: 0.20, vol: 0.05, filterFreq: 900 })
    tone(ac, { freq: 340, dur: 0.18, vol: 0.04, type: 'sawtooth', slide: 200 })
  },
  hit:     ac => {
    noise(ac, { dur: 0.07, vol: 0.11, filterFreq: 1600 })
    tone(ac, { freq: 180, dur: 0.06, vol: 0.06, type: 'square', slide: -60 })
  },
  hurt:    ac => {
    noise(ac, { dur: 0.09, vol: 0.12, filterFreq: 500 })
    tone(ac, { freq: 160, dur: 0.14, vol: 0.05, type: 'sawtooth', slide: -60 })
  },
  counter: ac => tone(ac, { freq: 240, dur: 0.12, vol: 0.07, type: 'sawtooth', slide: -80 }),
  faint:   ac => {
    const t = ac.currentTime
    tone(ac, { freq: 440, dur: 0.10, vol: 0.06, startAt: t,        pitchVar: 0 })
    tone(ac, { freq: 330, dur: 0.10, vol: 0.06, startAt: t + 0.09, pitchVar: 0 })
    tone(ac, { freq: 220, dur: 0.20, vol: 0.06, startAt: t + 0.18, slide: -80, pitchVar: 0 })
  },
  finisher: ac => {
    tone(ac, { freq: 120, dur: 0.65, vol: 0.10, type: 'sawtooth', slide: 520 })
    noise(ac, { dur: 0.65, vol: 0.04, filterFreq: 1800 })
  },
  victory: ac => {
    const t = ac.currentTime
    tone(ac, { freq: 523,  dur: 0.12, vol: 0.07, startAt: t,        pitchVar: 0 })
    tone(ac, { freq: 659,  dur: 0.12, vol: 0.07, startAt: t + 0.11, pitchVar: 0 })
    tone(ac, { freq: 784,  dur: 0.12, vol: 0.07, startAt: t + 0.22, pitchVar: 0 })
    tone(ac, { freq: 1046, dur: 0.30, vol: 0.07, startAt: t + 0.33, pitchVar: 0 })
  },
}

export function sfx(name) {
  if (muted) return
  const patch = PATCHES[name]
  if (!patch) return
  const ac = getCtx()
  if (!ac) return
  try { patch(ac) } catch {}
}
