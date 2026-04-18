import { BADGES } from '../constants'

export default function BadgesPanel({ active, streak, bestStreak, xp, earned }) {
  if (!active) return null

  return (
    <div className="panel on">
      <div className="streak-banner">
        <div className="streak-fire">🔥</div>
        <div>
          <div className="streak-num">{streak}</div>
          <div className="streak-lbl">day streak</div>
        </div>
        <div className="streak-r">
          <div className="streak-best">Best: {bestStreak}</div>
          <div className="streak-xp">{xp} XP total</div>
        </div>
      </div>

      <div className="sec-lbl">Achievements</div>
      <div className="badge-grid">
        {BADGES.map(b => {
          const isEarned = earned.includes(b.id)
          return (
            <div key={b.id} className={'bcard' + (isEarned ? ' earned' : '')}>
              <div className="bicon">{b.icon}</div>
              <div className="bname">{b.name}</div>
              <div className="bdesc">{b.desc}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
