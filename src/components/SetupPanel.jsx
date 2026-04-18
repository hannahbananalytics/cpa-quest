import { useState, useEffect } from 'react'
import { TOPICS, CLASSES, TIER_LABELS } from '../constants'

function renderPips(tier) {
  const names = ['bronze', 'silver', 'gold', 'plat']
  return Array.from({ length: 4 }, (_, i) => (
    <div key={i} className={'pip' + (i < tier ? ' ' + names[i] : '')} />
  ))
}

export default function SetupPanel({
  active, cls, sect, edate, dhrs, bpct,
  mastery, onPickClass, onBumpTier, onGenerate, onSectChange,
}) {
  const [localSect, setLocalSect] = useState(sect)
  const [localEdate, setLocalEdate] = useState(edate ? edate.slice(0, 10) : '')
  const [localDhrs, setLocalDhrs] = useState(dhrs)
  const [localBpct, setLocalBpct] = useState(bpct)

  useEffect(() => {
    setLocalSect(sect)
  }, [sect])

  function handleSectChange(e) {
    setLocalSect(e.target.value)
    onSectChange(e.target.value)
  }

  function handleGenerate() {
    onGenerate({
      sect: localSect,
      edate: localEdate,
      dhrs: localDhrs,
      bpct: localBpct,
    })
  }

  const topics = TOPICS[localSect] || []

  return (
    <div className={'panel' + (active ? ' on' : '')}>
      <div className="sec-lbl">Choose your class</div>
      <div className="class-grid">
        {CLASSES.map((c, i) => (
          <div
            key={i}
            className={'class-card' + (cls === i ? ' picked' : '')}
            onClick={() => onPickClass(i)}
          >
            <div className="class-icon">{c.icon}</div>
            <div className="class-name">{c.name}</div>
            <div className="class-bonus">{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="sec-lbl">Exam info</div>
      <div className="ig">
        <div>
          <label>CPA section</label>
          <select value={localSect} onChange={handleSectChange}>
            <option value="FAR">FAR — Financial Accounting</option>
            <option value="AUD">AUD — Auditing & Attestation</option>
            <option value="REG">REG — Tax & Regulation</option>
            <option value="BAR">BAR — Business Analysis</option>
            <option value="ISC">ISC — Info Systems</option>
            <option value="TCP">TCP — Tax Compliance</option>
          </select>
        </div>
        <div>
          <label>Exam date</label>
          <input
            type="date"
            value={localEdate}
            onChange={e => setLocalEdate(e.target.value)}
          />
        </div>
        <div>
          <label>Hours / day</label>
          <input
            type="number"
            min="1" max="12"
            value={localDhrs}
            onChange={e => setLocalDhrs(e.target.value)}
          />
        </div>
        <div>
          <label>Becker % done</label>
          <input
            type="number"
            min="0" max="100"
            value={localBpct}
            onChange={e => setLocalBpct(e.target.value)}
          />
        </div>
      </div>

      <div className="sec-lbl">Skill mastery — rate yourself</div>
      <div className="skill-tree">
        {topics.map((t, i) => {
          const tier = mastery[i] || 0
          return (
            <div key={i} className="skill-row">
              <div className="skill-left">
                <div className="skill-name">{t.n}</div>
                <div className="skill-pips">{renderPips(tier)}</div>
                <div className="skill-tier">{TIER_LABELS[tier]} · {t.w}</div>
              </div>
              <div className="skill-right">
                <button className="tier-btn" onClick={() => onBumpTier(i, -1)}>−</button>
                <button className="tier-btn" onClick={() => onBumpTier(i, 1)}>+</button>
              </div>
            </div>
          )
        })}
      </div>

      <button className="gen-btn" onClick={handleGenerate}>
        GENERATE PLAN + ENTER THE DUNGEON →
      </button>
    </div>
  )
}
