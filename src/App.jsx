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

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x }

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

  function loadDemo(kind) {
    const base = defaultState()
    const hero = {
      name: 'ALEX', avatar: '🧙‍♂️', clsId: 'grinder', title: 'The Debit Destroyer', weaponId: 'pencil',
      level: 1, xp: 0, hp: 100, maxHp: 100,
    }
    if (kind === 'fresh') {
      const { schedule, bossMaxHp } = buildSchedule('FAR', addDays(new Date(), 60).toISOString().slice(0,10), 3, 0)
      setState({ ...base, phase: 'dashboard', hero, sect: 'FAR', edate: addDays(new Date(),60).toISOString(), dhrs: 3, bpct: 0, schedule, bossMaxHp, bossHp: bossMaxHp, readiness: 5, plan: true, earned: ['start'] })
    } else if (kind === 'mid') {
      const { schedule, bossMaxHp } = buildSchedule('REG', addDays(new Date(), 45).toISOString().slice(0,10), 4, 30)
      const done = schedule.map((s,i) => i < 8 ? {...s, done: true} : s)
      const act = {}
      for (let i = 0; i < 8; i++) act[addDays(new Date(), -i).toISOString().slice(0,10)] = 'done'
      setState({ ...base, phase: 'dashboard',
        hero: { ...hero, name: 'LUNA', avatar: '🧙‍♀️', clsId: 'strategist', title: 'The Tax Tempest', weaponId: 'calc', level: 3, xp: 1100, hp: 85, maxHp: 100 },
        sect: 'REG', edate: addDays(new Date(),45).toISOString(), dhrs: 4, bpct: 30,
        schedule: done, bossMaxHp, bossHp: Math.round(bossMaxHp * 0.55),
        readiness: 48, plan: true, sessions: 8, hrs: 32, streak: 6, bestStreak: 6, kills: 12,
        mastery: { 0: 2, 1: 3, 2: 1 },
        earned: ['start','log1','log5','s3','s7','hrs10','mini1','gold1'], activity: act,
      })
    } else {
      const { schedule, bossMaxHp } = buildSchedule('AUD', addDays(new Date(), 7).toISOString().slice(0,10), 5, 85)
      const done = schedule.map((s,i) => i < schedule.length - 4 ? {...s, done: true} : s)
      const act = {}
      for (let i = 0; i < 20; i++) act[addDays(new Date(), -i).toISOString().slice(0,10)] = 'done'
      setState({ ...base, phase: 'dashboard',
        hero: { ...hero, name: 'REX', avatar: '🦸', clsId: 'clutch', title: 'The Audit Ace', weaponId: 'laptop', level: 6, xp: 5500, hp: 95, maxHp: 100 },
        sect: 'AUD', edate: addDays(new Date(),7).toISOString(), dhrs: 5, bpct: 85,
        schedule: done, bossMaxHp, bossHp: Math.round(bossMaxHp * 0.2),
        readiness: 86, plan: true, sessions: 20, hrs: 85, streak: 14, bestStreak: 14, kills: 32,
        mastery: { 0: 4, 1: 3, 2: 4, 3: 3 },
        earned: ['start','log1','log5','s3','s7','hrs10','mini1','gold1','half','ready','mob10'], activity: act,
      })
    }
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
        {crtOn && <CRTOverlay />}
        {view}
      </div>

      <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 700 }}>
        {state.hero && (
          <button className="px-btn sm ghost" onClick={() => setState(p => ({ ...p, phase: 'creator' }))}>◀ HERO</button>
        )}
        <button className="px-btn sm ghost" onClick={() => setTweaksOpen(v => !v)}>⚙ TWEAKS</button>
        <button className="px-btn sm ghost" onClick={reset}>RESET</button>
      </div>

      {tweaksOpen && (
        <div className="tweak-panel">
          <h4>TWEAKS</h4>
          <div className="tweak-row">
            <label>CRT SCANLINES</label>
            <button className="px-btn sm" onClick={() => setCrtOn(c => !c)}>{crtOn ? 'ON' : 'OFF'}</button>
          </div>
          <div className="tweak-row">
            <label>DEMO STATE</label>
            <div className="grid-3" style={{ gap: 4 }}>
              <button className="px-btn sm sky" onClick={() => loadDemo('fresh')}>FRESH</button>
              <button className="px-btn sm" onClick={() => loadDemo('mid')}>MID</button>
              <button className="px-btn sm blood" onClick={() => loadDemo('near')}>NEAR</button>
            </div>
          </div>
          <div className="tweak-row">
            <label>JUMP TO</label>
            <div className="grid-2" style={{ gap: 4 }}>
              <button className="px-btn sm ghost" onClick={() => setState(p => ({ ...p, phase: 'creator' }))}>HERO</button>
              <button className="px-btn sm ghost" onClick={() => state.hero && setState(p => ({ ...p, phase: 'section' }))} disabled={!state.hero}>SECTION</button>
            </div>
          </div>
          <div className="tweak-row">
            <label>SECTION (swap boss)</label>
            <select className="px-select" style={{ fontSize: 16, padding: 6 }}
                    value={state.sect}
                    onChange={e => {
                      const sect = e.target.value
                      setState(p => ({ ...p, sect, bossHp: p.bossMaxHp }))
                    }}>
              {Object.keys(SECTIONS).map(k => <option key={k} value={k}>{k} — {SECTIONS[k].boss.name}</option>)}
            </select>
          </div>
          <div className="tiny mt-12">Close Tweaks in toolbar to hide.</div>
        </div>
      )}

      <div className={'toast' + (toastOn ? ' show' : '')}>{toastMsg}</div>
    </div>
  )
}

function CRTOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 950,
      background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 1px, transparent 1px 3px)',
      mixBlendMode: 'multiply',
    }} />
  )
}
