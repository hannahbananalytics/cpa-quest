import { useState, useEffect, useRef, useMemo } from 'react'
import BattleArena from './BattleArena.jsx'
import {
  SECTIONS, CLASSES, WEAPONS, BADGES, LEVEL_NAMES,
  computeLevel, xpPct, xpToNext,
} from '../constants.js'
import { sfx } from '../sfx.js'

function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function todayKey() { return localDateKey() }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d }
async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

export default function Dashboard({ state, setState, showToast, onOpenSettings, onReset, battleSpeed = 1 }) {
  const { hero, sect, schedule, mobState } = state
  const sectData = SECTIONS[sect]
  const boss = sectData.boss
  // Ref mirror so in-flight async attack loops see the latest speed immediately.
  const speedRef = useRef(battleSpeed)
  speedRef.current = battleSpeed || 1
  // Scales a base duration (ms) by the current battle speed.
  const scaled = (ms) => Math.max(0, Math.round(ms / (speedRef.current || 1)))
  const waitS = (ms) => wait(scaled(ms))

  const [tab, setTab] = useState('quests')
  const [battlePhase, setBattlePhase] = useState('idle')
  const [battleMsg, setBattleMsg] = useState('')
  const [lastDmgHero, setLastDmgHero] = useState(0)
  const [lastDmgMob, setLastDmgMob] = useState(0)
  const [bossReveal, setBossReveal] = useState(false)
  const [victoryBanner, setVictoryBanner] = useState(false)

  // `activeIdx` / `activeQuest` drive progress UI (quest-log CURRENT marker,
  // world-map hero, pace tracker). They point at the first *undone* quest.
  const activeIdx = schedule.findIndex(q => !q.done)
  const activeQuest = activeIdx >= 0 ? schedule[activeIdx] : null

  // `combatIdx` / `combatQuest` drive the mob in front of the hero. The user
  // can tick quests in any order, so the fight follows the *last quest they
  // clicked* (`state.focusIdx`). On startup (no focus yet) or after a mob
  // kill auto-advances, it falls back to the first undone quest.
  const combatIdx = state.focusIdx != null
    && state.focusIdx >= 0
    && state.focusIdx < schedule.length
    ? state.focusIdx
    : activeIdx
  const combatQuest = combatIdx >= 0 ? schedule[combatIdx] : null

  // Full Review phase is driven by the combat quest (so if the user skips
  // straight to a review quest the boss reveal plays).
  const inReviewPhase = combatQuest?.type === 'review'

  // Damage per review hit: boss total HP divided evenly across all review quests
  const reviewCount = Math.max(1, schedule.filter(q => q.type === 'review').length)
  const dmgPerReview = Math.ceil(state.bossMaxHp / reviewCount)

  // Constant per-hit damage for content mobs. Mob HP is sized so the last
  // content quest of a topic is the killing blow exactly.
  const PER_HIT = 50

  // Boss reveal fires exactly once per run — the first time combat enters
  // the review phase. A persisted `state.bossIntroShown` flag prevents the
  // overlay from re-triggering when the user hops back to review after
  // visiting a content/practice quest, and survives page reloads.
  useEffect(() => {
    if (state.bossIntroShown) return
    if (combatQuest?.type !== 'review') return
    setBossReveal(true)
    sfx('boss-reveal')
    setState(p => p.bossIntroShown ? p : { ...p, bossIntroShown: true })
  }, [combatQuest?.type, state.bossIntroShown, setState])

  // Auto-hide the overlay 4 s after it appears. Lives in its own effect so
  // the flag-flip setState above doesn't tear down the timer mid-reveal.
  useEffect(() => {
    if (!bossReveal) return
    const t = setTimeout(() => setBossReveal(false), 4000)
    return () => clearTimeout(t)
  }, [bossReveal])

  const currentMob = useMemo(() => {
    // Keep the existing mob through its death animation — don't swap mid-faint.
    if (mobState) return mobState
    if (!combatQuest) return null

    if (combatQuest.type === 'review') {
      // Persistent boss across the whole review phase
      return {
        topicKey: 'REVIEW',
        mob: boss.emoji,
        mobName: boss.name,
        level: 99,
        isBoss: true,
        isMiniBoss: false,
        mobMaxHp: state.bossMaxHp,
        mobHp: state.bossHp > 0 ? state.bossHp : state.bossMaxHp,
        lastDmg: 0,
      }
    }

    if (combatQuest.type === 'practice') {
      // Mini-boss checkpoint — uses the prior content topic for flavor.
      const prevContent = [...schedule.slice(0, combatIdx)].reverse().find(q => q.type === 'content')
      const topic = sectData.topics.find(t => t.n === prevContent?.topic) || sectData.topics[0]
      const key = 'PRACTICE:' + combatIdx
      const stored = state.mobBank?.[key]
      return {
        topicKey: key,
        mob: '👺',
        mobName: (topic.n + ' MINI-BOSS'),
        level: Math.max(1, hero.level + 2),
        isBoss: false,
        isMiniBoss: true,
        mobMaxHp: 240,
        mobHp: typeof stored === 'number' ? stored : 240,
        lastDmg: 0,
      }
    }

    // Content: persistent topic mob. HP = (# of content quests in this topic) × PER_HIT
    const topic = sectData.topics.find(t => t.n === combatQuest.topic)
    if (!topic) return null
    const topicQuestCount = schedule.filter(q => q.topic === combatQuest.topic && q.type === 'content').length
    const mobMaxHp = Math.max(PER_HIT, topicQuestCount * PER_HIT)
    const key = combatQuest.topic
    const stored = state.mobBank?.[key]
    return {
      topicKey: key,
      mob: topic.mob,
      mobName: topic.mobName,
      level: Math.max(1, hero.level),
      isBoss: false,
      isMiniBoss: false,
      mobMaxHp,
      mobHp: typeof stored === 'number' ? stored : mobMaxHp,
      lastDmg: 0,
    }
  }, [mobState, combatQuest, combatIdx, sect, sectData.topics, hero.level, schedule, state.bossMaxHp, state.bossHp, state.mobBank, boss])

  // Expected mobState.topicKey for the combat quest — used to detect when the
  // persisted mob no longer matches the encounter the user is focused on.
  const expectedMobKey = combatQuest
    ? (combatQuest.type === 'review' ? 'REVIEW'
      : combatQuest.type === 'practice' ? 'PRACTICE:' + combatIdx
      : combatQuest.topic)
    : null

  useEffect(() => {
    if (!mobState && currentMob) {
      const t = setTimeout(() => {
        setState(p => (p.mobState ? p : { ...p, mobState: currentMob }))
      }, scaled(600))
      return () => clearTimeout(t)
    }
  }, [currentMob, mobState, setState])

  // When a fresh mob spawns and the attack queue has entries, drain one.
  useEffect(() => {
    if (!mobState || attacking.current || pendingQueue.current.length === 0) return
    const t = setTimeout(() => attackRef.current?.(), scaled(200))
    return () => clearTimeout(t)
  }, [mobState?.topicKey])

  // Enter ticks the current (first-undone) quest — same as clicking its
  // checkbox. Skipped when the user is focused in an input/button so form
  // typing and button-Enter keep their native behavior. After the tick the
  // quest list scrolls so the just-completed row aligns with the top of
  // the panel, keeping the next quest to do in the first visible slot.
  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Enter') return
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'
        || el.tagName === 'BUTTON' || el.isContentEditable)) return
      if (activeIdx < 0 || schedule[activeIdx]?.done) return
      e.preventDefault()
      const completedIdx = activeIdx
      sfx('tick')
      completeQuestRef.current?.(completedIdx)
      requestAnimationFrame(() => {
        const row = document.querySelector(`[data-quest-idx="${completedIdx}"]`)
        if (!row) return
        const panel = row.closest('.px-panel')
        if (!panel) return
        const rowRect = row.getBoundingClientRect()
        const panelRect = panel.getBoundingClientRect()
        const delta = rowRect.top - panelRect.top
        if (delta !== 0) panel.scrollBy({ top: delta, behavior: 'smooth' })
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeIdx, schedule])

  useEffect(() => {
    if (!currentMob) return
    const msg = currentMob.isBoss
      ? `⚠ ${boss.name.toUpperCase()} CHALLENGES YOU!`
      : `A wild ${currentMob.mobName} appears!`
    setBattleMsg(msg)
  }, [currentMob?.mobName, currentMob?.isBoss, boss.name])

  const attacking = useRef(false)
  // Ordered queue of quest indices, each one a pending combat beat. Using an
  // array (not a counter) preserves each click's target encounter, so a fight
  // that's mid-chain for Topic A finishes its queued hits before a later
  // click on Topic C swaps the mob. Content/review clicks push 1 entry;
  // practice clicks push 3–5 (the flurry).
  const pendingQueue = useRef([])
  const attackRef = useRef()
  const completeQuestRef = useRef()
  const attacksUntilThrow = useRef(1 + Math.floor(Math.random() * 4))

  // Weapon flat ATK bonus (applied to variable-damage fights: mini-boss)
  const WEAPON_ATK = { pencil: 5, calc: 3, scroll: 0, laptop: 2, coffee: 1, highlight: 6 }
  // Weapon crit-chance bonus
  const WEAPON_CRIT = { scroll: 0.15, laptop: 0.02 }

  // Resolve the mob-key for a given quest entry.
  function questMobKey(quest, idx) {
    if (!quest) return null
    if (quest.type === 'review') return 'REVIEW'
    if (quest.type === 'practice') return 'PRACTICE:' + idx
    return quest.topic
  }

  async function attack() {
    if (attacking.current) return
    if (pendingQueue.current.length === 0) return

    // Peek the next queued beat and resolve which mob it targets.
    const nextIdx = pendingQueue.current[0]
    const nextQuest = schedule[nextIdx]
    if (!nextQuest) { pendingQueue.current.shift(); return attackRef.current?.() }
    const nextKey = questMobKey(nextQuest, nextIdx)

    // Either there is no mob yet, or the mob in the arena is for a different
    // encounter than the queue head. Either way we need to (re)spawn before
    // we can land this hit. Save the current mob to the bank, null mobState,
    // and advance focus so the respawn effect brings in the right mob. The
    // post-spawn effect will call attack() again once it commits.
    if (!mobState || mobState.topicKey !== nextKey) {
      setState(p => {
        const shouldSwap = p.mobState && p.mobState.topicKey !== nextKey
        const newMobBank = (shouldSwap && p.mobState.mobHp > 0)
          ? { ...p.mobBank, [p.mobState.topicKey]: p.mobState.mobHp }
          : p.mobBank
        return {
          ...p,
          mobState: shouldSwap ? null : p.mobState,
          mobBank: newMobBank,
          focusIdx: nextIdx,
        }
      })
      return
    }

    if (mobState.mobHp <= 0) return
    attacking.current = true

    const baseCrit = hero.clsId === 'clutch' ? 0.25 : 0.1
    const crit = Math.random() < (baseCrit + (WEAPON_CRIT[hero.weaponId] || 0))

    // Damage by mob type:
    //  - content: flat PER_HIT (sized so the last topic quest is the killing blow)
    //  - mini-boss: random 35–70 roll + weapon ATK, ×2 for Strategist, ×1.5 on crit
    //  - boss: dmgPerReview (+50% on crit, ×1.5 for Strategist)
    let dmg
    if (currentMob.isBoss) {
      dmg = crit ? Math.ceil(dmgPerReview * 1.5) : dmgPerReview
      if (hero.clsId === 'strategist') dmg = Math.ceil(dmg * 1.5)
    } else if (currentMob.isMiniBoss) {
      let roll = 35 + Math.floor(Math.random() * 36)          // 35–70
      roll += (WEAPON_ATK[hero.weaponId] || 0)
      if (hero.clsId === 'strategist') roll = Math.round(roll * 2) // weak-topic bonus
      if (crit) roll = Math.ceil(roll * 1.5)
      dmg = roll
    } else {
      dmg = PER_HIT
    }
    dmg = Math.min(dmg, currentMob.mobHp)
    setLastDmgMob(dmg)

    attacksUntilThrow.current -= 1
    const isThrow = attacksUntilThrow.current <= 0
    if (isThrow) attacksUntilThrow.current = 1 + Math.floor(Math.random() * 4)

    setBattleMsg(`${hero.name} ${isThrow ? 'hurls their weapon!' : 'attacks!'} ${crit ? 'CRITICAL HIT!' : ''}`)
    sfx(isThrow ? 'throw' : 'swing')
    setBattlePhase(isThrow ? 'hero-throw' : 'hero-attack')
    await waitS(isThrow ? 550 : 450)
    sfx('hit')
    setBattlePhase('hit-foe')
    setState(p => {
      if (!p.mobState) return p
      return {
        ...p,
        mobState: { ...p.mobState, mobHp: Math.max(0, p.mobState.mobHp - dmg), lastDmg: dmg },
        // Keep authoritative boss HP in sync during review phase
        bossHp: p.mobState.isBoss ? Math.max(0, p.bossHp - dmg) : p.bossHp,
      }
    })
    await waitS(500)

    const newMobHp = Math.max(0, currentMob.mobHp - dmg)

    if (newMobHp <= 0) {
      // --- KILL ---
      const baseKillXp = currentMob.isBoss ? 250 : (currentMob.isMiniBoss ? 150 : 100)
      const xpGain = crit ? Math.ceil(baseKillXp * 1.5) : baseKillXp
      const isFinalBlow = currentMob.isBoss

      // Kill-heals are off by default (per-quest heal in completeQuest is the
      // main regen source). Scholar's class ability: full HP restore on any
      // mini-boss kill.
      const fullRestoreOnMiniBoss = currentMob.isMiniBoss && hero.clsId === 'scholar'

      if (isFinalBlow) {
        setBattleMsg('☠ FINAL BLOW! ☠')
        sfx('finisher')
        setBattlePhase('boss-finisher')
        await waitS(700)
        setBattleMsg(`${currentMob.mobName.toUpperCase()} IS VANQUISHED!`)
        sfx('victory')
        setBattlePhase('boss-shatter')
        await waitS(1700)
      } else {
        setBattleMsg(`${currentMob.mobName} was defeated! +${xpGain} XP`)
        sfx('faint')
        setBattlePhase('faint-foe')
        await waitS(700)
      }

      // Drop the beat we just resolved, plus any leftover queued beats still
      // aimed at this (now-dead) encounter — they shouldn't carry over to
      // whatever spawns next.
      const killedKey = nextKey
      pendingQueue.current = pendingQueue.current
        .slice(1)
        .filter(i => questMobKey(schedule[i], i) !== killedKey)

      setState(p => {
        const newXp = p.hero.xp + xpGain
        const newLv = computeLevel(newXp)
        const newKills = p.kills + 1
        const newHp = fullRestoreOnMiniBoss ? p.hero.maxHp : p.hero.hp
        const newEarned = [...p.earned]
        if (newKills >= 10 && !newEarned.includes('mob10')) newEarned.push('mob10')
        if (p.mobState?.isMiniBoss && !newEarned.includes('mini1')) newEarned.push('mini1')
        if (p.mobState?.isBoss && !newEarned.includes('boss1')) newEarned.push('boss1')
        // Prefer the next queued beat's quest for focus, otherwise the next
        // undone quest. Avoids pointing focus at the just-killed quest and
        // respawning the corpse.
        const nextUndone = p.schedule.findIndex(q => !q.done)
        const queueHead = pendingQueue.current[0]
        const newFocus = queueHead != null ? queueHead
          : (nextUndone >= 0 ? nextUndone : null)
        // Drop any banked HP for the just-killed encounter.
        const newBank = killedKey in (p.mobBank || {})
          ? Object.fromEntries(Object.entries(p.mobBank).filter(([k]) => k !== killedKey))
          : p.mobBank
        return {
          ...p,
          hero: { ...p.hero, xp: newXp, level: newLv, hp: newHp },
          kills: newKills,
          earned: newEarned,
          mobState: null,
          mobBank: newBank,
          focusIdx: newFocus,
        }
      })
      setBattlePhase('idle')

      if (isFinalBlow) {
        setVictoryBanner(true)
        sfx('fanfare')
        setTimeout(() => setVictoryBanner(false), 5000)
      }
    } else {
      // --- MOB SURVIVES — COUNTER-ATTACK ---
      // Mini-bosses only counter ~50% of the time so the flurry doesn't grind the hero.
      const counters = currentMob.isMiniBoss ? Math.random() < 0.5 : true
      if (counters) {
        await waitS(250)
        const foeDmg = currentMob.isBoss
          ? Math.floor(14 + Math.random() * 12)   // boss: 14–25
          : currentMob.isMiniBoss
            ? Math.floor(8 + Math.random() * 10)  // mini: 8–17
            : Math.floor(5 + Math.random() * 7)   // mob:  5–11
        setLastDmgHero(foeDmg)
        setBattleMsg(`${currentMob.mobName} strikes back!`)
        sfx('counter')
        setBattlePhase('foe-attack')
        await waitS(450)
        sfx('hurt')
        setBattlePhase('hit-hero')
        setState(p => ({
          ...p,
          hero: { ...p.hero, hp: Math.max(0, p.hero.hp - foeDmg), lastDmg: foeDmg },
        }))
        await waitS(500)
      }
      setBattlePhase('idle')
      setBattleMsg(`What will ${hero.name} do?`)
    }

    attacking.current = false

    // Kill branch already pruned the queue. On survival, shift only the beat
    // we just landed — any other entries (for this or a different mob) stay
    // in order. Mini-bosses auto-chain: if the queue no longer has an entry
    // for the (still alive) mini-boss at its head, unshift one so the fight
    // keeps swinging until the mob dies.
    if (newMobHp > 0) {
      pendingQueue.current.shift()
      if (currentMob.isMiniBoss) {
        const head = pendingQueue.current[0]
        const headKey = head != null ? questMobKey(schedule[head], head) : null
        if (headKey !== nextKey) pendingQueue.current.unshift(nextIdx)
      }
    }

    if (pendingQueue.current.length > 0) {
      const chainDelay = scaled(newMobHp <= 0 ? 950 : 300)
      setTimeout(() => {
        if (!attacking.current) attackRef.current?.()
      }, chainDelay)
    }
  }
  attackRef.current = attack

  function completeQuest(idx) {
    if (schedule[idx].done) return
    const questType = schedule[idx].type

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

      // Small heal on every quest completion. Main source of regen — kill
      // heals are gone (except Scholar's full-restore on mini-boss kills).
      const QUEST_HEAL = 8
      const newHp = Math.min(p.hero.maxHp, p.hero.hp + QUEST_HEAL)

      // Topic mastery: completing all content quests for a topic marks it gold (tier 3).
      // gold1 badge fires on the first topic mastered.
      let newMastery = p.mastery
      if (questType === 'content') {
        const topicName = p.schedule[idx].topic
        const topicIdx = SECTIONS[p.sect].topics.findIndex(t => t.n === topicName)
        if (topicIdx >= 0 && (p.mastery[topicIdx] ?? 0) < 3) {
          const allDone = newSchedule.every(q => q.topic !== topicName || q.type !== 'content' || q.done)
          if (allDone) newMastery = { ...p.mastery, [topicIdx]: 3 }
        }
      }

      const earned = [...p.earned]
      if (!earned.includes('log1')) earned.push('log1')
      if (sessions >= 5 && !earned.includes('log5')) earned.push('log5')
      if (streak >= 3 && !earned.includes('s3')) earned.push('s3')
      if (streak >= 7 && !earned.includes('s7')) earned.push('s7')
      if (hrs >= 10 && !earned.includes('hrs10')) earned.push('hrs10')
      if (readiness >= 50 && !earned.includes('half')) earned.push('half')
      if (readiness >= 80 && !earned.includes('ready')) earned.push('ready')
      if (Object.values(newMastery).some(t => t >= 3) && !earned.includes('gold1')) earned.push('gold1')

      return {
        ...p,
        schedule: newSchedule, sessions, hrs, streak, bestStreak, readiness,
        activity: newActivity,
        mastery: newMastery,
        hero: { ...p.hero, xp: newXp, level: newLv, hp: newHp },
        earned,
      }
    })

    const toastMsg = questType === 'review' ? '⚔ BOSS HIT!'
      : questType === 'practice' ? '✦ MINI-BOSS INCOMING!'
      : 'QUEST COMPLETE! +XP'
    showToast(toastMsg)

    // Practice quests spawn a 3–5 hit mini-boss flurry. Content/review queue
    // a single combat beat. Each entry is the quest's own idx so attack()
    // can look up the target encounter when it processes the queue — this
    // is what lets a pending Topic-A hit finish before a later Topic-C click
    // swaps mobs. The attack() front handles mob swap + bank save when the
    // queue head's encounter doesn't match mobState.
    const queued = questType === 'practice' ? 3 + Math.floor(Math.random() * 3) : 1
    for (let i = 0; i < queued; i++) pendingQueue.current.push(idx)
    if (!attacking.current) {
      setTimeout(() => attackRef.current?.(), scaled(350))
    }
  }
  completeQuestRef.current = completeQuest

  const bossPct = Math.max(0, Math.round((state.bossHp / state.bossMaxHp) * 100))
  const mobForArena = currentMob ? { ...currentMob, lastDmg: lastDmgMob } : null

  // Environment follows quest progress, as if traveling toward the boss.
  // Final Review phase = hell showdown; stays on hell once entered, even
  // after the final blow (when activeQuest becomes null and progress hits 1).
  const envStages = ['grass', 'meadow', 'desert', 'cave', 'snow']
  const totalQuests = schedule.length
  const doneQuests = schedule.filter(s => s.done).length
  const progress = totalQuests ? doneQuests / totalQuests : 0
  const firstReviewIdx = schedule.findIndex(q => q.type === 'review')
  const hasReachedHell = firstReviewIdx >= 0
    && (activeIdx < 0 || activeIdx >= firstReviewIdx)
  const arenaEnv = hasReachedHell
    ? 'hell'
    : envStages[Math.min(envStages.length - 1, Math.floor(progress * envStages.length))]

  return (
    <div className="app-wrap crt">
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <TopHud hero={hero} state={state} onOpenSettings={onOpenSettings} onReset={onReset} />

        <PaceTracker schedule={schedule} startDate={state.startDate} edate={state.edate} />

        {/* Boss bar: only shown during Full Review phase */}
        {inReviewPhase && (
          <BossBar boss={boss} sectData={sectData} bossHp={state.bossHp} bossMaxHp={state.bossMaxHp} bossPct={bossPct} />
        )}

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
              {[['quests', 'QUESTS'], ['map', 'MAP'], ['badges', 'BADGES']].map(([k, l]) => (
                <div key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => { sfx('click'); setTab(k) }}>{l}</div>
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
        <button className="px-btn sm ghost" onClick={() => { sfx('click'); onOpenSettings() }}>⚙ SETTINGS</button>
        <button className="px-btn sm ghost" onClick={() => { sfx('click'); onReset() }}>RESET</button>
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
            data-quest-idx={idx}
            className={'quest-row' + (q.done ? ' done' : '') + (isActive ? ' today' : '')}
            style={isReview && !q.done ? {
              borderLeft: '4px solid var(--blood)',
              background: 'rgba(177,62,83,0.08)',
            } : {}}
          >
            <div className={'quest-check' + (q.done ? ' on' : '')} onClick={() => { if (!q.done) { sfx('tick'); onComplete(idx) } }}>
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
