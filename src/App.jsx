import { useState, useEffect, useRef, useCallback } from 'react'
import CharacterCreator from './components/CharacterCreator.jsx'
import SectionPicker from './components/SectionPicker.jsx'
import Dashboard from './components/Dashboard.jsx'
import { SECTIONS } from './constants.js'

const STORAGE_KEY = 'cpa-quest-8bit-v1'

function defaultState() {
  return {
    phase: 'creator',
    hero: null,
    sect: 'FAR',
    edate: null,
    dhrs: 3,
    bpct: 0,
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
    xpMult: 1,
  }
}

function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null }
  catch { return null }
}
function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {} }

function buildSchedule(sect, edate, dhrs, bpct) {
  const sectInfo = SECTIONS[sect]
  const topics = sectInfo.topics
  const ed = new Date(edate)
  const today = new Date(); today.setHours(0,0,0,0)
  const dlyHrs = Math.max(1, Number(dhrs) || 3)

  // Recommended days based on baseline hours (midpoint of range)
  const midHrs = (sectInfo.minHrs + sectInfo.maxHrs) / 2
  const recommendedDays = Math.round(midHrs / dlyHrs)

  // Use exam date if provided, otherwise fall back to recommended
  const rawDays = edate ? Math.max(topics.length + 3, Math.ceil((ed - today) / 86400000)) : recommendedDays
  const dl = rawDays

  // Reserve last 12% (min 3) for full review
  const revDays = Math.max(3, Math.round(dl * 0.12))
  const contentDays = dl - revDays

  // Distribute content days evenly across topics (block schedule: finish one before starting next)
  const daysPerTopic = Math.max(1, Math.floor(contentDays / topics.length))

  const schedule = []
  let dayIdx = 0

  for (let t = 0; t < topics.length; t++) {
    const topic = topics[t]
    // Last topic absorbs any leftover days so we don't overshoot contentDays
    const days = t === topics.length - 1 ? (contentDays - dayIdx) : daysPerTopic
    for (let i = 0; i < days && dayIdx < contentDays; i++) {
      const dt = new Date(today); dt.setDate(today.getDate() + dayIdx)
      const isPrac = (dayIdx % 6 === 5)
      schedule.push({
        day: dayIdx + 1,
        date: dt.toISOString(),
        topic: isPrac ? 'MCQ Practice' : topic.n,
        type: isPrac ? 'practice' : 'content',
        done: false,
      })
      dayIdx++
    }
  }

  // Full review block at the end
  for (let r = 0; r < revDays; r++) {
    const dt = new Date(today); dt.setDate(today.getDate() + dayIdx)
    schedule.push({ day: dayIdx + 1, date: dt.toISOString(), topic: 'Full Review', type: 'review', done: false })
    dayIdx++
  }

  return {
    schedule,
    bossMaxHp: Math.max(600, dl * 20),
    initialReadiness: Math.min(35, Math.round(bpct * 0.35)),
    recommendedDays,
  }
}

export default function App() {
  const [state, setState] = useState(() => loadState() || defaultState())
  const [toastMsg, setToastMsg] = useState('')
  const [toastOn, setToastOn] = useState(false)
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [crtOn, setCrtOn] = useState(true)
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

  function onSectionComplete({ sect, edate, dhrs, bpct }) {
    const { schedule, bossMaxHp, initialReadiness } = buildSchedule(sect, edate, dhrs, bpct)
    setState(p => ({
      ...p,
      sect, edate, dhrs, bpct,
      schedule, bossMaxHp, bossHp: bossMaxHp,
      readiness: initialReadiness,
      plan: true,
      phase: 'dashboard',
      earned: p.earned.includes('start') ? p.earned : [...p.earned, 'start'],
    }))
  }

  function reset() {
    if (!confirm('Reset all progress and start over?')) return
    localStorage.removeItem(STORAGE_KEY)
    setState(defaultState())
  }

  let view
  if (!state.hero || state.phase === 'creator') {
    view = <CharacterCreator onComplete={onHeroComplete} />
  } else if (state.phase === 'section' || !state.plan) {
    view = <SectionPicker hero={state.hero} onComplete={onSectionComplete} />
  } else {
    view = <Dashboard state={state} setState={setState} showToast={showToast} />
  }

  return (
    <div className={crtOn ? '' : 'no-crt'}>
      <div style={{ position: 'relative' }}>
        {view}
      </div>

      <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 700 }}>
        <button className="px-btn sm ghost" onClick={() => setTweaksOpen(v => !v)}>⚙ SETTINGS</button>
        <button className="px-btn sm ghost" onClick={reset}>RESET</button>
      </div>

      {tweaksOpen && (
        <div className="tweak-panel">
          <h4>SETTINGS</h4>
          <div className="tweak-row">
            <label>CRT SCANLINES</label>
            <button className="px-btn sm" onClick={() => setCrtOn(c => !c)}>{crtOn ? 'ON' : 'OFF'}</button>
          </div>
        </div>
      )}

      <div className={'toast' + (toastOn ? ' show' : '')}>{toastMsg}</div>
    </div>
  )
}

