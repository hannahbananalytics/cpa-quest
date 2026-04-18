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
  const topics = SECTIONS[sect].topics
  const ed = new Date(edate)
  const today = new Date(); today.setHours(0,0,0,0)
  const dl = Math.max(1, Math.ceil((ed - today) / 86400000))
  const pool = []
  topics.forEach(t => { for (let i = 0; i < 3; i++) pool.push(t.n) })
  const revDays = Math.max(2, Math.round(dl * 0.12))
  const schedule = []
  for (let d = 0; d < dl; d++) {
    const dt = new Date(today); dt.setDate(today.getDate() + d)
    const isRev = d >= dl - revDays
    const isPrac = (d % 6 === 5) && !isRev
    const topic = isPrac ? 'MCQ Practice' : isRev ? 'Full Review' : pool[d % pool.length]
    const type = isPrac ? 'practice' : isRev ? 'review' : 'content'
    schedule.push({ day: d + 1, date: dt.toISOString(), topic, type, done: false })
  }
  return { schedule, bossMaxHp: Math.max(600, dl * 20), initialReadiness: Math.min(35, Math.round(bpct * 0.35)) }
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

