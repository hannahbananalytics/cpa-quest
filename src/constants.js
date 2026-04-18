export const TOPICS = {
  FAR: [
    { n: 'Financial Statements', w: '25-35%' },
    { n: 'Transactions', w: '20-30%' },
    { n: 'State & Local Gov.', w: '5-15%' },
    { n: 'Not-for-Profit', w: '5-15%' },
    { n: 'Select Transactions', w: '10-20%' },
    { n: 'Employee Benefits', w: '5-10%' },
  ],
  AUD: [
    { n: 'Ethics & Independence', w: '15-25%' },
    { n: 'Risk Assessment', w: '25-35%' },
    { n: 'Audit Procedures', w: '20-30%' },
    { n: 'Forming Conclusions', w: '15-20%' },
  ],
  REG: [
    { n: 'Ethics & Law', w: '10-20%' },
    { n: 'Individual Tax', w: '15-25%' },
    { n: 'Entity Tax', w: '28-38%' },
    { n: 'Property Transactions', w: '10-20%' },
    { n: 'Multijurisdictional', w: '5-10%' },
  ],
  BAR: [
    { n: 'Business Analysis', w: '40-50%' },
    { n: 'Financial Risk', w: '20-30%' },
    { n: 'Operations Mgmt', w: '10-20%' },
    { n: 'Financial Statements', w: '10-20%' },
  ],
  ISC: [
    { n: 'IT Systems', w: '35-45%' },
    { n: 'Security & Privacy', w: '25-35%' },
    { n: 'Emerging Tech', w: '10-20%' },
    { n: 'Business Processes', w: '10-20%' },
  ],
  TCP: [
    { n: 'Individual Planning', w: '30-40%' },
    { n: 'Entity Planning', w: '30-40%' },
    { n: 'Property Transactions', w: '10-20%' },
    { n: 'Multi-jurisdictional', w: '10-20%' },
  ],
}

export const TIER_LABELS = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum']
export const TIER_COLORS = ['#444', '#cd7f32', '#a8a9ad', '#f0c040', '#7eb8f7']

export const CLASSES = [
  { name: 'The Grinder', icon: '⚔️', bonus: 'xp', desc: '+20% XP for every session logged' },
  { name: 'The Strategist', icon: '🧠', bonus: 'weak', desc: 'Weak topics generate 2x boss damage' },
  { name: 'The Clutch Artist', icon: '⚡', bonus: 'streak', desc: 'Streak bonus multiplies by 1.5x' },
]

export const BADGES = [
  { id: 'start', icon: '🚀', name: 'Journey begins', desc: 'Generate first plan' },
  { id: 's3', icon: '🔥', name: 'On fire', desc: '3-day streak' },
  { id: 's7', icon: '⚡', name: 'Week warrior', desc: '7-day streak' },
  { id: 'log1', icon: '✏️', name: 'First step', desc: 'Log first session' },
  { id: 'log5', icon: '🏃', name: 'Momentum', desc: '5 sessions logged' },
  { id: 'boss1', icon: '⚔️', name: 'Boss slayer', desc: 'Win a boss battle' },
  { id: 'half', icon: '🎯', name: 'Halfway', desc: '50% readiness' },
  { id: 'ready', icon: '🏆', name: 'Board ready', desc: '80% readiness' },
  { id: 'spin1', icon: '🎰', name: 'Lucky spin', desc: 'Spin the loot wheel' },
  { id: 'gold1', icon: '🌟', name: 'Gold mastery', desc: 'Gold-tier any topic' },
  { id: 'plat1', icon: '💎', name: 'Platinum', desc: 'Platinum any topic' },
  { id: 'hrs10', icon: '📚', name: 'Scholar', desc: '10+ hours logged' },
]

export const LEVEL_NAMES = [
  'Candidate', 'Tax Novice', 'MCQ Apprentice', 'Audit Analyst',
  'CPA Contender', 'Board Warrior', 'CPA Legend',
]

export const LEVEL_XP = [0, 500, 1200, 2500, 4500, 7000, 10000]

export const WHEEL_PRIZES = [
  { label: '+200 XP', color: '#f0c040', val: 200, type: 'xp' },
  { label: 'Streak Shield', color: '#7eb8f7', val: 1, type: 'shield' },
  { label: '+100 XP', color: '#ef9f27', val: 100, type: 'xp' },
  { label: 'Boss -10% HP', color: '#e24b4a', val: 10, type: 'bossdmg' },
  { label: '+50 XP', color: '#639922', val: 50, type: 'xp' },
  { label: '2x XP Day', color: '#cd7f32', val: 1, type: '2xp' },
  { label: '+150 XP', color: '#7f77dd', val: 150, type: 'xp' },
  { label: 'Topic Boost', color: '#5dcaa5', val: 1, type: 'boost' },
]
