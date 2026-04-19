import { useState, useEffect, useRef, useMemo } from 'react'
import BattleArena from './BattleArena.jsx'
import {
  SECTIONS, CLASSES, WEAPONS, BADGES, LEVEL_NAMES,
  computeLevel, xpPct, xpToNext,
} from '../constants.js'

function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function todayKey() { return localDateKey() }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d }
async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

export default function Dashboard({ state, setState, showToast, onOpenSettings, onReset }) {
  const { hero, sect, schedule, mobState } = state
  const sectData = SECTIONS[sect]
  const boss = sectData.boss

  const [tab, setTab] = useState('quests')
  const [battlePhase, setBattlePhase] = useState('idle')
  const [battleMsg, setBattleMsg] = useState('')
  const [lastDmgHero, setLastDmgHero] = useState(0)
  const [lastDmgMob, setLastDmgMob] = useState(0)
  const [bossReveal, setBossReveal] = useState(false)
  const [victoryBanner, setVictoryBanner] = useState(false)

  // Active quest = first undone quest in sequence (used for UI like "today's quest")
  const activeIdx = schedule.findIndex(q => !q.done)
  const activeQuest = activeIdx >= 0 ? schedule[activeIdx] : null

  // Fight quest = the quest whose mob is currently being fought. Driven by
  // state.kills (one mob killed per quest completion) so rapid-fire check-offs
  // play out as a sequential combat chain rather than snapping to the new
  // activeQuest and skipping intermediate mobs.
  const fightIdx = state.kills
  const fightQuest = fightIdx < schedule.length ? schedule[fightIdx] : activeQuest

  // Full Review phase based on the fight pointer, not activeQuest.
  const inReviewPhase = fightQuest?.type === 'review'

  // Damage per review quest: boss total HP divided evenly across all review quests
  const reviewCount = Math.max(1, schedule.filter(q => q.type === 'review').length)
  const dmgPerReview = Math.ceil(state.bossMaxHp / reviewCount)

  // Detect transition into review phase and show boss reveal overlay.
  // The ref is initialized to the current type on first render so loading
  // mid-review doesn't re-trigger the reveal.
  const hasInitRef = useRef(false)
  const prevQuestTypeRef = useRef(null)
  if (!hasInitRef.current) {
    hasInitRef.current = true
    prevQuestTypeRef.current = activeQuest?.type
  }
  useEffect(() => {
    const prev = prevQuestTypeRef.current
    const curr = fightQuest?.type
    if (curr === 'review' && prev !== 'review') {
      setBossReveal(true)
      const t = setTimeout(() => setBossReveal(false), 4000)
      return () => clearTimeout(t)
    }
    prevQuestTypeRef.current = curr
  }, [fightQuest?.type])

  const currentMob = useMemo(() => {
    if (mobState && mobState.mobHp > 0) return mobState
    if (!fightQuest) return null

    if (inReviewPhase) {
      // Boss phase: the final boss IS the mob for each review encounter
      return {
        topicIdx: -1,
        mob: boss.emoji,
        mobName: boss.name,
        level: 99,
        isBoss: true,
        isMiniBoss: false,
        mobMaxHp: dmgPerReview,
        mobHp: dmgPerReview,
        lastDmg: 0,
      }
    }

    // Normal phase: regular topic mob or mini-boss (practice quests only).
    const topicIdx = sectData.topics.findIndex(t => t.n === fightQuest.topic)
    const topic = topicIdx >= 0 ? sectData.topics[topicIdx] : sectData.topics[0]
    const isMiniBoss = fightQuest.type === 'practice'
    const maxHp = isMiniBoss ? 180 : 60 + Math.floor(Math.random() * 40)
    return {
      topicIdx: topicIdx >= 0 ? topicIdx : 0,
      mob: isMiniBoss ? '👺' : topic.mob,
      mobName: isMiniBoss ? (topic.n + ' MINI-BOSS') : topic.mobName,
      level: Math.max(1, hero.level + (isMiniBoss ? 2 : 0)),
      isBoss: false,
      isMiniBoss,
      mobMaxHp: maxHp,
      mobHp: maxHp,
      lastDmg: 0,
    }
  }, [mobState, fightQuest, fightIdx, inReviewPhase, dmgPerReview, boss, sect, hero.level, sectData.topics])

  useEffect(() => {
    if (!mobState && currentMob) {
      setState(p => ({ ...p, mobState: currentMob }))
    }
  }, [currentMob, mobState, setState])

  useEffect(() => {
    if (!currentMob) return
    const msg = currentMob.isBoss
      ? `⚠ ${boss.name.toUpperCase()} CHALLENGES YOU!`
      : `A wild ${currentMob.mobName} appears!`
    setBattleMsg(msg)
  }, [currentMob?.mobName, currentMob?.isBoss, boss.name])

  const attacking = useRef(false)
  const pendingKills = useRef(0)
  const attackRef = useRef()
  const attacksUntilThrow = useRef(1 + Math.floor(Math.random() * 4))
  async function attack(isComplete = false) {
    if (attacking.current || !currentMob || currentMob.mobHp <= 0) return
    attacking.current = true

    const crit = Math.random() < (hero.clsId === 'clutch' ? 0.25 : 0.1)
    const base = hero.clsId === 'strategist' ? 28 : 22
    // Quest check-off is always a one-shot kill
    const dmg = isComplete
      ? currentMob.mobHp
      : Math.floor(base + Math.random() * 12) * (crit ? 2 : 1)
    setLastDmgMob(dmg)

    attacksUntilThrow.current -= 1
    const isThrow = attacksUntilThrow.current <= 0
    if (isThrow) attacksUntilThrow.current = 1 + Math.floor(Math.random() * 4)

    setBattleMsg(`${hero.name} ${isThrow ? 'hurls their weapon!' : 'attacks!'} ${crit ? 'CRITICAL HIT!' : ''}`)
    setBattlePhase(isThrow ? 'hero-throw' : 'hero-attack')
    await wait(isThrow ? 550 : 450)
    setBattlePhase('hit-foe')
    setState(p => ({ ...p, mobState: { ...p.mobState, mobHp: Math.max(0, p.mobState.mobHp - dmg), lastDmg: dmg } }))
    await wait(500)

    const newMobHp = Math.max(0, currentMob.mobHp - dmg)
    if (newMobHp <= 0) {
      const xpGain = currentMob.isBoss ? 250 : (currentMob.isMiniBoss ? 150 : 60)
      const isFinalBlow = currentMob.isBoss && state.bossHp <= dmgPerReview

      if (isFinalBlow) {
        // Epic finisher sequence for the final boss kill
        setBattleMsg('☠ FINAL BLOW! ☠')
        setBattlePhase('boss-finisher')
        await wait(700)
        setBattleMsg(`${currentMob.mobName.toUpperCase()} IS VANQUISHED!`)
        setBattlePhase('boss-shatter')
        await wait(1700)
      } else {
        setBattleMsg(`${currentMob.mobName} was defeated! +${xpGain} XP`)
        setBattlePhase('faint-foe')
        await wait(700)
      }
      setState(p => {
        const newXp = p.hero.xp + xpGain
        const newLv = computeLevel(newXp)
        // Boss HP only decreases during review phase (boss encounters)
        // Normal mobs and mini-bosses do NOT damage the boss
        const newBossHp = p.mobState.isBoss
          ? Math.max(0, p.bossHp - dmgPerReview)
          : p.bossHp
        const newKills = p.kills + 1
        const newEarned = [...p.earned]
        if (!newEarned.includes('log1') && isComplete) newEarned.push('log1')
        if (newKills >= 10 && !newEarned.includes('mob10')) newEarned.push('mob10')
        if (p.mobState.isMiniBoss && !newEarned.includes('mini1')) newEarned.push('mini1')
        if (p.mobState.isBoss && newBossHp <= 0 && !newEarned.includes('boss1')) newEarned.push('boss1')
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
      pendingKills.current = Math.max(0, pendingKills.current - 1)

      if (isFinalBlow) {
        setVictoryBanner(true)
        setTimeout(() => setVictoryBanner(false), 5000)
      }
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
  attackRef.current = attack

  // Chain the next attack when a fresh mob spawns and kills are still pending.
  useEffect(() => {
    if (
      mobState &&
      mobState.mobHp === mobState.mobMaxHp &&
      pendingKills.current > 0 &&
      !attacking.current
    ) {
      const t = setTimeout(() => attackRef.current?.(true), 350)
      return () => clearTimeout(t)
    }
  }, [mobState])

  function completeQuest(idx) {
    if (schedule[idx].done) return
    setState(p => {
      const newSchedule = p.schedule.map((s, i) => i === idx ? { ...s, done: true } : s)
      const sessions = p.sessions + 1
      const hrs = p.hrs + p.dhrs
      const yk = localDateKey(addDays(new Date(), -1))
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
    showToast(inReviewPhase ? '⚔ BOSS HIT! +XP  +HP' : 'QUEST COMPLETE! +XP  +HP')
    pendingKills.current += 1
    // If nothing is currently animating, kick off the first attack.
    // Subsequent completions stay queued and auto-chain after each mob respawns.
    if (!attacking.current) {
      setTimeout(() => attackRef.current?.(true), 350)
    }
  }

  const bossPct = Math.max(0, Math.round((state.bossHp / state.bossMaxHp) * 100))
  const mobForArena = currentMob ? { ...currentMob, lastDmg: lastDmgMob } : null

  // Environment follows quest progress, as if traveling toward the boss.
  // Final Review phase = hell showdown.
  const envStages = ['grass', 'meadow', 'desert', 'cave', 'snow']
  const totalQuests = schedule.length
  const doneQuests = schedule.filter(s => s.done).length
  const progress = totalQuests ? doneQuests / totalQuests : 0
  const arenaEnv = activeQuest?.type === 'review'
    ? 'hell'
    : envStages[Math.min(envStages.length - 1, Math.floor(progress * envStages.length))]

  return (
    <div className="app-wrap crt">
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <TopHud hero={hero} state={state} onOpenSettings={onOpenSettings} onReset={onReset} />

        {/* Boss bar: only shown during Full Review phase */}
        {inReviewPhase && (
          <BossBar boss={boss} sectData={sectData} bossHp={state.bossHp} bossMaxHp={state.bossMaxHp} bossPct={bossPct} />
        )}

        <PaceTracker schedule={schedule} startDate={state.startDate} edate={state.edate} />

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 16 }}>
          <div>
            {mobForArena
              ? <BattleArena
                  hero={{ ...hero, lastDmg: lastDmgHero, xpPct: xpPct(hero.xp, hero.level) }}
                  weapon={WEAPONS.find(w => w.id === hero.weaponId)}
                  mob={mobForArena}
                  heroHp={hero.hp} heroMaxHp={hero.maxHp}
                  mobHp={mobForArena.mobHp} mobMaxHp={mobForArena.mobMaxHp}
                  boss={boss}
                  env={arenaEnv}
                  message={battleMsg}
                  phase={battlePhase}
                />
              : <div className="px-panel center" style={{ minHeight: 400, display: 'grid', placeItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    {state.bossHp <= 0
                      ? <>
                          <div style={{ fontSize: 64 }}>{boss.emoji}</div>
                          <div className="ps mt-12" style={{ fontSize: 13, color: 'var(--gold)' }}>
                            ★ {boss.name.toUpperCase()} DEFEATED ★
                          </div>
                          <div className="tiny mt-8" style={{ color: 'var(--grass)' }}>Run complete. Well done.</div>
                        </>
                      : <>
                          <div style={{ fontSize: 64 }}>🌳</div>
                          <div className="ps mt-12" style={{ fontSize: 12, color: 'var(--gold)' }}>ALL CLEAR</div>
                          <div className="mt-8 muted">Complete a quest to spawn the next minion.</div>
                        </>
                    }
                  </div>
                </div>
            }

            <div className="grid-2 mt-16">
              <StatBox ic="🔥" lbl="STREAK"     val={state.streak + 'd'} />
              <StatBox ic="⏱️" lbl="HOURS"      val={state.hrs + 'h'} />
              <StatBox ic="⚔️" lbl="MOBS SLAIN" val={state.kills} />
              <StatBox ic="📊" lbl="READINESS"  val={state.readiness + '%'} />
            </div>
          </div>

          <div>
            <HeroCard hero={hero} streak={state.streak} sectData={sectData} />

            <div className="tab-bar mt-16">
              {[['quests', 'QUESTS'], ['map', 'MAP'], ['skills', 'SKILLS'], ['badges', 'BADGES']].map(([k, l]) => (
                <div key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</div>
              ))}
            </div>

            <div className="px-panel" style={{ minHeight: 380, maxHeight: 540, overflow: 'auto' }}>
              {tab === 'quests' && <QuestList schedule={schedule} onComplete={completeQuest} sect={sect} activeIdx={activeIdx} boss={boss} />}
              {tab === 'map'    && <WorldMap schedule={schedule} activeIdx={activeIdx} sectData={sectData} bossHp={state.bossHp} bossMaxHp={state.bossMaxHp} hero={hero} />}
              {tab === 'skills' && <SkillTree sect={sect} mastery={state.mastery} />}
              {tab === 'badges' && <BadgeGrid earned={state.earned} />}
            </div>
          </div>
        </div>
      </div>

      {/* Boss reveal overlay — fires once when review phase begins */}
      {bossReveal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(10,0,5,0.92)',
          display: 'grid', placeItems: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 120,
              filter: 'drop-shadow(0 0 32px #b13e53)',
              animation: 'hero-bob 0.8s steps(2) infinite',
            }}>
              {boss.emoji}
            </div>
            <div className="ps" style={{
              fontSize: 20, color: 'var(--blood)',
              marginTop: 24, letterSpacing: 4,
            }}>
              ▲ {boss.name.toUpperCase()} AWAKENS ▲
            </div>
            <div className="ps mt-12" style={{ fontSize: 9, color: 'var(--gold)', letterSpacing: 3 }}>
              FINAL REVIEW PHASE BEGINS
            </div>
            <div className="tiny mt-8" style={{ color: 'var(--ash)' }}>{boss.tagline}</div>
          </div>
        </div>
      )}

      {/* Victory banner — fires once after the finisher sequence */}
      {victoryBanner && (
        <div className="victory-overlay">
          <div style={{ textAlign: 'center' }}>
            <div className="victory-text">VICTORY!</div>
            <div className="victory-sub">{boss.name.toUpperCase()} HAS FALLEN</div>
            <div className="victory-sub" style={{ fontSize: 11, color: 'var(--gold)', marginTop: 14 }}>
              +500 XP · +1 BOSS SLAYER BADGE
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pace Tracker ──────────────────────────────────────────────────────────────
function PaceTracker({ schedule, startDate, edate }) {
  const total = schedule.length
  const completed = schedule.filter(q => q.done).length

  if (!edate || !startDate || total === 0) return null

  const today = new Date(); today.setHours(0,0,0,0)
  const start = new Date(startDate); start.setHours(0,0,0,0)
  const exam  = new Date(edate);  exam.setHours(0,0,0,0)

  const daysTotal   = Math.max(1, Math.ceil((exam  - start) / 86400000))
  const daysElapsed = Math.max(0, Math.min(daysTotal, Math.ceil((today - start) / 86400000)))
  const daysLeft    = Math.max(0, Math.ceil((exam  - today) / 86400000))

  const expectedPos  = Math.round((daysElapsed / daysTotal) * total)
  const completedPct = Math.min(100, (completed / total) * 100)
  const expectedPct  = Math.min(100, (expectedPos / total) * 100)

  const gap = completed - expectedPos
  const status = gap > 2 ? 'AHEAD' : gap >= -2 ? 'ON PACE' : 'BEHIND'
  const statusColor = status === 'AHEAD' ? 'var(--grass)' : status === 'ON PACE' ? 'var(--gold)' : 'var(--blood)'

  return (
    <div className="px-panel mt-12">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="section-label" style={{ margin: 0 }}>PACE TRACKER</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span className="tiny">{completed} / {total} quests</span>
          <span className="tiny">{daysLeft}d until exam</span>
          <div className="chip" style={{ background: statusColor, color: 'var(--ink)', padding: '2px 10px' }}>{status}</div>
        </div>
      </div>
      <div style={{ position: 'relative', height: 16, background: 'var(--ink)', border: '2px solid var(--dusk)' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: completedPct + '%',
          background: statusColor,
          transition: 'width 0.4s',
        }} />
        <div style={{
          position: 'absolute', top: -3, bottom: -3,
          left: `calc(${expectedPct}% - 1px)`,
          width: 3,
          background: 'var(--bone)',
          opacity: 0.85,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span className="tiny" style={{ color: 'var(--ash)' }}>START</span>
        {gap !== 0 && (
          <span className="tiny" style={{ color: statusColor }}>
            {Math.abs(gap)} quest{Math.abs(gap) !== 1 ? 's' : ''} {gap > 0 ? 'ahead' : 'behind'}
          </span>
        )}
        <span className="tiny" style={{ color: 'var(--ash)' }}>EXAM</span>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TopHud({ hero, onOpenSettings, onReset }) {
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
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="px-btn sm ghost" onClick={onOpenSettings}>⚙ SETTINGS</button>
        <button className="px-btn sm ghost" onClick={onReset}>RESET</button>
      </div>
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
              <div className="ps" style={{ fontSize: 11, color: 'var(--blood)' }}>▲ FINAL BOSS · {boss.name.toUpperCase()}</div>
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

function QuestList({ schedule, onComplete, sect, activeIdx, boss }) {
  const sectData = SECTIONS[sect]
  return (
    <div>
      <div className="section-label">QUEST LOG</div>
      {schedule.map((q, idx) => {
        const isActive = idx === activeIdx
        const isReview = q.type === 'review'
        const topic = sectData.topics.find(t => t.n === q.topic)
        const icon = isReview
          ? boss.emoji
          : q.type === 'practice' ? '🎯' : (topic?.mob || '⚔️')

        return (
          <div
            key={idx}
            className={'quest-row' + (q.done ? ' done' : '') + (isActive ? ' today' : '')}
            style={isReview && !q.done ? {
              borderLeft: '4px solid var(--blood)',
              background: 'rgba(177,62,83,0.08)',
            } : {}}
          >
            <div className={'quest-check' + (q.done ? ' on' : '')} onClick={() => !q.done && onComplete(idx)}>
              {q.done ? '✓' : ''}
            </div>
            <div>
              <div style={{ fontSize: 20 }}>
                {icon} {isReview ? `FINAL REVIEW — ${boss.name}` : q.topic}
              </div>
              <div className="quest-meta" style={isReview ? { color: 'var(--blood)' } : {}}>
                Quest {idx + 1} · {isReview ? 'BOSS PHASE' : q.type.toUpperCase()}
              </div>
            </div>
            {isActive && (
              <div className="ps" style={{ fontSize: 10, color: isReview ? 'var(--blood)' : 'var(--gold)' }}>
                {isReview ? '⚔ BOSS' : '▶ CURRENT'}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function WorldMap({ schedule, activeIdx, sectData, bossHp, bossMaxHp, hero }) {
  const COLS = 7
  const total = schedule.length
  const rows = Math.max(1, Math.ceil(total / COLS))
  const Y_START = 10
  const Y_END = 90
  const yStep = rows > 1 ? (Y_END - Y_START) / (rows - 1) : 0

  const nodes = schedule.map((q, i) => {
    const row = Math.floor(i / COLS)
    const colInRow = i % COLS
    const col = row % 2 === 0 ? colInRow : (COLS - 1 - colInRow)
    const x = 8 + col * 14
    const y = Y_START + row * yStep
    const isMini = q.type === 'practice'
    const isReview = q.type === 'review'
    const isFinalBoss = i === total - 1 && isReview
    const isPractice = q.type === 'practice'
    const topic = sectData.topics.find(t => t.n === q.topic)
    let icon
    if (q.done) icon = '✓'
    else if (isFinalBoss) icon = sectData.boss.emoji
    else if (isReview) icon = '📖'
    else if (isMini) icon = '👺'
    else if (isPractice) icon = '🎯'
    else icon = topic?.mob || '⚔️'
    return { idx: i, done: q.done, isMini, isReview, isFinalBoss, isPractice, topic, x, y, icon, topicName: q.topic }
  })

  const doneCount = schedule.filter(q => q.done).length
  const activeNode = nodes[activeIdx]
  const mapHeight = Math.max(260, rows * 64)
  const trailPoints = nodes.map(n => `${n.x},${n.y}`).join(' ')

  return (
    <div>
      <div className="section-label">WORLD MAP</div>
      <div className="tiny mb-12">
        <span className="muted">JOURNEY </span><span className="gold-text">{doneCount} / {total}</span>
      </div>
      <div className="world-map" style={{ minHeight: mapHeight, position: 'relative' }}>
        {/* Connector trail */}
        <svg className="map-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline
            points={trailPoints}
            fill="none"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="0.5"
            strokeDasharray="1.5 1.2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Start flag */}
        {nodes[0] && (
          <div className="map-flag" style={{ left: (nodes[0].x - 8) + '%', top: nodes[0].y + '%' }}>🏁</div>
        )}

        {/* Nodes */}
        {nodes.map(n => {
          const isActive = n.idx === activeIdx
          const cls = [
            'map-node',
            n.done ? 'done' : '',
            isActive ? 'active' : '',
            n.isMini ? 'mini' : '',
            n.isReview ? 'review' : '',
            n.isFinalBoss ? 'final-boss' : '',
          ].filter(Boolean).join(' ')
          return (
            <div key={n.idx}
                 className={cls}
                 style={{ left: n.x + '%', top: n.y + '%' }}
                 title={`${n.idx + 1}. ${n.topicName}`}>
              {n.icon}
            </div>
          )
        })}

        {/* Hero marker bobbing above the active node */}
        {activeNode && (
          <div className="map-hero"
               style={{ left: activeNode.x + '%', top: activeNode.y + '%' }}>
            {hero.avatar}
          </div>
        )}
      </div>
      <div className="tiny mt-12">
        🏁 Start &nbsp;·&nbsp; 🎯 Practice &nbsp;·&nbsp; 👺 Mini-boss &nbsp;·&nbsp; 📖 Review &nbsp;·&nbsp; {sectData.boss.emoji} Final Boss
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
