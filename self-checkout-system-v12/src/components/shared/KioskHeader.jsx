import { useState, useEffect } from 'react'

export default function KioskHeader({ title, subtitle, rightContent }) {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="kiosk-header">
      <div className="brand">
        <img src="/logo.png" alt="Kiosk Logo" className="brand-logo" onError={e => e.target.style.display = 'none'} />
        <div>
          <h1>{title || 'Self-Checkout System'}</h1>
          {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.1rem' }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <i className="far fa-clock" style={{ marginRight: '0.4rem' }} />{time}
        </div>
        {rightContent}
      </div>
    </header>
  )
}
