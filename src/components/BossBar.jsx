export default function BossBar({ bossName, bossIcon, bossHp, bossMaxHp, bossHpPct, bossColor, bossRage }) {
  return (
    <div className="boss-bar-wrap">
      <div className="boss-icon">{bossIcon}</div>
      <div className="boss-info">
        <div className="boss-name">{bossName}</div>
        <div className="boss-hp-track">
          <div
            className="boss-hp-fill"
            style={{ width: bossHpPct + '%', background: bossColor }}
          />
        </div>
        <div className="boss-hp-text">
          <span>HP: {Math.round(bossHp)} / {bossMaxHp}</span>
          <span className="boss-rage">{bossRage}</span>
        </div>
      </div>
    </div>
  )
}
