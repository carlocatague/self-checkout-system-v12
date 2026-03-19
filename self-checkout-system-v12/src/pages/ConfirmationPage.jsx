import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import KioskHeader from '../components/shared/KioskHeader'

export default function ConfirmationPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(15)

  const orderNumber = state?.orderNumber ?? state?.order?.order_number

  useEffect(() => {
    if (!orderNumber) { navigate('/'); return }
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); navigate('/'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [orderNumber, navigate])

  if (!orderNumber) return null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      <KioskHeader title="Order Confirmed" />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass" style={{ padding: '3.5rem', borderRadius: 'var(--radius-xl)', textAlign: 'center', maxWidth: 540, width: '100%', border: '1px solid rgba(72,187,120,0.25)' }}>

          {/* Success icon */}
          <div style={{
            width: 90, height: 90,
            background: 'linear-gradient(135deg, rgba(72,187,120,0.2), rgba(56,178,172,0.2))',
            border: '2px solid rgba(72,187,120,0.4)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.75rem',
            fontSize: '2.5rem', color: 'var(--success)',
          }}>
            <i className="fas fa-check" />
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Order Placed!
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.05rem' }}>
            Your order is being prepared
          </p>

          {/* Order / Queue number — one big number */}
          <div style={{
            background: 'rgba(79,209,197,0.08)',
            border: '2px solid rgba(79,209,197,0.4)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem 2rem',
            marginBottom: '2rem',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
              Your Order Number
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '6rem',
              fontWeight: 700,
              color: 'var(--primary)',
              letterSpacing: '0.1em',
              lineHeight: 1,
            }}>
              {orderNumber}
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
            Watch the queue screen for your number when it's ready for pickup.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate('/queue')}>
              <i className="fas fa-list-ol" /> View Queue
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/')}>
              <i className="fas fa-plus" /> New Order
            </button>
          </div>

          <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Returning to menu in <strong style={{ color: 'var(--text-secondary)' }}>{countdown}s</strong>…
          </p>
        </div>
      </div>
    </div>
  )
}
