import { useState } from 'react'
import { SECTIONS } from '../constants.js'

export default function SectionPicker({ hero, onComplete }) {
  const [sect, setSect] = useState('FAR')
  const [edate, setEdate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 60)
    return d.toISOString().slice(0, 10)
  })
  const [dhrs, setDhrs] = useState(3)
  const [bpct, setBpct] = useState(0)

  const sectData = SECTIONS[sect]

  function go() {
    onComplete({ sect, edate, dhrs: Number(dhrs) || 3, bpct: Number(bpct) || 0 })
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
            <div className="ps" style={{ fontSize: 8, color: 'var(--gold)', marginTop: 4, letterSpacing: 0 }}>{hero.title}</div>
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
              <div className="tiny mt-8">{s.topics.length} mini-bosses · {s.topics.map(t => t.mob).join(' ')}</div>
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
            <label className="input-label">BECKER % DONE</label>
            <input type="number" min={0} max={100} className="px-input" value={bpct} onChange={e => setBpct(e.target.value)} />
          </div>
        </div>

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
          <div className="chip">DUNGEON LVL {sectData.topics.length * 10}</div>
        </div>

        <button className="px-btn blood" style={{ width: '100%', padding: 18, fontSize: 12 }} onClick={go}>
          ⚔ ENTER {sectData.name} DUNGEON ⚔
        </button>
      </div>
    </div>
  )
}
