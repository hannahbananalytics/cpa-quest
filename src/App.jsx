import { useState, useEffect, useRef, useCallback } from 'react'
import CharacterCreator from './components/CharacterCreator.jsx'
import SectionPicker from './components/SectionPicker.jsx'
import Dashboard from './components/Dashboard.jsx'
import { SECTIONS } from './constants.js'
import { sfx, isMuted as isSfxMuted, setMuted as setSfxMuted } from './sfx.js'

const STORAGE_KEY = 'cpa-quest-8bit-v1'

function defaultState() {
  return {
    phase: 'creator',
    hero: null,
    sect: 'FAR',
    edate: null,
    dhrs: 3,
    plan: false,
    schedule: [],
    activity: {},
    mastery: {},
    streak: 0,
    bestStreak: 0,
    sessions: 0,
    hrs: 0,
    kills: 0,
    readiness: 0,
    earned: [],
    bossHp: 1000,
    bossMaxHp: 1000,
    mobState: null,
    mobBank: {},
    startDate: null,
    xpMult: 1,
    focusIdx: null,
  }
}

function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null }
  catch { return null }
}
function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {} }

// Quests are sequenced, not date-stamped.
// Exam date is only used to derive total slot count and pacing — not attached to individual quests.
// One MCQ / TBS Practice quest is inserted after each topic block (not frequency-based).
function buildSchedule(sect, edate, dhrs) {
  const sectInfo = SECTIONS[sect]
  const topics = sectInfo.topics
  const today = new Date(); today.setHours(0,0,0,0)
  const dlyHrs = Math.max(1, Number(dhrs) || 3)

  const midHrs = (sectInfo.minHrs + sectInfo.maxHrs) / 2
  const recommendedDays = Math.round(midHrs / dlyHrs)

  const dl = edate
    ? Math.max(topics.length + 3, Math.ceil((new Date(edate) - today) / 86400000))
    : recommendedDays

  // Last 12% of slots (min 3) are full-review quests
  const revCount = Math.max(3, Math.round(dl * 0.12))
  const contentSlots = dl - revCount
  const slotsPerTopic = Math.max(1, Math.floor(contentSlots / topics.length))

  const schedule = []

  for (let t = 0; t < topics.length; t++) {
    const topic = topics[t]
    const isLast = t === topics.length - 1
    // Last topic absorbs any leftover content slots
    const slots = isLast
      ? Math.max(1, contentSlots - t * slotsPerTopic)
      : slotsPerTopic

    // Content quests for this topic
    for (let i = 0; i < slots; i++) {
      schedule.push({ topic: topic.n, type: 'content', done: false })
    }
    // One MCQ / TBS Practice checkpoint after each topic block
    schedule.push({ topic: 'MCQ / TBS Practice', type: 'practice', done: false })
  }

  // Append full-review block
  for (let r = 0; r < revCount; r++) {
    schedule.push({ topic: 'Full Review', type: 'review', done: false })
  }

  return {
    schedule,
    bossMaxHp: Math.max(600, schedule.length * 20),
    recommendedDays,
    startDate: today.toISOString(),
  }
}

