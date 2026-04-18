export default function BattleArena({ hero, mob, heroHp, heroMaxHp, mobHp, mobMaxHp, boss, message, phase }) {
  const heroPct = Math.max(0, Math.round((heroHp / heroMaxHp) * 100))
  const mobPct  = Math.max(0, Math.round((mobHp  / mobMaxHp)  * 100))

  const heroClasses = [
    'fighter', 'hero',
    phase === 'hero-attack' ? 'is-attacking' : '',
    phase === 'hit-hero' ? 'is-hit' : '',
  ].join(' ')

  const foeClasses = [
    'fighter', 'foe',
    phase === 'foe-attack' ? 'is-attacking' : '',
    phase === 'hit-foe' ? 'is-hit' : '',
    phase === 'faint-foe' ? 'is-fainted' : '',
  ].join(' ')

  const mobShown = mobHp > 0 ? mob : null

  return (
    <div>
      <div className="arena">
        <div className="arena-cloud c1" style={{ left: '10%' }} />
        <div className="arena-cloud c2" />
        <div className="arena-cloud c3" />

        <div style={{
          position: 'absolute', bottom: '40%', right: '4%',
          fontSize: 36, opacity: 0.35, filter: 'grayscale(1)',
        }}>{boss.emoji}</div>
        <div style={{
          position: 'absolute', bottom: '41%', right: '3%',
          fontSize: 10, opacity: 0.5, color: '#1a1c2c',
          fontFamily: 'Press Start 2P, monospace', letterSpacing: 0,
        }}>BOSS LAIR</div>

        <div className="arena-ground" />

        <div className="grass-blade" style={{ left: '18%', bottom: '12%' }} />
        <div className="grass-blade" style={{ left: '28%', bottom: '10%' }} />
        <div className="grass-blade" style={{ left: '42%', bottom: '14%' }} />
        <div className="grass-blade" style={{ left: '55%', bottom: '9%' }} />
        <div className="grass-blade" style={{ left: '70%', bottom: '13%' }} />
        <div className="grass-blade" style={{ left: '84%', bottom: '11%' }} />

        <div className="arena-platform hero" />
        <div className="arena-platform foe" />

        {mobShown && (
          <div className="hp-card foe-card">
            <div className="nm">
              <span>{mob.mobName}</span>
              <span className="lvl">Lv{mob.level}</span>
            </div>
            <div className="px-bar" style={{ height: 10 }}>
              <div className={'px-bar-fill ' + (mobPct > 50 ? 'grass' : mobPct > 20 ? 'gold' : 'blood')}
                   style={{ width: mobPct + '%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 14 }}>
              <span className="ps" style={{ fontSize: 8 }}>HP</span>
              <span>{mobHp}/{mobMaxHp}</span>
            </div>
          </div>
        )}

        <div className="hp-card hero-card">
          <div className="nm">
            <span>{hero.name}</span>
            <span className="lvl" style={{ color: 'var(--sky)' }}>Lv{hero.level}</span>
          </div>
          <div className="px-bar" style={{ height: 10 }}>
            <div className={'px-bar-fill ' + (heroPct > 50 ? 'grass' : heroPct > 20 ? 'gold' : 'blood')}
                 style={{ width: heroPct + '%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 14 }}>
            <span className="ps" style={{ fontSize: 8 }}>HP</span>
            <span>{heroHp}/{heroMaxHp}</span>
          </div>
          <div className="px-bar mt-8" style={{ height: 6 }}>
            <div className="px-bar-fill sky" style={{ width: hero.xpPct + '%' }} />
          </div>
        </div>

        <div className={heroClasses}>{hero.avatar}</div>

        {mobShown && (
          <div className={foeClasses} style={{
            opacity: phase === 'faint-foe' ? 0 : 1,
            transition: 'opacity 0.4s steps(4)',
            transform: phase === 'faint-foe' ? 'translateY(20px)' : '',
          }}>{mob.mob}</div>
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
