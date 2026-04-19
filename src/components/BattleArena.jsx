export default function BattleArena({ hero, weapon, mob, heroHp, heroMaxHp, mobHp, mobMaxHp, boss, env, message, phase }) {
  const heroPct = Math.max(0, Math.round((heroHp / heroMaxHp) * 100))
  const mobPct  = Math.max(0, Math.round((mobHp  / mobMaxHp)  * 100))

  const heroClasses = [
    'fighter', 'hero',
    phase === 'hero-attack' ? 'is-attacking' : '',
    phase === 'hero-throw' ? 'is-throwing' : '',
    phase === 'hit-hero' ? 'is-hit' : '',
  ].join(' ')

  const foeClasses = [
    'fighter', 'foe',
    phase === 'foe-attack' ? 'is-attacking' : '',
    phase === 'hit-foe' ? 'is-hit' : '',
    phase === 'faint-foe' ? 'is-fainted' : '',
    phase === 'boss-finisher' ? 'is-finisher' : '',
    phase === 'boss-shatter' ? 'is-shatter' : '',
  ].join(' ')

  const inFinisher = phase === 'boss-finisher' || phase === 'boss-shatter'

  const mobShown = mobHp > 0 ? mob : null

  const envClass = env ? ` arena--${env}` : ''
  const shakeClass = phase === 'boss-finisher' ? ' is-boss-finisher' : ''

  return (
    <div>
      <div className={'arena' + envClass + shakeClass}>
        {inFinisher && <div className="boss-flash" />}
        <div className="arena-cloud c1" style={{ left: '10%' }} />
        <div className="arena-cloud c2" />
        <div className="arena-cloud c3" />

        <div className="arena-ground" />
        <div className="arena-grass-front" />

        <div className="grass-blade" style={{ left: '18%', bottom: '12%' }} />
        <div className="grass-blade" style={{ left: '28%', bottom: '10%' }} />
        <div className="grass-blade" style={{ left: '42%', bottom: '14%' }} />
        <div className="grass-blade" style={{ left: '55%', bottom: '9%' }} />
        <div className="grass-blade" style={{ left: '70%', bottom: '13%' }} />
        <div className="grass-blade" style={{ left: '84%', bottom: '11%' }} />

        <div className="arena-platform hero" />
        <div className="arena-platform foe" />

        {mob && (
          <div
            key={mob.mobName}
            className={'hp-card foe-card' + (phase === 'faint-foe' ? ' is-out' : '')}
          >
            <div className="nm">
              <span>{mob.mobName}</span>
              <span className="lvl">Lv{mob.level}</span>
            </div>
            <div className="px-bar" style={{ height: 10 }}>
              <div className={'px-bar-fill ' + (mobPct > 50 ? 'grass' : mobPct > 20 ? 'gold' : 'blood')}
                   style={{ width: mobPct + '%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <span className="ps" style={{ fontSize: 10 }}>HP</span>
              <span style={{ fontSize: 20 }}>{mobHp}/{mobMaxHp}</span>
            </div>
          </div>
        )}

        <div className="hp-card hero-card">
          <div className="nm">
            <span>{hero.name}</span>
            <span className="lvl" style={{ color: 'var(--shadow)' }}>Lv{hero.level}</span>
          </div>
          <div className="px-bar" style={{ height: 10 }}>
            <div className={'px-bar-fill ' + (heroPct > 50 ? 'grass' : heroPct > 20 ? 'gold' : 'blood')}
                 style={{ width: heroPct + '%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
            <span className="ps" style={{ fontSize: 10 }}>HP</span>
            <span style={{ fontSize: 20 }}>{heroHp}/{heroMaxHp}</span>
          </div>
        </div>

        <div className={heroClasses}>{hero.avatar}</div>

        {mob && <div className={foeClasses}>{mob.mob}</div>}

        {phase === 'hero-throw' && weapon && (
          <div className="weapon-proj">{weapon.emoji}</div>
        )}

        {phase === 'hit-foe' && (
          <div className="dmg-float" style={{ top: '35%', right: '18%' }}>
            -{mob.lastDmg || 0}
          </div>
        )}
        {phase === 'hit-hero' && (
          <div className="dmg-float" style={{ bottom: '30%', left: '18%', color: 'var(--blood)' }}>
            -{hero.lastDmg || 0}
          </div>
        )}
      </div>

      <div className="arena-dialog">
        {message}
      </div>
    </div>
  )
}
