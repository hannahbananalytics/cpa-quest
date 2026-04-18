import { useRef, useEffect, useState } from 'react'
import { WHEEL_PRIZES } from '../constants'

function drawWheel(canvas, rot) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const cx = 110, cy = 110, r = 100
  const slices = WHEEL_PRIZES.length
  const arc = (2 * Math.PI) / slices
  ctx.clearRect(0, 0, 220, 220)

  WHEEL_PRIZES.forEach((p, i) => {
    const start = rot + i * arc
    const end = rot + (i + 1) * arc
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath()
    ctx.fillStyle = p.color; ctx.fill()
    ctx.strokeStyle = '#0f0e17'; ctx.lineWidth = 2; ctx.stroke()
    ctx.save()
    ctx.translate(cx, cy); ctx.rotate(rot + (i + 0.5) * arc)
    ctx.textAlign = 'right'; ctx.fillStyle = '#0f0e17'
    ctx.font = "bold 11px 'DM Sans', sans-serif"
    ctx.fillText(p.label, r - 8, 4)
    ctx.restore()
  })

  ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 2 * Math.PI)
  ctx.fillStyle = '#0f0e17'; ctx.fill()
  ctx.strokeStyle = '#f0c040'; ctx.lineWidth = 3; ctx.stroke()
}

export default function WheelOverlay({ wheelSpins, onClose, onPrize }) {
  const canvasRef = useRef(null)
  const angleRef = useRef(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState('')
  const [spinsLeft, setSpinsLeft] = useState(wheelSpins)

  useEffect(() => {
    drawWheel(canvasRef.current, angleRef.current)
  }, [])

  function spinWheel() {
    if (spinning || spinsLeft <= 0) return
    setSpinning(true)
    setResult('')
    setSpinsLeft(s => s - 1)

    const totalRot = Math.random() * 2 * Math.PI + 8 * 2 * Math.PI
    const duration = 3500
    const start = performance.now()
    const initAngle = angleRef.current

    function frame(now) {
      const t = Math.min(1, (now - start) / duration)
      const ease = 1 - Math.pow(1 - t, 4)
      angleRef.current = initAngle + totalRot * ease
      drawWheel(canvasRef.current, angleRef.current)

      if (t < 1) {
        requestAnimationFrame(frame)
      } else {
        setSpinning(false)
        const slices = WHEEL_PRIZES.length
        const arc = (2 * Math.PI) / slices
        const norm = ((-angleRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
        const idx = Math.floor(norm / arc) % slices
        const prize = WHEEL_PRIZES[(slices - 1 - idx + slices) % slices]
        onPrize(prize)
        setResult('YOU WON: ' + prize.label + '!')
      }
    }
    requestAnimationFrame(frame)
  }

  return (
    <div className="wheel-overlay">
      <div className="wheel-title">LOOT WHEEL</div>
      <div className="wheel-sub">You earned a spin! What will fate deliver?</div>
      <div className="wheel-canvas-wrap">
        <div className="wheel-pointer" />
        <canvas ref={canvasRef} width="220" height="220" />
      </div>
      <button
        className="spin-btn"
        onClick={spinWheel}
        disabled={spinning || spinsLeft <= 0}
      >
        SPIN
      </button>
      <div className="wheel-result">{result}</div>
      <div className="wheel-close" onClick={onClose}>close</div>
    </div>
  )
}