export default function App() {
  const [state, setState] = useState(() => loadState() || defaultState())
  const [toastMsg, setToastMsg] = useState('')
  const [toastOn, setToastOn] = useState(false)
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [crtOn, setCrtOn] = useState(true)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  // Bumped on every reset so the setup-stage components (which hold their
  // own wizard step in local state) remount and clear their selections.
  const [resetNonce, setResetNonce] = useState(0)
  const [sfxOff, setSfxOff] = useState(() => isSfxMuted())
  const toastRef = useRef()

  useEffect(() => { saveState(state) }, [state])

  const showToast = useCallback((msg) => {
    setToastMsg(msg); setToastOn(true)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToastOn(false), 2400)
  }, [])

  useEffect(() => {
    function onMsg(e) {
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type === '__activate_edit_mode') setTweaksOpen(true)
      if (e.data.type === '__deactivate_edit_mode') setTweaksOpen(false)
    }
    window.addEventListener('message', onMsg)
    window.parent.postMessage({ type: '__edit_mode_available' }, '*')
    return () => window.removeEventListener('message', onMsg)
  }, [])

  function onHeroComplete(hero) {
    setState(p => ({
      ...p,
      hero: { ...hero, level: 1, xp: 0, hp: 100, maxHp: 100 },
      phase: 'section',
    }))
  }

  function onSectionComplete({ sect, edate, dhrs }) {
    const { schedule, bossMaxHp, startDate } = buildSchedule(sect, edate, dhrs)
    setState(p => ({
      ...p,
      sect, edate, dhrs,
      schedule, bossMaxHp, bossHp: bossMaxHp,
      startDate,
      readiness: 0,
      plan: true,
      phase: 'dashboard',
      earned: p.earned.includes('start') ? p.earned : [...p.earned, 'start'],
    }))
  }

  function reset() { setResetConfirmOpen(true) }

  function confirmReset() {
    localStorage.removeItem(STORAGE_KEY)
    setState(defaultState())
    setResetConfirmOpen(false)
    setResetNonce(n => n + 1)
  }

  let view
  if (!state.hero || state.phase === 'creator') {
    view = <CharacterCreator key={'creator-' + resetNonce} onComplete={onHeroComplete} />
  } else if (state.phase === 'section' || !state.plan) {
    view = <SectionPicker key={'section-' + resetNonce} hero={state.hero} onComplete={onSectionComplete} />
  } else {
    view = (
      <Dashboard
        state={state}
        setState={setState}
        showToast={showToast}
        onOpenSettings={() => setTweaksOpen(v => !v)}
        onReset={reset}
      />
    )
  }

  const showFloatingNav = !state.hero || state.phase === 'creator' || state.phase === 'section' || !state.plan

  return (
    <div className={crtOn ? '' : 'no-crt'}>
      <div style={{ position: 'relative' }}>
        {view}
      </div>

      {showFloatingNav && (
        <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 700 }}>
          <button className="px-btn sm ghost" onClick={() => { sfx('click'); setTweaksOpen(v => !v) }}>⚙ SETTINGS</button>
          <button className="px-btn sm ghost" onClick={() => { sfx('click'); reset() }}>RESET</button>
        </div>
      )}

      {tweaksOpen && (
        <div className="tweak-panel">
          <h4>SETTINGS</h4>
          <div className="tweak-row">
            <label>CRT SCANLINES</label>
            <button className="px-btn sm" onClick={() => { sfx('click'); setCrtOn(c => !c) }}>{crtOn ? 'ON' : 'OFF'}</button>
          </div>
          <div className="tweak-row">
            <label>SOUND EFFECTS</label>
            <button className="px-btn sm" onClick={() => {
              const next = !sfxOff
              setSfxMuted(next)
              setSfxOff(next)
              if (!next) sfx('click')
            }}>{sfxOff ? 'OFF' : 'ON'}</button>
          </div>
        </div>
      )}

      {resetConfirmOpen && (
        <div className="overlay" onClick={() => setResetConfirmOpen(false)}>
          <div
            className="px-panel"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 460, width: '100%', padding: '22px 26px', textAlign: 'center' }}
          >
            <div className="ps" style={{ fontSize: 14, color: 'var(--blood)', marginBottom: 16 }}>
              ⚠ RESET QUEST?
            </div>
            <div style={{ fontSize: 20, color: 'var(--bone)', marginBottom: 20, lineHeight: 1.3 }}>
              All progress will be lost.<br />
              Your hero, schedule, streaks, and badges will be erased.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="px-btn ghost" onClick={() => { sfx('cancel'); setResetConfirmOpen(false) }}>◀ CANCEL</button>
              <button className="px-btn blood" onClick={() => { sfx('confirm'); confirmReset() }}>☠ RESET</button>
            </div>
          </div>
        </div>
      )}

      <div className={'toast' + (toastOn ? ' show' : '')}>{toastMsg}</div>
    </div>
  )
}
