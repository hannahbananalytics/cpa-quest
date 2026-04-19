export const SECTIONS = {
  FAR: {
    name: 'FAR',
    full: 'Financial Accounting & Reporting',
    minHrs: 120, maxHrs: 150,
    boss: { name: 'Balthazar the Balance Sheet', emoji: '🗿', tagline: 'Keeper of the Ledger Vault' },
    color: '#41a6f6',
    topics: [
      { n: 'Financial Statements: For-Profit Entities', mob: '📊', mobName: 'Statement Slime' },
      { n: 'NFP Financial Statements',                  mob: '🕊️', mobName: 'NFP Nymph' },
      { n: 'Governmental Basics',                       mob: '🏛️', mobName: 'GASB Gargoyle' },
      { n: 'Public Company Reporting & EPS',            mob: '📈', mobName: 'EPS Entity' },
      { n: 'Special Purpose Frameworks',                mob: '📐', mobName: 'Framework Fiend' },
      { n: 'Ratios & Performance Metrics',              mob: '📉', mobName: 'Ratio Rat' },
      { n: 'Cash',                                      mob: '💵', mobName: 'Cash Creep' },
      { n: 'Receivables',                               mob: '📬', mobName: 'AR Apparition' },
      { n: 'Inventory',                                 mob: '📦', mobName: 'Inventory Imp' },
      { n: 'PPE',                                       mob: '🏗️', mobName: 'Depreciation Demon' },
      { n: 'Investments',                               mob: '💹', mobName: 'Investment Imp' },
      { n: 'Intangibles',                               mob: '🌀', mobName: 'Goodwill Ghost' },
      { n: 'Payables & Accrued Liabilities',            mob: '💳', mobName: 'AP Phantom' },
      { n: 'Debt',                                      mob: '🏦', mobName: 'Debt Dragon' },
      { n: 'Equity',                                    mob: '📜', mobName: 'Equity Entity' },
      { n: 'Accounting Changes & Error Corrections',    mob: '🔄', mobName: 'Error Eater' },
      { n: 'Contingencies',                             mob: '⚡', mobName: 'Contingency Creature' },
      { n: 'Revenue Recognition',                       mob: '💰', mobName: 'Revenue Revenant' },
      { n: 'Income Taxes',                              mob: '💸', mobName: 'Tax Troll' },
      { n: 'Fair Value',                                mob: '⚖️', mobName: 'Fair Value Fiend' },
      { n: 'Leases',                                    mob: '🔑', mobName: 'Lease Lurker' },
      { n: 'Subsequent Events',                         mob: '📅', mobName: 'Event Eidolon' },
    ],
  },
  AUD: {
    name: 'AUD',
    full: 'Auditing & Attestation',
    minHrs: 110, maxHrs: 140,
    boss: { name: 'Auditrix the Unseen', emoji: '👁️', tagline: 'Warden of the Red Flag Tower' },
    color: '#b13e53',
    topics: [
      { n: 'Ethics, Independence & Professional Responsibilities', mob: '⚖️', mobName: 'Ethics Enforcer' },
      { n: 'Professional Skepticism & Judgment',                   mob: '🤔', mobName: 'Skeptic Shade' },
      { n: 'Engagement Terms & Documentation',                     mob: '📋', mobName: 'Document Demon' },
      { n: 'Communication with Management & Governance',           mob: '📢', mobName: 'Governance Ghoul' },
      { n: 'Planning & Risk Assessment',                           mob: '🎯', mobName: 'Risk Ranger' },
      { n: 'Entity, Environment & Internal Control',               mob: '🏗️', mobName: 'Control Construct' },
      { n: 'Materiality & Risk Response',                          mob: '⚠️', mobName: 'Materiality Mimic' },
      { n: "Use of Others' Work",                                  mob: '🤝', mobName: 'Specialist Specter' },
      { n: 'Audit Evidence, Sampling & Analytics',                 mob: '🔍', mobName: 'Evidence Elemental' },
      { n: 'Special Areas: Estimates, Inventory & Going Concern',  mob: '🔮', mobName: 'Going Concern Wraith' },
      { n: 'Misstatements, Representations & Subsequent Events',   mob: '✍️', mobName: 'Misstatement Mimic' },
      { n: 'Reporting & Conclusions',                              mob: '📝', mobName: 'Opinion Oracle' },
    ],
  },
  REG: {
    name: 'REG',
    full: 'Taxation & Regulation',
    minHrs: 80, maxHrs: 110,
    boss: { name: 'The Tax Titan', emoji: '👹', tagline: 'Sovereign of the IRS Dungeon' },
    color: '#ef7d57',
    topics: [
      { n: 'Ethics & IRS Practice Rules',                 mob: '⚖️', mobName: 'Circ 230 Specter' },
      { n: 'Tax Preparer Rules & Penalties',              mob: '🚫', mobName: 'Preparer Phantom' },
      { n: 'Federal Tax Procedures, Audits & Appeals',   mob: '📋', mobName: 'Procedure Poltergeist' },
      { n: 'Legal Duties & Confidentiality',             mob: '🔒', mobName: 'Duty Demon' },
      { n: 'Agency',                                     mob: '🤝', mobName: 'Agency Apparition' },
      { n: 'Contracts',                                  mob: '📜', mobName: 'Contract Creature' },
      { n: 'Debtor-Creditor Relationships',              mob: '💳', mobName: 'Debtor Demon' },
      { n: 'Federal Business Law',                       mob: '🏛️', mobName: 'Business Law Beast' },
      { n: 'Business Entity Structure',                  mob: '🏢', mobName: 'Entity Eater' },
      { n: 'Basis of Assets',                            mob: '🏗️', mobName: 'Basis Banshee' },
      { n: 'Depreciation & Amortization',                mob: '📉', mobName: 'MACRS Monster' },
      { n: 'Individual Taxation',                        mob: '👤', mobName: '1040 Goblin' },
      { n: 'Entity Taxation',                            mob: '🏦', mobName: 'Corporate Cryptid' },
    ],
  },
  BAR: {
    name: 'BAR',
    full: 'Business Analysis & Reporting',
    minHrs: 120, maxHrs: 150,
    boss: { name: 'Lord Varex of Variance', emoji: '🐉', tagline: 'Dragon of the Data Citadel' },
    color: '#38b764',
    topics: [
      { n: 'Financial Statement Analysis',                                          mob: '📊', mobName: 'Analysis Archdemon' },
      { n: 'Nonfinancial & Non-GAAP Measures',                                     mob: '📏', mobName: 'EBITDA Entity' },
      { n: 'Managerial & Cost Accounting',                                          mob: '💰', mobName: 'Cost Crawler' },
      { n: 'Budgeting, Forecasting & Projections',                                  mob: '📅', mobName: 'Budget Behemoth' },
      { n: 'Capital Structure',                                                     mob: '🏛️', mobName: 'Capital Colossus' },
      { n: 'Investment Decision Models',                                            mob: '💹', mobName: 'NPV Nightmare' },
      { n: 'Risk Management & COSO ERM',                                            mob: '⚠️', mobName: 'ERM Enforcer' },
      { n: 'Economic & Market Influences',                                          mob: '🌐', mobName: 'Market Mimic' },
      { n: 'Technical Accounting: Goodwill, Software, Revenue, Stock Comp & R&D',  mob: '🔧', mobName: 'Tech Troll' },
      { n: 'Business Combinations & Consolidations',                                mob: '🔗', mobName: 'Consol Cryptid' },
      { n: 'Derivatives & Hedge Accounting',                                        mob: '📈', mobName: 'Hedge Hydra' },
      { n: 'Leases',                                                                mob: '🔑', mobName: 'Lease Lurker' },
      { n: 'Public Company Reporting',                                              mob: '📋', mobName: 'SEC Specter' },
      { n: 'Employee Benefit Plan Statements',                                      mob: '💼', mobName: 'Pension Phantom' },
      { n: 'State & Local Government Reporting',                                    mob: '🏛️', mobName: 'GASB Goliath' },
    ],
  },
  ISC: {
    name: 'ISC',
    full: 'Information Systems & Controls',
    minHrs: 60, maxHrs: 90,
    boss: { name: 'SOCron the Server', emoji: '🤖', tagline: 'Archon of the Server Spire' },
    color: '#7f77dd',
    topics: [
      { n: 'IT Infrastructure & Cloud',                   mob: '☁️', mobName: 'Cloud Crawler' },
      { n: 'ERP & Accounting Information Systems',        mob: '💾', mobName: 'ERP Entity' },
      { n: 'Availability, Disaster Recovery & Continuity', mob: '🔄', mobName: 'Continuity Creature' },
      { n: 'Change Management',                           mob: '🔧', mobName: 'Change Champion' },
      { n: 'Data Extraction, Storage, SQL & Lifecycle',  mob: '🗄️', mobName: 'SQL Specter' },
      { n: 'Business Process Models',                     mob: '⚙️', mobName: 'Process Phantom' },
      { n: 'Security Frameworks & Regulations',           mob: '🛡️', mobName: 'Framework Fiend' },
      { n: 'Threats, Attacks & Mitigation',              mob: '☠️', mobName: 'Threat Titan' },
      { n: 'Security Testing',                            mob: '🔍', mobName: 'Pen Test Phantom' },
      { n: 'Confidentiality & Privacy',                   mob: '🔐', mobName: 'Privacy Poltergeist' },
      { n: 'Incident Response',                           mob: '🚨', mobName: 'Incident Imp' },
      { n: 'SOC Engagements',                             mob: '📋', mobName: 'SOC Sorcerer' },
    ],
  },
  TCP: {
    name: 'TCP',
    full: 'Tax Compliance & Planning',
    minHrs: 60, maxHrs: 90,
    boss: { name: 'The Planner of Endgame', emoji: '🎩', tagline: 'Regent of the Vault of Brackets' },
    color: '#ffcd75',
    topics: [
      { n: 'Individual Tax Compliance & Planning',           mob: '👤', mobName: 'Deduction Dryad' },
      { n: 'Estimated Taxes & Timing Strategies',            mob: '⏰', mobName: 'Timing Troll' },
      { n: 'Passive Activity & At-Risk Rules',               mob: '🚫', mobName: 'Passive Phantom' },
      { n: 'Gift Taxation & Planning',                       mob: '🎁', mobName: 'Gift Goblin' },
      { n: 'Personal Financial Planning',                    mob: '💰', mobName: 'Financial Fiend' },
      { n: 'C Corp Advanced Compliance',                     mob: '🏢', mobName: 'C-Corp Cryptid' },
      { n: 'S Corp Advanced Compliance',                     mob: '📋', mobName: 'S-Corp Specter' },
      { n: 'Partnership Advanced Compliance',                mob: '🤝', mobName: 'Partnership Phantom' },
      { n: 'Trusts',                                         mob: '🔒', mobName: 'Trust Troll' },
      { n: 'Tax-Exempt Organizations',                       mob: '🕊️', mobName: 'Exempt Entity' },
      { n: 'Entity Tax Planning',                            mob: '🧮', mobName: 'Entity Enforcer' },
      { n: 'Property Dispositions & 1231/1245/1250',         mob: '🏠', mobName: '1231 Imp' },
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
