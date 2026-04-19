import { useState } from 'react'
import { SECTIONS } from '../constants.js'

export default function SectionPicker({ hero, onComplete }) {
  const [sect, setSect] = useState('FAR')
  const [edate, setEdate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 60)
    return d.toISOString().slice(0, 10)
  })
  const [dhrs, setDhrs] = useState(3)
  const [mcqFreq, setMcqFreq] = useState(5)

  const sectData = SECTIONS[sect]

  function go() {
    onComplete({
      sect,
      edate,
      dhrs: Number(dhrs) || 3,
      mcqFreq: Math.max(3, Math.min(10, Number(mcqFreq) || 5)),
    })
  }

  return (
    <div className="app-wrap crt">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div className="title-logo" style={{ fontSize: 22 }}>CHOOSE <span className="sub">YOUR BOSS</span></div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'var(--ink)', border: '3px solid var(--gold)',
          padding: '10px 14px', marginBottom: 20,
          boxShadow: 'inset 0 0 0 2px var(--gold)',
        }}>
          <div style={{ fontSize: 40 }}>{hero.avatar}</div>
          <div>
            <div className="ps" style={{ fontSize: 11, color: 'var(--bone)' }}>{hero.name}</div>
            <div className="ps" style={{ fontSize: 10, color: 'var(--gold)', marginTop: 4, letterSpacing: 0 }}>{hero.title}</div>
          </div>
          <div style={{ marginLeft: 'auto' }} className="tiny">Ready to pick a dungeon</div>
        </div>

        <div className="section-label">SELECT EXAM SECTION</div>
        <div className="grid-3 mb-16">
          {Object.entries(SECTIONS).map(([k, s]) => (
            <div key={k}
                 onClick={() => setSect(k)}
                 className={'choice' + (sect === k ? ' picked' : '')}
                 style={{ padding: 14, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 40 }}>{s.boss.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div className="ps" style={{ fontSize: 11, color: s.color, letterSpacing: 0 }}>{s.name}</div>
                  <div className="small muted" style={{ marginTop: 4 }}>{s.full}</div>
                </div>
              </div>
              <div className="tiny mt-12" style={{ color: 'var(--blood)' }}>▲ BOSS: {s.boss.name}</div>
              <div className="tiny" style={{ color: 'var(--ash)' }}>{s.boss.tagline}</div>
              <div className="tiny mt-8">{s.topics.length} topics · {s.minHrs}–{s.maxHrs} hrs baseline</div>
            </div>
          ))}
        </div>

        <div className="section-label">PLAN YOUR RUN</div>
        <div className="grid-3 mb-16">
          <div className="px-panel">
            <label className="input-label">EXAM DATE</label>
            <input type="date" className="px-input" value={edate} onChange={e => setEdate(e.target.value)} />
          </div>
          <div className="px-panel">
            <label className="input-label">AVERAGE STUDY HOURS / DAY</label>
            <input type="number" min={1} max={12} className="px-input" value={dhrs} onChange={e => setDhrs(e.target.value)} />
          </div>
          <div className="px-panel">
            <label className="input-label">MCQ PRACTICE EVERY</label>
            <input type="number" min={3} max={10} className="px-input" value={mcqFreq} onChange={e => setMcqFreq(e.target.value)} />
            <div className="tiny mt-8">quests &nbsp;·&nbsp; min 3, max 10</div>
          </div>
        </div>

        {(() => {
          const dlyHrs = Math.max(1, Number(dhrs) || 3)
          const midHrs = (sectData.minHrs + sectData.maxHrs) / 2
          const recDays = Math.round(midHrs / dlyHrs)
          const today = new Date(); today.setHours(0,0,0,0)
          const examDate = new Date(edate)
          const availDays = Math.ceil((examDate - today) / 86400000)
          const pacing = availDays >= recDays ? 'ok' : availDays >= recDays * 0.75 ? 'tight' : 'danger'
          const pacingColor = pacing === 'ok' ? 'var(--grass)' : pacing === 'tight' ? 'var(--gold)' : 'var(--blood)'
          const pacingLabel = pacing === 'ok' ? 'ON TRACK' : pacing === 'tight' ? 'TIGHT' : 'VERY TIGHT'
          return (
            <div className="px-panel mb-16" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div className="input-label">ESTIMATED HOURS</div>
                <div className="ps" style={{ color: 'var(--gold)', fontSize: 13 }}>{sectData.minHrs}–{sectData.maxHrs} hrs</div>
              </div>
              <div>
                <div className="input-label">RECOMMENDED DAYS</div>
                <div className="ps" style={{ color: 'var(--bone)', fontSize: 13 }}>~{recDays} days at {dlyHrs}h/day</div>
              </div>
              <div>
                <div className="input-label">YOUR TIMELINE</div>
                <div className="ps" style={{ color: 'var(--bone)', fontSize: 13 }}>{availDays} days available</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <div className="chip" style={{ background: pacingColor, color: 'var(--ink)' }}>{pacingLabel}</div>
              </div>
            </div>
          )
        })()}

        <div className="section-hero mb-16">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 64, filter: 'drop-shadow(4px 4px 0 var(--ink))' }}>{sectData.boss.emoji}</div>
            <div>
              <div className="ps" style={{ fontSize: 14, color: 'var(--bone)' }}>{sectData.boss.name}</div>
              <div className="tiny mt-8">{sectData.boss.tagline}</div>
              <div className="tiny mt-8" style={{ color: 'var(--rust)' }}>
                Minions: {sectData.topics.map(t => t.mobName).join(' · ')}
              </div>
            </div>
          </div>
        </div>

        <button className="px-btn blood" style={{ width: '100%', padding: 18, fontSize: 12 }} onClick={go}>
          ⚔ ENTER {sectData.name} DUNGEON ⚔
        </button>
      </div>
    </div>
  )
}
