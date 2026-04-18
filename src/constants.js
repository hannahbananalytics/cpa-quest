export const SECTIONS = {
  FAR: {
    name: 'FAR',
    full: 'Financial Accounting & Reporting',
    boss: { name: 'Balthazar the Balance Sheet', emoji: '🗿', tagline: 'Keeper of the Ledger Vault' },
    color: '#41a6f6',
    topics: [
      { n: 'Financial Statements', w: '25-35%', mob: '📊', mobName: 'Statement Slime' },
      { n: 'Transactions',         w: '20-30%', mob: '💸', mobName: 'Ledger Imp' },
      { n: 'State & Local Gov.',   w: '5-15%',  mob: '🏛️', mobName: 'GASB Gargoyle' },
      { n: 'Not-for-Profit',       w: '5-15%',  mob: '🕊️', mobName: 'Nonprofit Nymph' },
      { n: 'Select Transactions',  w: '10-20%', mob: '🧾', mobName: 'Receipt Wraith' },
      { n: 'Employee Benefits',    w: '5-10%',  mob: '💼', mobName: 'Pension Phantom' },
    ],
  },
  AUD: {
    name: 'AUD',
    full: 'Auditing & Attestation',
    boss: { name: 'Auditrix the Unseen', emoji: '👁️', tagline: 'Warden of the Red Flag Tower' },
    color: '#b13e53',
    topics: [
      { n: 'Ethics & Independence', w: '15-25%', mob: '⚖️', mobName: 'Ethics Wisp' },
      { n: 'Risk Assessment',       w: '25-35%', mob: '🎯', mobName: 'Risk Wyrm' },
      { n: 'Audit Procedures',      w: '20-30%', mob: '🔍', mobName: 'Sample Slurper' },
      { n: 'Forming Conclusions',   w: '15-20%', mob: '📝', mobName: 'Opinion Ogre' },
    ],
  },
  REG: {
    name: 'REG',
    full: 'Taxation & Regulation',
    boss: { name: 'The Tax Titan', emoji: '👹', tagline: 'Sovereign of the IRS Dungeon' },
    color: '#ef7d57',
    topics: [
      { n: 'Ethics & Law',          w: '10-20%', mob: '📜', mobName: 'Circ 230 Specter' },
      { n: 'Individual Tax',        w: '15-25%', mob: '💰', mobName: '1040 Goblin' },
      { n: 'Entity Tax',            w: '28-38%', mob: '🏢', mobName: 'Corporate Cryptid' },
      { n: 'Property Transactions', w: '10-20%', mob: '🏠', mobName: 'Basis Banshee' },
      { n: 'Multijurisdictional',   w: '5-10%',  mob: '🌐', mobName: 'Nexus Naga' },
    ],
  },
  BAR: {
    name: 'BAR',
    full: 'Business Analysis & Reporting',
    boss: { name: 'Lord Varex of Variance', emoji: '🐉', tagline: 'Dragon of the Data Citadel' },
    color: '#38b764',
    topics: [
      { n: 'Business Analysis',    w: '40-50%', mob: '📈', mobName: 'Forecast Fiend' },
      { n: 'Financial Risk',       w: '20-30%', mob: '⚠️', mobName: 'Hedge Hydra' },
      { n: 'Operations Mgmt',      w: '10-20%', mob: '⚙️', mobName: 'Ops Oozling' },
      { n: 'Financial Statements', w: '10-20%', mob: '📑', mobName: 'Consol Cretin' },
    ],
  },
  ISC: {
    name: 'ISC',
    full: 'Information Systems & Controls',
    boss: { name: 'SOCron the Server', emoji: '🤖', tagline: 'Archon of the Server Spire' },
    color: '#7f77dd',
    topics: [
      { n: 'IT Systems',         w: '35-45%', mob: '💾', mobName: 'Backup Basilisk' },
      { n: 'Security & Privacy', w: '25-35%', mob: '🔐', mobName: 'Cipher Centaur' },
      { n: 'Emerging Tech',      w: '10-20%', mob: '🧠', mobName: 'AI Arachnid' },
      { n: 'Business Processes', w: '10-20%', mob: '🔄', mobName: 'Workflow Wyrm' },
    ],
  },
  TCP: {
    name: 'TCP',
    full: 'Tax Compliance & Planning',
    boss: { name: 'The Planner of Endgame', emoji: '🎩', tagline: 'Regent of the Vault of Brackets' },
    color: '#ffcd75',
    topics: [
      { n: 'Individual Planning',   w: '30-40%', mob: '👤', mobName: 'Deduction Dryad' },
      { n: 'Entity Planning',       w: '30-40%', mob: '🏦', mobName: 'S-Corp Satyr' },
      { n: 'Property Transactions', w: '10-20%', mob: '🏘️', mobName: '1031 Imp' },
      { n: 'Multi-jurisdictional',  w: '10-20%', mob: '🗺️', mobName: 'Apportion Ape' },
    ],
  },
}

