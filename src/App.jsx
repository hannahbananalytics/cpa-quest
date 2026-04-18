import { useState, useEffect, useRef, useCallback } from 'react'
import {
  TOPICS, TIER_LABELS, TIER_COLORS, CLASSES, BADGES,
  LEVEL_NAMES, LEVEL_XP, WHEEL_PRIZES,
} from './constants'
import TopBar from './components/TopBar'
import BossBar from './components/BossBar'
import SetupPanel from './components/SetupPanel'
import PlanPanel from './components/PlanPanel'
import ProgressPanel from './components/ProgressPanel'
import BadgesPanel from './components/BadgesPanel'
import WheelOverlay from './components/WheelOverlay'
import LevelUpOverlay from './components/LevelUpOverlay'
import Toast from './components/Toast'

const STORAGE_KEY = 'cpa-quest-v2'

function defaultState() {
  const def = new Date()
  def.setDate(def.getDate() + 60)
  return {
    plan: false,
    cls: -1,
    sect: 'FAR',
    edate: def.toISOString(),
    dhrs: 3,
    bpct: 0,
    mastery: {},
    schedule: [],
    activity: {},
    streak: 0,
    bestStreak: 0,
    sessions: 0,
    hrs: 0,
    readiness: 0,
    xp: 0,
    level: 1,
    bossHp: 1000,
    bossMaxHp: 1000,
    bossBattles: 0,
    earned: [],
    shield: 0,
    doubleXp: false,
    wheelSpins: 0,
    spinsUsed: 0,
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function computeLevel(xp) {
  let lv = 1
  for (let i = 0; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]) lv = i + 1
  }
  return lv
}

function xpBarPct(xp, level) {
  const cur = LEVEL_XP[level - 1] || 0
  const nxt = LEVEL_XP[level] ?? (LEVEL_XP[LEVEL_XP.length - 1] + 2000)
  return Math.round(((xp - cur) / (nxt - cur)) * 100)
}

function xpToNext(level) {
  return LEVEL_XP[level] ?? (LEVEL_XP[LEVEL_XP.length - 1] + 2000)
}

