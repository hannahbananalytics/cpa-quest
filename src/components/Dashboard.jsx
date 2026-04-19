import { useState, useEffect, useRef, useMemo } from 'react'
import BattleArena from './BattleArena.jsx'
import {
  SECTIONS, CLASSES, WEAPONS, BADGES, LEVEL_NAMES,
  computeLevel, xpPct, xpToNext,
} from '../constants.js'

function todayKey() { return new Date().toISOString().slice(0, 10) }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d }
async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

export default function Dashboard({ state, setState, showToast }) {
  const { hero, sect, schedule, mobState } = state
  const sectData = SECTIONS[sect]
  const boss = sectData.boss

  const [tab, setTab] = useState('quests')
  const [battlePhase, setBattlePhase] = useState('idle')
  const [battleMsg, setBattleMsg] = useState('')
  const [lastDmgHero, setLastDmgHero] = useState(0)
  const [lastDmgMob, setLastDmgMob] = useState(0)

  const tk = todayKey()
  const todayIdx = schedule.findIndex(s => s.date.slice(0, 10) === tk)
  const todayQuest = todayIdx >= 0 ? schedule[todayIdx] : schedule.find(s => !s.done)

  const currentMob = useMemo(() => {
    if (mobState && mobState.mobHp > 0) return mobState
    if (!todayQuest) return null
    const topicIdx = sectData.topics.findIndex(t => t.n === todayQuest.topic)
    const topic = topicIdx >= 0 ? sectData.topics[topicIdx] : sectData.topics[0]
    const isMiniBoss = todayQuest.day % 7 === 0
    const maxHp = isMiniBoss ? 180 : 60 + Math.floor(Math.random() * 40)
    return {
      topicIdx: topicIdx >= 0 ? topicIdx : 0,
      mob: isMiniBoss ? '👺' : topic.mob,
      mobName: isMiniBoss ? (topic.n + ' MINI-BOSS') : topic.mobName,
      level: Math.max(1, hero.level + (isMiniBoss ? 2 : 0)),
      isMiniBoss,
      mobMaxHp: maxHp,
      mobHp: maxHp,
      lastDmg: 0,
    }
  }, [mobState, todayQuest, sect, hero.level, sectData.topics])

  useEffect(() => {
    if (!mobState && currentMob) {
      setState(p => ({ ...p, mobState: currentMob }))
    }
  }, [currentMob, mobState, setState])

  useEffect(() => {
    setBattleMsg(`A wild ${currentMob?.mobName || 'mob'} appears!`)
  }, [currentMob?.mobName])

  const attacking = useRef(false)
  async function attack(isComplete = false) {
    if (attacking.current || !currentMob || currentMob.mobHp <= 0) return
    attacking.current = true

    const crit = Math.random() < (hero.clsId === 'clutch' ? 0.25 : 0.1)
    const base = hero.clsId === 'strategist' ? 28 : 22
    const dmg = Math.floor(base + Math.random() * 12) * (crit ? 2 : 1)
    setLastDmgMob(dmg)

    setBattleMsg(`${hero.name} attacks! ${crit ? 'CRITICAL HIT!' : ''}`)
    setBattlePhase('hero-attack')
    await wait(450)
    setBattlePhase('hit-foe')
    setState(p => ({ ...p, mobState: { ...p.mobState, mobHp: Math.max(0, p.mobState.mobHp - dmg), lastDmg: dmg } }))
    await wait(500)

    const newHp = Math.max(0, currentMob.mobHp - dmg)
    if (newHp <= 0) {
      setBattleMsg(`${currentMob.mobName} was defeated! +${currentMob.isMiniBoss ? 150 : 60} XP`)
      setBattlePhase('faint-foe')
      await wait(700)
      setState(p => {
        const gain = p.mobState.isMiniBoss ? 150 : 60
        const newXp = p.hero.xp + gain
        const newLv = computeLevel(newXp)
        const newBossHp = Math.max(0, p.bossHp - (p.mobState.isMiniBoss ? 180 : 60))
        const newKills = p.kills + 1
        const newEarned = [...p.earned]
        if (!newEarned.includes('log1') && isComplete) newEarned.push('log1')
        if (newKills >= 10 && !newEarned.includes('mob10')) newEarned.push('mob10')
        if (p.mobState.isMiniBoss && !newEarned.includes('mini1')) newEarned.push('mini1')
        return {
          ...p,
          hero: { ...p.hero, xp: newXp, level: newLv },
          bossHp: newBossHp,
          kills: newKills,
          earned: newEarned,
          mobState: null,
        }
      })
      setBattlePhase('idle')
    } else {
      await wait(250)
      const foeDmg = Math.floor(8 + Math.random() * 8)
      setLastDmgHero(foeDmg)
      setBattleMsg(`${currentMob.mobName} strikes back!`)
      setBattlePhase('foe-attack')
      await wait(450)
      setBattlePhase('hit-hero')
      setState(p => ({
        ...p,
        hero: { ...p.hero, hp: Math.max(0, p.hero.hp - foeDmg), lastDmg: foeDmg },
      }))
      await wait(500)
      setBattlePhase('idle')
      setBattleMsg(`What will ${hero.name} do?`)
    }
    attacking.current = false
  }

  function completeQuest(idx) {
    if (schedule[idx].done) return
    setState(p => {
      const newSchedule = p.schedule.map((s, i) => i === idx ? { ...s, done: true } : s)
      const sessions = p.sessions + 1
      const hrs = p.hrs + p.dhrs
      const yk = addDays(new Date(), -1).toISOString().slice(0, 10)
      const streak = (p.activity[yk] === 'done' || sessions === 1) ? p.streak + 1 : 1
      const bestStreak = Math.max(streak, p.bestStreak)
      const readiness = Math.min(100, p.readiness + Math.round(80 / Math.max(p.schedule.length, 30)))
      const newActivity = { ...p.activity, [todayKey()]: 'done' }

      let xpGain = 80 + streak * 10
      if (p.hero.clsId === 'grinder') xpGain = Math.round(xpGain * 1.2)
      const newXp = p.hero.xp + xpGain
      const newLv = computeLevel(newXp)
      const newHp = Math.min(p.hero.maxHp, p.hero.hp + 10)

      const earned = [...p.earned]
      if (!earned.includes('log1')) earned.push('log1')
      if (sessions >= 5 && !earned.includes('log5')) earned.push('log5')
      if (streak >= 3 && !earned.includes('s3')) earned.push('s3')
      if (streak >= 7 && !earned.includes('s7')) earned.push('s7')
      if (hrs >= 10 && !earned.includes('hrs10')) earned.push('hrs10')
      if (readiness >= 50 && !earned.includes('half')) earned.push('half')
      if (readiness >= 80 && !earned.includes('ready')) earned.push('ready')

      return {
        ...p,
        schedule: newSchedule, sessions, hrs, streak, bestStreak, readiness,
        activity: newActivity,
        hero: { ...p.hero, xp: newXp, level: newLv, hp: newHp },
        earned,
      }
    })
    showToast('QUEST COMPLETE! +XP  +HP')
    setTimeout(() => attack(true), 350)
  }

  function bossBattle() {
    if (state.bossHp <= 0) { showToast('Boss already slain!'); return }
    if (state.readiness < 80) { showToast('Need 80% readiness to challenge boss!'); return }
    setState(p => {
      const newBossHp = Math.max(0, p.bossHp - 300)
      const earned = [...p.earned]
      if (newBossHp <= 0 && !earned.includes('boss1')) earned.push('boss1')
      return {
        ...p, bossHp: newBossHp, earned,
        hero: { ...p.hero, xp: p.hero.xp + 500, level: computeLevel(p.hero.xp + 500) },
      }
    })
    showToast('MASSIVE HIT! Boss -300 HP')
  }

  const bossPct = Math.max(0, Math.round((state.bossHp / state.bossMaxHp) * 100))
  const mobForArena = currentMob ? { ...currentMob, lastDmg: lastDmgMob } : null

  return (
    <div className="app-wrap crt">
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <TopHud hero={hero} state={state} />
        <BossBar boss={boss} sectData={sectData} bossHp={state.bossHp} bossMaxHp={state.bossMaxHp} bossPct={bossPct} />

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            {mobForArena
              ? <BattleArena
                  hero={{ ...hero, lastDmg: lastDmgHero, xpPct: xpPct(hero.xp, hero.level) }}
                  mob={mobForArena}
                  heroHp={hero.hp} heroMaxHp={hero.maxHp}
                  mobHp={mobForArena.mobHp} mobMaxHp={mobForArena.mobMaxHp}
                  boss={boss}
                  message={battleMsg}
                  phase={battlePhase}
                />
              : <div className="px-panel center" style={{ minHeight: 400, display: 'grid', placeItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 64 }}>🌳</div>
                    <div className="ps mt-12" style={{ fontSize: 12, color: 'var(--gold)' }}>ALL CLEAR</div>
                    <div className="mt-8 muted">Complete a quest to spawn the next minion.</div>
                  </div>
                </div>
            }

          </div>

          <div>
            <HeroCard hero={hero} streak={state.streak} sectData={sectData} />

            <div className="tab-bar mt-16">
              {[['quests', 'QUESTS'], ['map', 'MAP'], ['skills', 'SKILLS'], ['badges', 'BADGES']].map(([k, l]) => (
                <div key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</div>
              ))}
            </div>

            <div className="px-panel" style={{ minHeight: 380, maxHeight: 540, overflow: 'auto' }}>
              {tab === 'quests' && <QuestList schedule={schedule} onComplete={completeQuest} sect={sect} />}
              {tab === 'map'    && <WorldMap schedule={schedule} todayIdx={todayIdx} sectData={sectData} bossHp={state.bossHp} bossMaxHp={state.bossMaxHp} />}
              {tab === 'skills' && <SkillTree sect={sect} mastery={state.mastery} />}
              {tab === 'badges' && <BadgeGrid earned={state.earned} />}
            </div>
          </div>
        </div>

        <div className="grid-4 mt-16">
          <StatBox ic="🔥" lbl="STREAK"     val={state.streak + 'd'} />
          <StatBox ic="⏱️" lbl="HOURS"      val={state.hrs + 'h'} />
          <StatBox ic="⚔️" lbl="MOBS SLAIN" val={state.kills} />
          <StatBox ic="📊" lbl="READINESS"  val={state.readiness + '%'} />
        </div>


      </div>
    </div>
  )
}

