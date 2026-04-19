# CPA Quest — Game Mechanics Audit

> Written for the builder. Documents actual implemented behavior as of April 2026.
> Covers every formula, rule, and system in the codebase.

### Core Terminology

| Term | Definition |
|------|------------|
| **Topic** | A major exam-content concept from the CPA section blueprint (e.g. "Revenue Recognition", "Audit Sampling"). Topics are the higher-level curriculum units. Each section has 12–22 topics. |
| **Quest** | An individual playable study task shown in the quest log. A topic maps to one or more quests. Larger topics get more quests; smaller topics may get just one. |
| **MCQ / TBS Practice quest** | A checkpoint quest inserted automatically after every topic block is complete. Always `type: 'practice'`. Spawns a mini-boss encounter. |
| **Full Review quest** | A quest in the final phase of the schedule. Always `type: 'review'`. Spawns the section's final boss. |

---

## Table of Contents

1. [Game Flow Overview](#1-game-flow-overview)
2. [Character Creator](#2-character-creator)
3. [Section Picker & Schedule Builder](#3-section-picker--schedule-builder)
4. [State Shape](#4-state-shape)
5. [Quest System](#5-quest-system)
6. [Combat System](#6-combat-system)
7. [Mob System](#7-mob-system)
8. [Boss System](#8-boss-system)
9. [XP & Leveling](#9-xp--leveling)
10. [Readiness](#10-readiness)
11. [Streak & Activity Tracking](#11-streak--activity-tracking)
12. [Pace Tracker](#12-pace-tracker)
13. [Badges](#13-badges)
14. [Skill Tree / Mastery](#14-skill-tree--mastery)
15. [World Map](#15-world-map)
16. [Battle Arena & Environment](#16-battle-arena--environment)
17. [Stats Display](#17-stats-display)
18. [Data Persistence](#18-data-persistence)
19. [Settings & Reset](#19-settings--reset)
20. [Dead Code & Known Issues](#20-dead-code--known-issues)

---

## 1. Game Flow Overview

The app has three phases, stored in `state.phase`:

```
creator → section → dashboard
```

- **creator**: Character Creator (6-step wizard). Runs when `state.hero` is null or `phase === 'creator'`.
- **section**: Section Picker. Runs when `phase === 'section'` or `state.plan === false`.
- **dashboard**: Main game loop. Runs once a section is confirmed and `state.plan === true`.

State is persisted to `localStorage` on every change (key: `cpa-quest-8bit-v1`).

---

## 2. Character Creator

A 6-step wizard. All choices are saved to `state.hero` at the end.

| Step | Field | Options | Default |
|------|-------|---------|---------|
| 0 | Avatar | 24 emoji | 🧙‍♂️ |
| 1 | Name | Free text, max 16 chars | "Candidate" |
| 2 | Class | 4 classes | Grinder |
| 3 | Weapon | 6 weapons | Pencil |
| 4 | Title | 12 titles | "The Debit Destroyer" |
| 5 | Confirm | — | — |

### Hero initial stats (set in `onHeroComplete`):
```
level: 1
xp: 0
hp: 100
maxHp: 100
```

### Classes — actual implemented effects

| ID | Name | Real Effect |
|----|------|-------------|
| `grinder` | The Grinder | Quest XP gain × 1.2 |
| `strategist` | The Strategist | Base attack damage 28 (others: 22) |
| `clutch` | The Clutch | Crit chance 25% (others: 10%) |
| `scholar` | The Scholar | **Not implemented** — bonus is cosmetic only |

### Weapons — all cosmetic

The `desc` field shows flavor text ("+5 ATK", etc.) but **no weapon stat is read anywhere in the game logic**. All 6 weapons are purely visual.

### Titles — all cosmetic

12 options, displayed on the hero card and HUD. No gameplay effect.

---

## 3. Section Picker & Schedule Builder

### Sections

| ID | Full Name | Topics | Baseline Hours |
|----|-----------|--------|----------------|
| FAR | Financial Accounting & Reporting | 22 | 120–150 |
| AUD | Auditing & Attestation | 12 | 110–140 |
| REG | Taxation & Regulation | 13 | 80–110 |
| BAR | Business Analysis & Reporting | 15 | 120–150 |
| ISC | Information Systems & Controls | 12 | 60–90 |
| TCP | Tax Compliance & Planning | 12 | 60–90 |

Each section has a boss, a color, and a list of topics. Each topic has a name (`n`), mob emoji (`mob`), and mob name (`mobName`).

### User Inputs

| Field | Default | Range | Purpose |
|-------|---------|-------|---------|
| Exam Date | today + 60 days | any future date | Drives total slot count and pacing |
| Study Hours / Day (`dhrs`) | 3 | 1–12 | Used to estimate recommended days and accumulate `hrs` stat |

### Pacing Indicator (shown on Section Picker)

```
midHrs = (minHrs + maxHrs) / 2
recommendedDays = round(midHrs / dhrs)
availDays = ceil((examDate - today) / 86400000)

ON TRACK   → availDays >= recommendedDays
TIGHT      → availDays >= recommendedDays × 0.75
VERY TIGHT → availDays < recommendedDays × 0.75
```

### Schedule Builder (`buildSchedule` in App.jsx)

Quests are ordered in sequence. **No calendar dates are attached to individual quests.**
The exam date influences total slot count and the Pace Tracker, but not which quest belongs to which day.

```
midHrs = (minHrs + maxHrs) / 2
recommendedDays = round(midHrs / dhrs)

dl = max(topics.length + 3, ceil((examDate - today) / 86400000))

revCount = max(3, round(dl × 0.12))
contentSlots = dl - revCount
slotsPerTopic = max(1, floor(contentSlots / topics.length))
```

**Quest sequence generation:**

Topics are assigned in blocks. After each topic block, one MCQ / TBS Practice quest is inserted as a checkpoint. The last topic absorbs any leftover content slots.

```
for each topic t:
  slots = slotsPerTopic  (last topic: contentSlots - t × slotsPerTopic)
  push slots × topic.n           (type: 'content')
  push 1 × 'MCQ / TBS Practice' (type: 'practice')

then append revCount × 'Full Review' (type: 'review')
```

**Quest type → encounter mapping:**

| Quest type | Encounter |
|------------|-----------|
| `content` | Normal topic mob |
| `practice` | Mini-boss (topic checkpoint) |
| `review` | Final boss |

**Quest entry shape (no date field):**
```js
{ topic: string, type: 'content' | 'practice' | 'review', done: boolean }
```

**Boss HP:**
```
bossMaxHp = max(600, schedule.length × 20)
```
Boss HP is calculated from the full schedule length (including practice quests) after the schedule is built.

**`startDate`** (ISO string for plan creation day) is stored in state alongside `edate` for use by the Pace Tracker.

---

## 4. State Shape

```js
{
  phase: 'creator' | 'section' | 'dashboard',
  hero: {
    name, avatar, clsId, title, weaponId,
    level, xp, hp, maxHp
  },
  sect: string,          // e.g. 'FAR'
  edate: string,         // ISO date string (exam date)
  dhrs: number,          // study hours per day
  plan: boolean,
  schedule: [...],       // ordered quest entries, no dates
  activity: {},          // { 'YYYY-MM-DD': 'done' } — calendar streak tracking
  mastery: {},           // { topicIdx: tier } — never updated (see §19)
  streak: number,
  bestStreak: number,
  sessions: number,
  hrs: number,           // cumulative hours (sessions × dhrs)
  kills: number,
  readiness: number,     // 0–100
  earned: string[],      // badge IDs
  bossHp: number,
  bossMaxHp: number,
  mobState: object|null, // persisted current mob
  startDate: string,     // ISO date string (when plan was created)
  xpMult: number,        // always 1, never used (see §19)
}
```

---

## 5. Quest System

### Active Quest Selection

```
activeIdx = schedule.findIndex(q => !q.done)
activeQuest = schedule[activeIdx]  // null if all done
```

The active quest is always the **first undone quest in sequence**. There is no date-matching or "today's quest" concept. Players can complete quests on any day and at any pace.

### Completing a Quest (`completeQuest(idx)`)

Triggered by clicking the checkmark on a quest row. Only the active quest (first undone) is highlighted with `▶ CURRENT`; any undone quest can technically be checked off by clicking its row.

Runs in this order:

1. Marks `schedule[idx].done = true`
2. `sessions += 1`
3. `hrs += dhrs` (adds configured daily hours, not actual elapsed time)
4. Calculates streak (see §11)
5. `readiness += round(80 / max(schedule.length, 30))`, capped at 100
6. `xpGain = 80 + (streak × 10)` — if Grinder class, `xpGain × 1.2`
7. `hero.xp += xpGain`, level recalculated via `computeLevel(xp)`
8. `hero.hp = min(maxHp, hp + 10)` — heals 10 HP on quest complete
9. `activity[todayKey()] = 'done'`
10. Badge checks run (see §13)
11. Triggers `attack(true)` after 350ms delay → one-shot kills the current mob

### MCQ / TBS Practice Quests

One **MCQ / TBS Practice** quest is inserted automatically after every topic block. There is no user-configurable frequency — the number of practice quests always equals the number of topics in the section (12–22 depending on section).

These quests spawn a **mini-boss** encounter (see §7). Completing a practice quest follows the same XP/readiness logic as any content quest.

---

## 6. Combat System

Combat runs automatically. Players have no manual attack button. All animations are handled by the `BattleArena` component (a separate file, `BattleArena.jsx`).

### Quest Complete Attack (`attack(isComplete = true)`)

When a quest is marked done, a special attack fires that always kills the mob in one hit:
```
dmg = currentMob.mobHp
```

### Regular Attack (`attack(isComplete = false)`)

Not currently exposed to the user via UI, but the logic still exists:
```
crit = random() < (clutch: 0.25, others: 0.10)
base = (strategist: 28, others: 22)
dmg = floor(base + random(0–12)) × (crit ? 2 : 1)
```

### Weapon Throw

A separate `attacksUntilThrow` ref tracks when the next throw occurs. It resets to `1 + floor(random × 4)` (so 1–4 attacks until the next throw). When a throw triggers, the `hero-throw` animation phase fires instead of `hero-attack`, the weapon emoji flies across the screen as a projectile, and the attack takes 550ms instead of 450ms. Throw animation uses the weapon selected in character creation.

### Mob Counterattack

If the mob survives a regular attack:
```
foeDmg = floor(8 + random(0–8))   // 8–16 damage
hero.hp -= foeDmg
```

### Attack Chaining (Rapid Completions)

`pendingKills` is a ref that queues up mobs to kill when multiple quests are checked off quickly. When a fresh mob spawns and `pendingKills > 0`, the next `attack(true)` fires automatically after 350ms. This means checking off several quests in a row plays out as a sequential combat chain rather than jumping immediately to the new active quest.

### Mob Death Rewards

During the **normal quest phase** (content and practice quests):
```
xpGain = isMiniBoss ? 150 : 60
hero.xp += xpGain
bossHp unchanged   // boss HP does NOT change from normal mob kills
kills += 1
mobState = null
```

During the **Full Review phase** (boss battles — see §8):
```
xpGain = 250   // isBoss
hero.xp += xpGain
bossHp -= dmgPerReview   // = ceil(bossMaxHp / reviewCount)
kills += 1
mobState = null
if bossHp <= 0: earn 'boss1' badge
```

**Boss HP is only reduced during the Full Review phase.** Normal mob kills, including mini-bosses, do not damage the final boss.

### Final Blow Sequence

When the last review quest lands (`isBoss && bossHp <= dmgPerReview`), a special finisher plays instead of the normal faint:
```
phase → 'boss-finisher' → wait 700ms → message: "☠ FINAL BLOW! ☠"
phase → 'boss-shatter'  → wait 1700ms → message: "{boss.name} IS VANQUISHED!"
```
After the finisher, a `victoryBanner` state fires and auto-dismisses after 5 seconds (see §8).

---

## 7. Mob System

A new mob spawns whenever `mobState` is null. Mob type depends on the current game phase.

### Fight Pointer vs. Active Quest

Two separate pointers exist:

- `activeIdx` — first undone quest in the schedule. Used for UI labels (`▶ CURRENT`) and the Pace Tracker.
- `fightIdx = state.kills` — drives which mob spawns. Because one kill is recorded per quest completion, this pointer trails behind `activeIdx` when quests are completed faster than combat animations play out, enabling the attack-chaining queue (see §6).

`inReviewPhase` is determined by `fightQuest?.type === 'review'` (not `activeQuest`), so the boss reveal and boss HP bar switch to review mode in sync with the actual combat, not the quest log cursor.

### Normal Quest Phase (content & practice quests)

Quest type directly determines encounter type — no interval or positional logic:

| Quest type | Encounter |
|------------|-----------|
| `content` | Normal mob (topic mob emoji, 60–100 HP) |
| `practice` | Mini-boss (topic emoji from fallback, 180 HP) |
| `review` | Final boss (see Full Review Phase below) |

```
fightIdx = state.kills
fightQuest = schedule[fightIdx]
topicIdx = sectData.topics.findIndex(t => t.n === fightQuest.topic)
topic = sectData.topics[topicIdx]  (falls back to topics[0] if not found)

isMiniBoss = fightQuest.type === 'practice'

Regular mob (content quest):
  emoji    = topic.mob
  name     = topic.mobName
  hp       = 60 + floor(random × 40)   // 60–100 HP
  level    = hero.level
  isBoss   = false

Mini-boss (practice quest):
  emoji    = 👺
  name     = topic.n + ' MINI-BOSS'
  hp       = 180
  level    = hero.level + 2
  isBoss   = false
```

- Practice quests use `topics[0]` as the fallback topic (since `'MCQ / TBS Practice'` is not in the topic list).

### Full Review Phase (boss quests)

When `fightQuest.type === 'review'`, `currentMob` returns the section's final boss instead of a topic mob:

```
reviewCount = schedule.filter(q => q.type === 'review').length
dmgPerReview = ceil(bossMaxHp / reviewCount)

Boss mob:
  emoji      = boss.emoji
  name       = boss.name
  level      = 99
  isBoss     = true
  isMiniBoss = false
  mobMaxHp   = dmgPerReview
  mobHp      = dmgPerReview
```

Each review quest spawns the boss with exactly `dmgPerReview` HP, so completing all review quests deals exactly `bossMaxHp` total damage, guaranteed to drop boss HP to 0.

- `mobState` is persisted to localStorage, so the same mob reappears on refresh.

---

## 8. Boss System

Each section has one final boss. The boss is hidden during normal quests and only appears during the Full Review phase.

### Boss HP

```
bossMaxHp = max(600, totalSlots × 20)
```
where `totalSlots = dl` (total quest count derived from exam date and hours/day).

### Boss HP Bar Visibility

The Boss HP bar is **hidden during normal quests** (content and practice phases). It only renders when `inReviewPhase === true` (i.e., the active quest has `type === 'review'`).

### Boss HP Loss

Boss HP decreases **only during the Full Review phase**, one hit per review quest completed:
```
dmgPerReview = ceil(bossMaxHp / reviewCount)
on each review quest complete: bossHp -= dmgPerReview
```

This guarantees `bossHp` reaches exactly 0 after all review quests are done, regardless of HP rounding.

### Boss Reveal Overlay

When the player transitions from a non-review quest to the first review quest, a full-screen overlay fires:
- Black translucent background (92% opacity)
- Boss emoji (120px, animated bob)
- Text: "▲ {BOSS NAME} AWAKENS ▲" and "FINAL REVIEW PHASE BEGINS"
- Auto-dismisses after 4 seconds (`pointerEvents: none`, so it doesn't block interaction)
- **Does not re-trigger on page reload** — uses a double-ref pattern (`hasInitRef` + `prevQuestTypeRef`) initialized before the effect runs.

### Quest Log Styling During Review Phase

Review quest rows are styled distinctly:
- Left border: `var(--blood)` (red), 3px
- Background: dark red tint
- Icon: boss emoji instead of topic mob
- Label: `FINAL REVIEW — {boss.name}`
- Type badge: `BOSS PHASE` (red)

### Win Condition

When the final blow lands, two things happen in sequence:

1. **Finisher animation** plays in the arena (see §6 — `boss-finisher` → `boss-shatter`).
2. **Victory banner overlay** appears for 5 seconds (`.victory-overlay` CSS class):
   ```
   VICTORY!
   {BOSS NAME} HAS FALLEN
   +500 XP · +1 BOSS SLAYER BADGE
   ```
   Note: the "+500 XP" shown in the banner is flavor text only — XP is already awarded by the `attack()` function (250 XP) during the finisher.

After the banner, the arena area transitions to a static defeated screen:
```
{boss.emoji}
★ {BOSS NAME} DEFEATED ★
Run complete. Well done.
```

### Boss Rage States (visual only, during review phase)

| Condition | Label | Color |
|-----------|-------|-------|
| HP > 60% | ENRAGED | Red |
| HP > 30% | WEAKENED | Orange |
| HP > 0% | NEAR DEFEAT | Green |
| HP = 0 | SLAIN | Green |

---

## 9. XP & Leveling

### Level Thresholds

| Level | XP Required | Title |
|-------|-------------|-------|
| 1 | 0 | Intern |
| 2 | 300 | Tax Novice |
| 3 | 800 | MCQ Apprentice |
| 4 | 1,600 | Audit Analyst |
| 5 | 2,800 | Senior Associate |
| 6 | 4,500 | CPA Contender |
| 7 | 7,000 | Board Warrior |
| 8 | 10,000 | CPA Legend |

### XP Sources

| Event | XP Gained |
|-------|-----------|
| Quest complete (base) | 80 + (streak × 10) |
| Quest complete (Grinder) | (80 + streak × 10) × 1.2 |
| Regular mob kill | 60 |
| Mini-boss kill | 150 |
| Boss mob kill (review phase) | 250 |

### Level Computation

```js
computeLevel(xp):
  lv = 1
  for each threshold in LEVEL_XP:
    if xp >= threshold: lv = i + 1
  return lv
```

---

## 10. Readiness

Readiness represents exam prep progress, shown as 0–100%.

```
initialReadiness = 0  (set when section is confirmed)

per quest completed:
  readiness += round(80 / max(schedule.length, 30))
  readiness = min(100, readiness)
```

At 30+ scheduled quests, each quest adds ~2–3%. For shorter plans the increment is larger.

---

## 11. Streak & Activity Tracking

Streak tracks **consecutive calendar days** on which at least one quest was completed. It does **not** require quests to be completed every day — it simply rewards days where the player does show up.

### Streak Calculation (runs on every quest complete)

```
yesterday = localDateKey(today - 1 day)  // uses local timezone

if activity[yesterday] === 'done' OR sessions === 1:
  streak += 1
else:
  streak = 1

bestStreak = max(streak, bestStreak)
```

The streak increments on your **first ever session** regardless (sessions === 1), then requires a consecutive calendar day thereafter.

### Activity Log

`activity` is a flat object: `{ 'YYYY-MM-DD': 'done' }`. Only one entry per calendar day is recorded.

---

## 12. Pace Tracker

The Pace Tracker is a full-width component shown between the Boss Bar and the main grid. It communicates schedule health relative to the exam date without requiring daily play.

### How It Works

```
total       = schedule.length
completed   = schedule.filter(q => q.done).length
daysTotal   = ceil((examDate - startDate) / 86400000)
daysElapsed = clamp(ceil((today - startDate) / 86400000), 0, daysTotal)
daysLeft    = max(0, ceil((examDate - today) / 86400000))

// Linear expected progress: where should the player be right now?
expectedPos = round((daysElapsed / daysTotal) × total)

gap = completed - expectedPos
```

### Status Thresholds

| Status | Condition | Bar Color |
|--------|-----------|-----------|
| AHEAD | gap > 2 | Green |
| ON PACE | gap >= −2 and <= 2 | Gold |
| BEHIND | gap < −2 | Red |

### Visual Design

```
PACE TRACKER          12/45 quests    38d until exam    [ON PACE]

[████████████░░░░░░◆░░░░░░░░░░░░░░░░░░░░░░]
                   ↑ white tick = expected position today

START           3 quests behind           EXAM
```

- **Filled bar** (colored): quests completed
- **White tick**: where the player should be by today based on the fraction of calendar time elapsed
- **Gap label**: shows absolute number of quests ahead or behind (hidden if exactly on pace)

The tracker uses `state.startDate` (set when the plan is created) and `state.edate` (exam date). Both dates use local midnight for comparison.

---

## 13. Badges

Badges are earned once and stored as IDs in `state.earned`. They never un-earn.

| ID | Icon | Name | Trigger |
|----|------|------|---------|
| `start` | 🚀 | JOURNEY | Section confirmed (onSectionComplete) |
| `log1` | ✏️ | FIRST STEP | First quest completed or first mob killed on complete |
| `s3` | 🔥 | ON FIRE | streak >= 3 |
| `s7` | ⚡ | WEEK WARRIOR | streak >= 7 |
| `log5` | 🏃 | MOMENTUM | sessions >= 5 |
| `mob10` | ⚔️ | MOB HUNTER | kills >= 10 |
| `mini1` | 👺 | MINI-BOSS | First mini-boss killed |
| `boss1` | 👑 | BOSS SLAYER | Boss HP reaches 0 during the Full Review phase |
| `half` | 🎯 | HALFWAY | readiness >= 50 |
| `ready` | 🏆 | BOARD READY | readiness >= 80 |
| `gold1` | 🌟 | GOLD MASTERY | mastery tier 3 on any topic — **currently unearnable** |
| `hrs10` | 📚 | SCHOLAR | hrs >= 10 |

Checks for `s3`, `s7`, `log5`, `hrs10`, `half`, `ready` run on every `completeQuest`. Checks for `mob10`, `mini1`, `boss1` run on mob/boss death in `attack()`.

---

## 14. Skill Tree / Mastery

The Skills tab shows all topics for the current section with a 4-pip mastery bar (bronze → silver → gold → plat).

```
mastery[topicIdx] = tier (0–4)
```

**The mastery object is initialized as `{}` and is never updated anywhere in the codebase.** Every topic always displays tier 0. The `gold1` badge (tier 3 on any topic) is therefore unearnable.

---

## 15. World Map

Displays **all quests** as nodes on a snake-path layout. Quest positions are shown, not calendar days.

```
COLS = 7 (nodes per row)
rows = ceil(total / COLS)
mapHeight = max(260, rows × 64)

Y_START = 10%, Y_END = 90%
yStep = (Y_END - Y_START) / (rows - 1)

For each quest i:
  row = floor(i / COLS)
  col = row % 2 === 0 ? (i % COLS) : (COLS - 1 - i % COLS)  // alternating direction
  x = 8 + col × 14 (%)
  y = Y_START + row × yStep (%)
```

**Node icons:**

| Condition | Icon |
|-----------|------|
| `q.done` | ✓ |
| Last quest AND `type === 'review'` | `boss.emoji` (Final Boss node) |
| `type === 'review'` (other) | 📖 |
| `type !== 'review'` AND `(i+1) % 7 === 0` | 👺 (Mini-boss) |
| `type === 'practice'` | 🎯 |
| Default | `topic.mob` emoji |

**Additional map elements:**
- SVG polyline connector trail linking all node positions (dashed, non-scaling stroke)
- Start flag 🏁 at the first node position
- Hero avatar bobs above the active node (CSS animation)

**Map legend** shown below the map:
`🏁 Start · 🎯 Practice · 👺 Mini-boss · 📖 Review · {boss.emoji} Final Boss`

---

## 16. Battle Arena & Environment

The `BattleArena` component (`BattleArena.jsx`) renders the combat scene. It receives a `phase` prop and a `env` prop from Dashboard.

### Arena Environment

The arena CSS class (`arena--{env}`) changes as the player progresses through the quest list:

```
progress = doneQuests / totalQuests
envStages = ['grass', 'meadow', 'desert', 'cave', 'snow']
arenaEnv = inReviewPhase ? 'hell' : envStages[floor(progress × 5)]
```

The environment progresses from green fields to hellscape as the player advances, reaching 'hell' the moment the review phase begins.

### Animation Phases

| Phase | Meaning |
|-------|---------|
| `idle` | No action |
| `hero-attack` | Hero lunges forward |
| `hero-throw` | Hero throws weapon (projectile emoji flies across) |
| `hit-hero` | Hero takes damage (flash + float number) |
| `foe-attack` | Enemy lunges forward |
| `hit-foe` | Enemy takes damage (flash + float number) |
| `faint-foe` | Enemy collapses after normal death |
| `boss-finisher` | Boss staggers during final blow; screen shakes |
| `boss-shatter` | Boss shatters/disappears |

---

## 17. Stats Display

Four stat boxes below the battle arena on the left:

| Label | Source | Notes |
|-------|--------|-------|
| STREAK | `state.streak + 'd'` | Consecutive days with a quest completed |
| HOURS | `state.hrs + 'h'` | `sessions × dhrs`, not real clock time |
| MOBS SLAIN | `state.kills` | Counts regular + mini-boss kills |
| READINESS | `state.readiness + '%'` | 0–100%, see §10 |

---

## 18. Data Persistence

All state is serialized to `localStorage` under key `cpa-quest-8bit-v1` on every state update via `useEffect`.

On mount, `loadState()` reads and parses this key. If absent or unparseable, `defaultState()` is used.

**There is no migration logic.** Old saves from before the scheduling refactor (which stored `day` and `date` fields per quest) will load but the Pace Tracker may not work correctly if `startDate` is null.

---

## 19. Settings & Reset

### Settings Panel
- **CRT Scanlines**: toggles `.no-crt` class on the root div. ON by default.

### Reset Flow
1. User clicks RESET → `resetConfirmOpen = true`
2. Confirm dialog appears
3. On confirm: `localStorage.removeItem('cpa-quest-8bit-v1')`, state set to `defaultState()`
4. Returns player to Character Creator

---

## 20. Dead Code & Known Issues

| Item | Location | Issue |
|------|----------|-------|
| `mastery` state | App.jsx, Dashboard.jsx | State field exists, SkillTree renders it, but nothing ever writes to it. All topics permanently show tier 0. `gold1` badge is unreachable. |
| `xpMult` | App.jsx defaultState | Always `1`, never read or applied. |
| Scholar class bonus | constants.js | Described as "MCQ review grants bonus HP" — never implemented. |
| Weapon stats | constants.js | All weapon `desc` values mention stat bonuses — none are read by any game logic. Purely cosmetic. |
| Title choice | CharacterCreator.jsx | Purely cosmetic, no gameplay effect. |
| Stale saves | localStorage | Saves from before this refactor may contain `mcqFreq` in state or old `'MCQ Practice'` topic strings. These fields are harmless but the topic label in old saves will show "MCQ Practice" instead of "MCQ / TBS Practice". Reset clears this. |
| Regular attack UI | Dashboard.jsx | `attack(false)` logic exists but is never triggered via UI. Combat only happens automatically via `attack(true)` on quest complete. |
