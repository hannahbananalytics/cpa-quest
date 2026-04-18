export default function TopBar({ xp, level, xpPct, nextXp }) {
  return (
    <div className="topbar">
      <div className="logo">CPA<span>Quest</span> <span style={{ fontSize: 11, color: '#888' }}>v2</span></div>
      <div className="topbar-mid">
        <div className="xp-row">
          <span>{xp} XP</span>
          <span>{nextXp} XP to next level</span>
        </div>
        <div className="xp-track">
          <div className="xp-fill" style={{ width: xpPct + '%' }} />
        </div>
      </div>
      <div className="lvl-pill">LVL {level}</div>
    </div>
  )
}
