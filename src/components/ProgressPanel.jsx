import { TOPICS, TIER_LABELS, TIER_COLORS } from '../constants'

export default function ProgressPanel({
  active, plan, sessions, hrs, streak,
  activity, mastery, sect, wheelSpins,
  onLogDay, onBossBattle, onOpenWheel,
}) {
  if (!active) return null

  if (!plan) {
    return (
      <div className="panel on">
        <div className="prog-empty">
          <div className="empty-icon">📊</div>
          <p>Generate your plan first.</p>
        </div>
      </div>
    )
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const heatmap = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (34 - i))
    const k = d.toISOString().slice(0, 10)
    const isToday = i === 34
    return { key: k, isToday, done: activity[k] === 'done', miss: activity[k] === 'missed' }
  })

  const topics = TOPICS[sect] || []

  return (
    <div className="panel on">
      <div className="stat3">
        <div className="sbox"><div className="sval">{sessions}</div><div className="slab">Sessions</div></div>
        <div className="sbox"><div className="sval">{Number(hrs).toFixed(1)}</div><div className="slab">Hours</div></div>
        <div className="sbox"><div className="sval">{streak}</div><div className="slab">🔥 Streak</div></div>
      </div>

      <div className="sec-lbl">Activity heatmap</div>
      <div className="hmap">
        {heatmap.map((c) => (
          <div
            key={c.key}
            className={'hc' + (c.isToday ? ' htoday' : c.done ? ' hdone' : c.miss ? ' hmiss' : '')}
          />
        ))}
      </div>

      <div className="sec-lbl">Skill mastery levels</div>
      <div style={{ marginBottom: 14 }}>
        {topics.map((t, i) => {
          const tier = mastery[i] || 0
          const col = TIER_COLORS[tier]
          const pct = [0, 25, 50, 75, 100][tier]
          return (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-text-primary)' }}>{t.n}</span>
                <span style={{ color: col, fontWeight: 500 }}>{TIER_LABELS[tier]}</span>
              </div>
              <div style={{ height: 7, background: 'var(--color-background-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', background: col, borderRadius: 4, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="btn-row">
        <button className="abtn gold" onClick={onLogDay}>Log session +XP</button>
        <button className="abtn red" onClick={onBossBattle}>Boss battle ⚔️</button>
        <button
          className="abtn"
          disabled={wheelSpins <= 0}
          onClick={onOpenWheel}
          style={wheelSpins <= 0 ? { opacity: 0.4 } : {}}
        >
          Spin loot 🎰
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8, textAlign: 'center' }}>
        {wheelSpins > 0
          ? `Loot wheel ready! You have ${wheelSpins} spin(s).`
          : 'Log 5 sessions to unlock the loot wheel'}
      </div>
    </div>
  )
}