export const CLASSES = [
  { id: 'grinder',    name: 'The Grinder',    emoji: '⚔️', color: '#ffcd75', bonus: '+20% XP per session',      stat: 'XP' },
  { id: 'strategist', name: 'The Strategist', emoji: '🧠', color: '#41a6f6', bonus: '2× damage on weak topics', stat: 'ATK' },
  { id: 'clutch',     name: 'The Clutch',     emoji: '⚡', color: '#a7f070', bonus: '1.5× streak multiplier',    stat: 'CRIT' },
  { id: 'scholar',    name: 'The Scholar',    emoji: '📚', color: '#ef7d57', bonus: 'MCQ review grants bonus HP', stat: 'DEF' },
]

export const WEAPONS = [
  { id: 'pencil',    emoji: '✏️', name: 'No. 2 Pencil',      desc: 'Classic starter. +5 ATK' },
  { id: 'calc',      emoji: '🧮', name: 'Financial Calc',    desc: 'Solid crunch. +3 ATK, +3 DEF' },
  { id: 'scroll',    emoji: '📜', name: 'Scroll of GAAP',    desc: 'Ancient knowledge. +7 CRIT' },
  { id: 'laptop',    emoji: '💻', name: 'Excel Tome',        desc: 'Multi-tool. +2 all stats' },
  { id: 'coffee',    emoji: '☕', name: 'Eternal Coffee',    desc: '+10 HP regen on streak' },
  { id: 'highlight', emoji: '🖍️', name: 'Prism Highlighter', desc: '+6 ATK on weak topics' },
]

export const AVATARS = [
  '🧙‍♂️','🧙‍♀️','🧝‍♂️','🧝‍♀️','🧛‍♂️','🧛‍♀️',
  '🥷','🧑‍💼','👩‍💼','🧑‍🎓','👨‍🎓','👩‍🎓',
  '🧑‍💻','🦸','🦸‍♀️','🧞','🐉','🐺',
  '🐱','🦊','🦉','🦅','🐻','🐼',
]

export const TITLES = [
  'The Debit Destroyer','The Ledger Lord','The Accrual Adept',
  'The Variance Vanquisher','Slayer of Schedules','The GAAP Gladiator',
  'The Reconciler','The Tax Tempest','The Audit Ace',
  'The Balance Beast','The FASB Forger','The Midnight Studier',
]

export const BADGES = [
  { id: 'start', icon: '🚀', name: 'JOURNEY',       desc: 'Created first plan' },
  { id: 'log1',  icon: '✏️', name: 'FIRST STEP',    desc: 'Logged first session' },
  { id: 's3',    icon: '🔥', name: 'ON FIRE',       desc: '3-day streak' },
  { id: 's7',    icon: '⚡', name: 'WEEK WARRIOR',  desc: '7-day streak' },
  { id: 'log5',  icon: '🏃', name: 'MOMENTUM',      desc: '5 sessions logged' },
  { id: 'mob10', icon: '⚔️', name: 'MOB HUNTER',   desc: 'Slay 10 mobs' },
  { id: 'mini1', icon: '👺', name: 'MINI-BOSS',    desc: 'Defeated a mini-boss' },
  { id: 'boss1', icon: '👑', name: 'BOSS SLAYER',  desc: 'Defeated the final boss' },
  { id: 'half',  icon: '🎯', name: 'HALFWAY',      desc: '50% readiness' },
  { id: 'ready', icon: '🏆', name: 'BOARD READY',  desc: '80% readiness' },
  { id: 'gold1', icon: '🌟', name: 'GOLD MASTERY', desc: 'Gold on any topic' },
  { id: 'hrs10', icon: '📚', name: 'SCHOLAR',      desc: '10+ hours logged' },
]

export const LEVEL_NAMES = [
  'Intern','Tax Novice','MCQ Apprentice','Audit Analyst',
  'Senior Associate','CPA Contender','Board Warrior','CPA Legend',
]
export const LEVEL_XP = [0, 300, 800, 1600, 2800, 4500, 7000, 10000]

export function computeLevel(xp) {
  let lv = 1
  for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) lv = i + 1
  return lv
}
export function xpPct(xp, level) {
  const cur = LEVEL_XP[level - 1] || 0
  const nxt = LEVEL_XP[level] ?? (LEVEL_XP[LEVEL_XP.length - 1] + 2000)
  return Math.max(0, Math.min(100, Math.round(((xp - cur) / (nxt - cur)) * 100)))
}
export function xpToNext(level) {
  return LEVEL_XP[level] ?? (LEVEL_XP[LEVEL_XP.length - 1] + 2000)
}
