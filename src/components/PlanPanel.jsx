import { useState, useEffect } from 'react'

function Countdown({ edate }) {
  const [parts, setParts] = useState(null)

  useEffect(() => {
    function update() {
      const diff = new Date(edate) - new Date()
      if (diff <= 0) { setParts(null); return }
      const days = Math.floor(diff / 86400000)
      const wks = Math.floor(days / 7)
      const hrs = Math.floor((diff % 86400000) / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      setParts([days, wks, hrs, mins])
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [edate])

  if (!parts) {
    return (
      <div style={{ color: '#e24b4a', fontWeight: 600, padding: 12, textAlign: 'center', gridColumn: '1/-1' }}>
        Exam day!
      </div>
    )
  }

  return (
    <div className="countdown">
      {['Days', 'Weeks', 'Hours', 'Mins'].map((l, i) => (
        <div key={l} className="cd">
          <div className="cd-n">{parts[i]}</div>
          <div className="cd-l">{l}</div>
        </div>
      ))}
    </div>
  )
}

function readinessMsg(p) {
  if (p < 30) return 'Keep grinding — momentum is building!'
  if (p < 60) return 'Solid progress. Stay consistent!'
  if (p < 80) return "You're looking strong. Push for it!"
  return 'Board ready! Keep reviewing.'
}

export default function PlanPanel({ active, plan, sect, edate, dhrs, schedule, readiness }) {
  if (!active) return null

  if (!plan) {
    return (
      <div className="panel on">
        <div className="plan-empty">
          <div className="empty-icon">🗺️</div>
          <p>Set up your exam first.</p>
        </div>
      </div>
    )
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const p = Math.min(100, readiness)

  return (
    <div className="panel on">
      <Countdown edate={edate} />

      <div className="ready-wrap">
        <div className="ready-top">
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>Exam readiness</div>
            <div className="ready-score">{p}%</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--color-text-secondary)' }}>
            {sect} section<br />{schedule.length} days · {dhrs}h/day
          </div>
        </div>
        <div className="ready-track">
          <div className="ready-fill" style={{ width: p + '%' }} />
        </div>
        <div className="ready-msg">{readinessMsg(p)}</div>
      </div>

      <div className="sec-lbl">Daily schedule</div>
      <div className="day-list">
        {schedule.map(d => {
          const dDate = new Date(d.date); dDate.setHours(0, 0, 0, 0)
          const isToday = dDate.toDateString() === today.toDateString()
          const ico = d.done ? '✅' : isToday ? '⭐' : d.type === 'practice' ? '🎯' : d.type === 'review' ? '📖' : '📝'
          return (
            <div
              key={d.day}
              className={'day-row' + (d.done ? ' done' : '') + (isToday ? ' is-today' : '')}
            >
              <div className="day-num">Day {d.day}</div>
              <div className="day-info">
                <div className="day-topic">{d.topic}</div>
                <div className="day-sub">
                  {dhrs}h · {dDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="day-icon">{ico}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