function TopHud({ hero, state }) {
  const pct = xpPct(hero.xp, hero.level)
  const nxt = xpToNext(hero.level)
  return (
    <div className="section-hero">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="title-logo" style={{ fontSize: 16 }}>CPA<span className="sub"> QUEST</span></div>
      </div>
      <div style={{ flex: 1, maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span className="ps" style={{ fontSize: 10, color: 'var(--gold)' }}>LV {hero.level} · {LEVEL_NAMES[hero.level - 1] || 'LEGEND'}</span>
          <span className="ps" style={{ fontSize: 10, color: 'var(--ash)' }}>{hero.xp} / {nxt} XP</span>
        </div>
        <div className="px-bar mt-8" style={{ height: 12 }}>
          <div className="px-bar-fill gold" style={{ width: pct + '%' }} />
        </div>
      </div>
      <div className="chip">⚡ {state.xpMult || 1}× XP</div>
    </div>
  )
}

function BossBar({ boss, sectData, bossHp, bossMaxHp, bossPct }) {
  const rage = bossPct > 60 ? 'ENRAGED' : bossPct > 30 ? 'WEAKENED' : bossPct > 0 ? 'NEAR DEFEAT' : 'SLAIN'
  const color = bossPct > 60 ? '#b13e53' : bossPct > 30 ? '#ef7d57' : '#38b764'
  return (
    <div className="px-panel mt-12" style={{
      background: '#2a0f1a', borderColor: 'var(--ink)',
      boxShadow: 'inset 0 0 0 2px var(--blood), inset 0 0 0 4px var(--ink), 8px 8px 0 0 rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 48, animation: 'hero-bob 2s steps(2) infinite', filter: 'drop-shadow(3px 3px 0 #000)' }}>{boss.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="ps" style={{ fontSize: 11, color: 'var(--blood)' }}>▲ {boss.name.toUpperCase()}</div>
              <div className="tiny mt-8">{boss.tagline} · {sectData.full}</div>
            </div>
            <div className="ps" style={{ fontSize: 10, color }}>{rage}</div>
          </div>
          <div className="px-bar mt-8" style={{ height: 14 }}>
            <div className="px-bar-fill blood" style={{ width: bossPct + '%', background: color }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 16 }}>
            <span className="ps" style={{ fontSize: 10, color: 'var(--ash)' }}>BOSS HP</span>
            <span>{bossHp} / {bossMaxHp}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function HeroCard({ hero, streak, sectData }) {
  const cls = CLASSES.find(c => c.id === hero.clsId)
  const wpn = WEAPONS.find(w => w.id === hero.weaponId)
  return (
    <div className="px-panel">
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 54, filter: 'drop-shadow(3px 3px 0 var(--ink))' }}>{hero.avatar}</div>
        <div style={{ flex: 1 }}>
          <div className="ps" style={{ fontSize: 12, color: 'var(--bone)' }}>{hero.name}</div>
          <div className="ps mt-8" style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: 0 }}>{hero.title}</div>
          <div className="tiny mt-8">{cls.emoji} {cls.name} · {wpn.emoji} {wpn.name}</div>
        </div>
        {sectData && (
          <div className="ps" style={{
            fontSize: 11, letterSpacing: 0,
            color: sectData.color,
            background: 'var(--ink)',
            border: '2px solid ' + sectData.color,
            padding: '4px 8px',
            alignSelf: 'flex-start',
          }}>
            {sectData.name}
          </div>
        )}
      </div>
      <div className="grid-3 mt-12" style={{ gap: 8 }}>
        <MiniStat lbl="HP"  val={`${hero.hp}/${hero.maxHp}`} color="var(--grass)" />
        <MiniStat lbl="LV"  val={hero.level} color="var(--gold)" />
        <MiniStat lbl="🔥" val={streak + 'd'} color="var(--rust)" />
      </div>
    </div>
  )
}

function MiniStat({ lbl, val, color }) {
  return (
    <div style={{ background: 'var(--ink)', border: '2px solid var(--ink)', padding: '8px 8px', textAlign: 'center' }}>
      <div className="ps" style={{ fontSize: 10, color: 'var(--ash)' }}>{lbl}</div>
      <div className="ps" style={{ fontSize: 15, color, marginTop: 6 }}>{val}</div>
    </div>
  )
}

function StatBox({ ic, lbl, val }) {
  return (
    <div className="hud-stat">
      <div className="ic">{ic}</div>
      <div>
        <div className="lbl">{lbl}</div>
        <div className="val">{val}</div>
      </div>
    </div>
  )
}

function QuestList({ schedule, onComplete, sect }) {
  const tk = todayKey()
  const sectData = SECTIONS[sect]
  const visible = schedule.slice(0, 14)
  return (
    <div>
      <div className="section-label">QUEST LOG — NEXT 14 DAYS</div>
      {visible.map((q, idx) => {
        const isToday = q.date.slice(0, 10) === tk
        const topic = sectData.topics.find(t => t.n === q.topic)
        const icon = q.type === 'practice' ? '🎯' : q.type === 'review' ? '📖' : (topic?.mob || '⚔️')
        return (
          <div key={idx} className={'quest-row' + (q.done ? ' done' : '') + (isToday ? ' today' : '')}>
            <div className={'quest-check' + (q.done ? ' on' : '')} onClick={() => !q.done && onComplete(idx)}>
              {q.done ? '✓' : ''}
            </div>
            <div>
              <div style={{ fontSize: 20 }}>{icon} {q.topic}</div>
              <div className="quest-meta">Day {q.day} · {q.type.toUpperCase()}</div>
            </div>
            <div className="tiny">{new Date(q.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
            {isToday && <div className="ps" style={{ fontSize: 10, color: 'var(--gold)' }}>TODAY</div>}
          </div>
        )
      })}
    </div>
  )
}

function WorldMap({ schedule, todayIdx, sectData, bossHp, bossMaxHp }) {
  const nodes = schedule.slice(0, 28)
  return (
    <div>
      <div className="section-label">WORLD MAP</div>
      <div className="world-map" style={{ minHeight: 340 }}>
        {nodes.map((q, i) => {
          const cols = 7
          const row = Math.floor(i / cols)
          const colInRow = i % cols
          const col = row % 2 === 0 ? colInRow : (cols - 1 - colInRow)
          const x = 10 + (col * 13)
          const y = 8 + row * 22
          const isMini = q.day % 7 === 0
          const cls = q.done ? 'done' : (i === todayIdx ? 'today' : '')
          return (
            <div key={i}
                 className={'map-node ' + cls + (isMini ? ' mini' : '')}
                 style={{ left: x + '%', top: y + '%' }}
                 title={`Day ${q.day}: ${q.topic}`}>
              {q.done ? '✓' : (isMini ? '👺' : q.day)}
            </div>
          )
        })}
        <div className="map-node boss" style={{ left: '92%', top: '50%' }} title={sectData.boss.name}>
          {sectData.boss.emoji}
        </div>
      </div>
      <div className="tiny mt-12">
        ◆ Today &nbsp;·&nbsp; ✓ Done &nbsp;·&nbsp; 👺 Mini-boss &nbsp;·&nbsp; {sectData.boss.emoji} Final Boss ({bossHp}/{bossMaxHp} HP)
      </div>
    </div>
  )
}

function SkillTree({ sect, mastery }) {
  const topics = SECTIONS[sect].topics
  return (
    <div>
      <div className="section-label">SKILL MASTERY</div>
      {topics.map((t, i) => {
        const tier = mastery[i] || 0
        const names = ['bronze', 'silver', 'gold', 'plat']
        return (
          <div key={i} style={{
            background: 'var(--dusk)', border: '3px solid var(--ink)',
            padding: 10, marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 28 }}>{t.mob}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18 }}>{t.n}</div>
              <div className="pip-row mt-8">
                {[0,1,2,3].map(k => (
                  <div key={k} className={'pip' + (k < tier ? ' ' + names[k] : '')} />
                ))}
              </div>
            </div>
            <div className="tiny">{t.w}</div>
          </div>
        )
      })}
    </div>
  )
}

function BadgeGrid({ earned }) {
  return (
    <div>
      <div className="section-label">ACHIEVEMENTS</div>
      <div className="grid-3">
        {BADGES.map(b => {
          const on = earned.includes(b.id)
          return (
            <div key={b.id} className={'bcard' + (on ? ' on' : '')}>
              <div className="bi">{b.icon}</div>
              <div className="bn">{b.name}</div>
              <div className="tiny mt-8" style={{ fontSize: 12, lineHeight: 1.3 }}>{b.desc}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Heatmap({ activity }) {
  const cells = []
  for (let i = 27; i >= 0; i--) {
    const d = addDays(new Date(), -i)
    const k = d.toISOString().slice(0, 10)
    const done = activity[k] === 'done'
    const isToday = i === 0
    cells.push(
      <div key={k} style={{
        aspectRatio: '1',
        background: done ? 'var(--grass)' : 'var(--dusk)',
        border: '2px solid var(--ink)',
        boxShadow: isToday ? 'inset 0 0 0 2px var(--gold)' : 'none',
      }} title={k} />
    )
  }
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4 }}>{cells}</div>
}
