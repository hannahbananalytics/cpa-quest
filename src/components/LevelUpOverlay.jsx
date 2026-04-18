export default function LevelUpOverlay({ level, levelName, onClose }) {
  return (
    <div className="lvlup-overlay">
      <div style={{ fontSize: 13, color: '#888', fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>
        LEVEL UP!
      </div>
      <div className="lvlup-num">{level}</div>
      <div className="lvlup-title">NEW RANK UNLOCKED</div>
      <div className="lvlup-name">{levelName}</div>
      <button className="lvlup-close" onClick={onClose}>CONTINUE →</button>
    </div>
  )
}
