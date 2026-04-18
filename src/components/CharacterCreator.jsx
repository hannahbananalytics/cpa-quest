import { useState } from 'react'
import { AVATARS, CLASSES, WEAPONS, TITLES } from '../constants.js'

export default function CharacterCreator({ onComplete, initial }) {
  const [step, setStep] = useState(initial?.step ?? 0)
  const [name, setName] = useState(initial?.name ?? '')
  const [avatar, setAvatar] = useState(initial?.avatar ?? AVATARS[0])
  const [clsId, setClsId] = useState(initial?.clsId ?? 'grinder')
  const [title, setTitle] = useState(initial?.title ?? TITLES[0])
  const [weaponId, setWeaponId] = useState(initial?.weaponId ?? 'pencil')

  const cls = CLASSES.find(c => c.id === clsId)
  const weapon = WEAPONS.find(w => w.id === weaponId)

  function finish() {
    onComplete({
      name: name.trim() || 'Candidate',
      avatar, clsId, title, weaponId,
    })
  }

  const steps = ['AVATAR', 'NAME', 'CLASS', 'WEAPON', 'TITLE', 'CONFIRM']
  const go = (d) => setStep(s => Math.max(0, Math.min(steps.length - 1, s + d)))

  return (
    <div className="app-wrap crt">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '28px 0 10px' }}>
          <div className="title-logo">CPA <span className="sub">QUEST</span></div>
          <div className="ps" style={{ fontSize: 10, color: 'var(--ash)', marginTop: 18, letterSpacing: 2 }}>
            — CHOOSE YOUR HERO —
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '20px 0' }}>
          {steps.map((s, i) => (
            <div key={s} onClick={() => setStep(i)} style={{
              width: 14, height: 14,
              border: '3px solid var(--ink)',
              background: i < step ? 'var(--grass)' : i === step ? 'var(--gold)' : 'var(--dusk)',
              cursor: 'pointer',
            }}/>
          ))}
        </div>

        <div className="px-panel" style={{ minHeight: 420, padding: '28px 32px' }}>
          {step === 0 && <StepAvatar avatar={avatar} setAvatar={setAvatar} />}
          {step === 1 && <StepName name={name} setName={setName} avatar={avatar} />}
          {step === 2 && <StepClass clsId={clsId} setClsId={setClsId} />}
          {step === 3 && <StepWeapon weaponId={weaponId} setWeaponId={setWeaponId} />}
          {step === 4 && <StepTitle title={title} setTitle={setTitle} />}
          {step === 5 && <StepConfirm {...{name, avatar, cls, weapon, title}} />}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button className="px-btn ghost" onClick={() => go(-1)} disabled={step === 0}>◀ BACK</button>
          {step < steps.length - 1
            ? <button className="px-btn" onClick={() => go(1)}>NEXT ▶</button>
            : <button className="px-btn grass" onClick={finish}>START QUEST ⚔</button>}
        </div>
      </div>
    </div>
  )
}

function StepAvatar({ avatar, setAvatar }) {
  return (
    <>
      <div className="section-label">PICK YOUR AVATAR</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10 }}>
        {AVATARS.map(a => (
          <div key={a}
               onClick={() => setAvatar(a)}
               className={'choice' + (avatar === a ? ' picked' : '')}
               style={{ padding: 0, aspectRatio: '1', display: 'grid', placeItems: 'center' }}>
            <div style={{ fontSize: 54, lineHeight: 1 }}>{a}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 22 }}>
        <span className="muted">Selected: </span>
        <span style={{ fontSize: 44 }}>{avatar}</span>
      </div>
    </>
  )
}

function StepName({ name, setName, avatar }) {
  return (
    <>
      <div className="section-label">NAME YOUR HERO</div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 10 }}>
        <div style={{
          fontSize: 96, lineHeight: 1,
          background: 'var(--dusk)', border: '4px solid var(--ink)',
          padding: 24, boxShadow: 'inset 0 0 0 2px var(--gold)',
        }}>{avatar}</div>
        <div style={{ flex: 1 }}>
          <label className="input-label">HERO NAME</label>
          <input className="px-input" maxLength={16} value={name}
                 placeholder="Type a name..."
                 onChange={e => setName(e.target.value)} autoFocus/>
          <div className="tiny mt-8">Up to 16 characters. This appears on every HP bar.</div>
        </div>
      </div>
    </>
  )
}

function StepClass({ clsId, setClsId }) {
  return (
    <>
      <div className="section-label">CHOOSE YOUR CLASS</div>
      <div className="grid-4">
        {CLASSES.map(c => (
          <div key={c.id}
               onClick={() => setClsId(c.id)}
               className={'choice' + (clsId === c.id ? ' picked' : '')}>
            <div className="choice-icon">{c.emoji}</div>
            <div className="choice-name">{c.name}</div>
            <div className="choice-desc">{c.bonus}</div>
            <div className="ps mt-8" style={{ fontSize: 8, color: c.color, letterSpacing: 0 }}>+{c.stat}</div>
          </div>
        ))}
      </div>
    </>
  )
}

function StepWeapon({ weaponId, setWeaponId }) {
  return (
    <>
      <div className="section-label">CHOOSE A STARTING WEAPON</div>
      <div className="grid-3">
        {WEAPONS.map(w => (
          <div key={w.id}
               onClick={() => setWeaponId(w.id)}
               className={'choice' + (weaponId === w.id ? ' picked' : '')}>
            <div className="choice-icon">{w.emoji}</div>
            <div className="choice-name">{w.name}</div>
            <div className="choice-desc">{w.desc}</div>
          </div>
        ))}
      </div>
    </>
  )
}

function StepTitle({ title, setTitle }) {
  return (
    <>
      <div className="section-label">PICK A TITLE</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {TITLES.map(t => (
          <div key={t}
               onClick={() => setTitle(t)}
               className={'choice' + (title === t ? ' picked' : '')}
               style={{ padding: '14px 10px' }}>
            <div className="choice-desc" style={{ fontSize: 18, color: 'var(--bone)' }}>{t}</div>
          </div>
        ))}
      </div>
    </>
  )
}

function StepConfirm({ name, avatar, cls, weapon, title }) {
  return (
    <>
      <div className="section-label">READY?</div>
      <div style={{
        background: 'var(--ink)',
        border: '4px solid var(--gold)',
        padding: 24, textAlign: 'center',
        boxShadow: 'inset 0 0 0 2px var(--gold)',
      }}>
        <div style={{ fontSize: 96, lineHeight: 1, marginBottom: 12,
                      filter: 'drop-shadow(4px 4px 0 var(--ink))' }}>{avatar}</div>
        <div className="ps" style={{ fontSize: 18, color: 'var(--bone)', marginBottom: 6 }}>{name || 'CANDIDATE'}</div>
        <div className="ps" style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: 0 }}>{title}</div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 18, flexWrap: 'wrap' }}>
          <div>
            <div className="ps" style={{ fontSize: 8, color: 'var(--ash)' }}>CLASS</div>
            <div style={{ fontSize: 34, marginTop: 6 }}>{cls.emoji}</div>
            <div className="tiny mt-8">{cls.name}</div>
          </div>
          <div>
            <div className="ps" style={{ fontSize: 8, color: 'var(--ash)' }}>WEAPON</div>
            <div style={{ fontSize: 34, marginTop: 6 }}>{weapon.emoji}</div>
            <div className="tiny mt-8">{weapon.name}</div>
          </div>
        </div>

        <div className="tiny mt-16" style={{ color: 'var(--grass)' }}>Press START QUEST to choose your exam section →</div>
      </div>
    </>
  )
}