export default function App() {
  const [state, setState] = useState(() => loadState() || defaultState())
  const [activeTab, setActiveTab] = useState('setup')
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpNum, setLevelUpNum] = useState(1)
  const [showWheel, setShowWheel] = useState(false)

  const toastTimerRef = useRef(null)
  const prevLevelRef = useRef(state.level)

  // Persist to localStorage on every state change
  useEffect(() => {
    saveState(state)
  }, [state])

  // Level-up detection
  useEffect(() => {
    if (state.level > prevLevelRef.current) {
      setLevelUpNum(state.level)
      setShowLevelUp(true)
    }
    prevLevelRef.current = state.level
  }, [state.level])

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    setToastVisible(true)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2800)
  }, [])

  // ── Game logic ──────────────────────────────────────────────────

  function addXP(amount, msg) {
    setState(prev => {
      const newXp = prev.xp + amount
      const newLevel = computeLevel(newXp)
      return { ...prev, xp: newXp, level: newLevel }
    })
    // Show toast only if no level-up (level-up overlay takes precedence)
    // We check synchronously against current state for the toast decision
    const newXp = state.xp + amount
    const newLevel = computeLevel(newXp)
    if (newLevel <= state.level && msg) showToast(msg)
  }

  function pickClass(i) {
    setState(prev => ({ ...prev, cls: i }))
    showToast(CLASSES[i].name + ' selected!')
  }

  function bumpTier(idx, dir) {
    setState(prev => {
      const cur = prev.mastery[idx] || 0
      const nxt = Math.max(0, Math.min(4, cur + dir))
      return { ...prev, mastery: { ...prev.mastery, [idx]: nxt } }
    })
  }

  function generate({ sect, edate, dhrs, bpct }) {
    if (!edate) { showToast('Pick your exam date!'); return }
    if (state.cls < 0) { showToast('Choose a class first!'); return }
    const ed = new Date(edate)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const dl = Math.ceil((ed - today) / 86400000)
    if (dl <= 0) { showToast('Exam date must be in the future!'); return }

    const topics = TOPICS[sect]
    const mastery = state.mastery
    let pool = []
    topics.forEach((t, i) => {
      const m = mastery[i] || 0
      const wt = m <= 1 ? 3 : m <= 2 ? 2 : 1
      for (let x = 0; x < wt; x++) pool.push(t.n)
    })
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

    const bossMaxHp = dl * 20
    const initialReadiness = Math.min(35, Math.round(bpct * 0.35))

    setState(prev => ({
      ...prev,
      plan: true,
      sect,
      edate,
      dhrs: parseInt(dhrs) || 3,
      bpct: parseInt(bpct) || 0,
      schedule,
      bossMaxHp,
      bossHp: bossMaxHp,
      readiness: initialReadiness,
    }))

    // XP + badge for plan creation (done after setState via a slight delay to read updated state)
    setTimeout(() => {
      setState(prev => {
        const newXp = prev.xp + 100
        const newLevel = computeLevel(newXp)
        const earned = prev.earned.includes('start') ? prev.earned : [...prev.earned, 'start']
        return { ...prev, xp: newXp, level: newLevel, earned }
      })
      showToast('Plan created! +100 XP')
    }, 0)

    setActiveTab('plan')
  }

  function logDay() {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const key = today.toISOString().slice(0, 10)
    if (state.activity[key] === 'done') { showToast('Already logged today!'); return }

    setState(prev => {
      const activity = { ...prev.activity, [key]: 'done' }
      const sessions = prev.sessions + 1
      const hrs = prev.hrs + prev.dhrs

      const yk = new Date(today); yk.setDate(today.getDate() - 1)
      const ykey = yk.toISOString().slice(0, 10)
      const streak = (prev.activity[ykey] === 'done' || sessions === 1)
        ? prev.streak + 1
        : 1
      const bestStreak = Math.max(streak, prev.bestStreak)

      let base = 50 + streak * 10
      if (prev.cls === 0) base = Math.round(base * 1.2)
      if (prev.cls === 2) base = Math.round(base * (1 + streak * 0.05))
      let doubleXp = prev.doubleXp
      if (doubleXp) { base *= 2; doubleXp = false }

      const readiness = Math.min(100, prev.readiness + Math.round(80 / Math.max(prev.schedule.length, 30)))
      const dmg = prev.cls === 1 ? 40 : 20
      const bossHp = Math.max(0, prev.bossHp - dmg)
      const wheelSpins = sessions % 5 === 0 ? prev.wheelSpins + 1 : prev.wheelSpins

      const newXp = prev.xp + base
      const newLevel = computeLevel(newXp)

      // Badge checks
      const newEarned = [...prev.earned]
      const addBadge = (id) => { if (!newEarned.includes(id)) newEarned.push(id) }
      if (sessions >= 1) addBadge('log1')
      if (sessions >= 5) addBadge('log5')
      if (streak >= 3) addBadge('s3')
      if (streak >= 7) addBadge('s7')
      if (hrs >= 10) addBadge('hrs10')

      // Random mastery upgrade
      const mastery = { ...prev.mastery }
      TOPICS[prev.sect].forEach((_, i) => {
        const cur = mastery[i] || 0
        if (cur < 4 && Math.random() < 0.25) {
          mastery[i] = Math.min(4, cur + 1)
          if (mastery[i] >= 3) addBadge('gold1')
          if (mastery[i] >= 4) addBadge('plat1')
        }
      })

      return {
        ...prev,
        activity, sessions, hrs, streak, bestStreak,
        readiness, bossHp, wheelSpins, doubleXp,
        mastery,
        xp: newXp, level: newLevel,
        earned: newEarned,
      }
    })

    const base = 50 + state.streak * 10
    showToast('Session logged! +' + (state.cls === 0 ? Math.round(base * 1.2) : base) + ' XP')
  }

  function bossBattle() {
    const score = Math.floor(Math.random() * 40) + 55
    const win = score >= 70
    const dmg = win ? 80 : 30
    const xpGain = win ? 200 : 80

    setState(prev => {
      const bossHp = Math.max(0, prev.bossHp - dmg)
      const readiness = Math.min(100, prev.readiness + Math.round(win ? 5 : 2))
      const newXp = prev.xp + xpGain
      const newLevel = computeLevel(newXp)
      const newEarned = [...prev.earned]
      if (!newEarned.includes('boss1')) newEarned.push('boss1')
      if (readiness >= 50 && !newEarned.includes('half')) newEarned.push('half')
      if (readiness >= 80 && !newEarned.includes('ready')) newEarned.push('ready')
      return {
        ...prev,
        bossHp, readiness,
        bossBattles: prev.bossBattles + 1,
        xp: newXp, level: newLevel,
        earned: newEarned,
      }
    })

    showToast('Boss battle: ' + score + '/100! ' + (win ? 'VICTORY!' : 'Keep fighting!'))
    if (win && state.bossHp - dmg <= 0) setTimeout(() => showToast('BOSS DEFEATED! The exam has been slain!'), 500)
  }

  function applyPrize(prize) {
    setState(prev => {
      let next = { ...prev, spinsUsed: prev.spinsUsed + 1, wheelSpins: prev.wheelSpins - 1 }
      const newEarned = [...prev.earned]
      if (!newEarned.includes('spin1')) newEarned.push('spin1')
      next.earned = newEarned

      if (prize.type === 'xp') {
        next.xp = prev.xp + prize.val
        next.level = computeLevel(next.xp)
      } else if (prize.type === 'shield') {
        next.shield = prev.shield + 1
      } else if (prize.type === 'bossdmg') {
        next.bossHp = Math.max(0, prev.bossHp - prev.bossMaxHp * 0.1)
      } else if (prize.type === '2xp') {
        next.doubleXp = true
      } else if (prize.type === 'boost') {
        const keys = Object.keys(prev.mastery)
        if (keys.length) {
          const k = keys[Math.floor(Math.random() * keys.length)]
          next.mastery = { ...prev.mastery, [k]: Math.min(4, (prev.mastery[k] || 0) + 1) }
        }
      }
      return next
    })

    const msgs = {
      xp: 'Loot: +' + prize.val + ' XP!',
      shield: 'Streak Shield earned!',
      bossdmg: 'Boss took 10% damage!',
      '2xp': '2x XP active for next session!',
      boost: 'Random topic boosted!',
    }
    showToast(msgs[prize.type] || 'Prize collected!')
  }

  // ── Derived values ────────────────────────────────────────────────

  const pct = xpBarPct(state.xp, state.level)
  const nextXp = xpToNext(state.level)
  const bossHpPct = Math.max(0, Math.round((state.bossHp / state.bossMaxHp) * 100))
  const bossColor = bossHpPct > 60 ? '#e24b4a' : bossHpPct > 30 ? '#ef9f27' : '#639922'
  const bossRage = bossHpPct > 60 ? 'ENRAGED' : bossHpPct > 30 ? 'WEAKENED' : 'NEAR DEFEAT!'
  const bossIcon = bossHpPct > 60 ? '👹' : bossHpPct > 30 ? '😤' : '💀'

  const tabs = ['setup', 'plan', 'progress', 'badges']

  return (
    <div className="min-h-screen bg-[#080710]">
      <div className="app wrapper w-full">
        <TopBar
          xp={state.xp}
          level={state.level}
          xpPct={pct}
          nextXp={nextXp}
        />

        <BossBar
          bossName={'THE CPA EXAM BOSS — ' + state.sect}
          bossIcon={bossIcon}
          bossHp={state.bossHp}
          bossMaxHp={state.bossMaxHp}
          bossHpPct={bossHpPct}
          bossColor={bossColor}
          bossRage={bossRage}
        />

        <nav className="nav">
          {tabs.map((t, i) => (
            <button
              key={t}
              className={'ntab' + (activeTab === t ? ' on' : '')}
              onClick={() => setActiveTab(t)}
            >
              {['Setup', 'Plan', 'Progress', 'Badges'][i]}
            </button>
          ))}
        </nav>

        <SetupPanel
          active={activeTab === 'setup'}
          cls={state.cls}
          sect={state.sect}
          edate={state.edate}
          dhrs={state.dhrs}
          bpct={state.bpct}
          mastery={state.mastery}
          onPickClass={pickClass}
          onBumpTier={bumpTier}
          onGenerate={generate}
          onSectChange={(sect) => setState(prev => ({ ...prev, sect, mastery: {} }))}
        />

        <PlanPanel
          active={activeTab === 'plan'}
          plan={state.plan}
          sect={state.sect}
          edate={state.edate}
          dhrs={state.dhrs}
          schedule={state.schedule}
          readiness={state.readiness}
        />

        <ProgressPanel
          active={activeTab === 'progress'}
          plan={state.plan}
          sessions={state.sessions}
          hrs={state.hrs}
          streak={state.streak}
          activity={state.activity}
          mastery={state.mastery}
          sect={state.sect}
          wheelSpins={state.wheelSpins}
          onLogDay={logDay}
          onBossBattle={bossBattle}
          onOpenWheel={() => {
            if (state.wheelSpins <= 0) { showToast('No spins available yet!'); return }
            setShowWheel(true)
          }}
        />

        <BadgesPanel
          active={activeTab === 'badges'}
          streak={state.streak}
          bestStreak={state.bestStreak}
          xp={state.xp}
          earned={state.earned}
        />

        {showWheel && (
          <WheelOverlay
            wheelSpins={state.wheelSpins}
            onClose={() => setShowWheel(false)}
            onPrize={applyPrize}
          />
        )}

        {showLevelUp && (
          <LevelUpOverlay
            level={levelUpNum}
            levelName={LEVEL_NAMES[levelUpNum - 1] || 'CPA Legend'}
            onClose={() => setShowLevelUp(false)}
          />
        )}

        <Toast visible={toastVisible} msg={toastMsg} />
      </div>
    </div>
  )
}
