import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import KioskHeader from '../components/shared/KioskHeader'
import { useNotification } from '../components/shared/NotificationProvider'

const ORDER_TYPES = [
  { value: 'takeout', label: 'Takeout',  icon: 'fa-shopping-bag' },
  { value: 'dine-in', label: 'Dine-In',  icon: 'fa-utensils'    },
]

const PAYMENT_METHODS = [
  { value: 'cash',    label: 'Cash',               sub: 'Pay at counter',        icon: 'fa-money-bill-wave', color: 'var(--success)' },
  { value: 'card',    label: 'Credit / Debit Card', sub: 'Tap, insert, or swipe', icon: 'fa-credit-card',    color: 'var(--info)'    },
  { value: 'ewallet', label: 'E-Wallet',            sub: 'Apple Pay, Google Pay', icon: 'fa-mobile-alt',     color: 'var(--accent)'  },
  { value: 'qr',      label: 'QR Payment',          sub: 'Scan to pay',           icon: 'fa-qrcode',         color: 'var(--warning)' },
]

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

export default function CheckoutPage() {
  const [orderType, setOrderType]         = useState('takeout')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [placing, setPlacing]             = useState(false)
  const [placeError, setPlaceError]       = useState(null)
  const { cart, totals, clearCart }       = useCart()
  const navigate = useNavigate()
  const notify   = useNotification()

  if (cart.length === 0) { navigate('/'); return null }

  const handlePlaceOrder = async () => {
    if (placing) return
    setPlacing(true)
    setPlaceError(null)

    try {
      // ── Step 1: Get an atomic queue number from the DB function ──────
      // next_queue_number() uses INSERT...ON CONFLICT DO UPDATE so it's
      // race-condition-safe even with simultaneous checkouts.
      // Returns: { order_number: "20260318-001", queue_number: "001" }
      const { data: numData, error: numErr } = await supabase.rpc('next_queue_number')
      if (numErr) throw numErr

      const { order_number, queue_number } = numData

      // ── Step 2: Insert the order ─────────────────────────────────────
      const { data: order, error: err1 } = await supabase
        .from('orders')
        .insert({
          order_number,
          queue_number,
          order_type:     orderType,
          payment_method: paymentMethod,
          subtotal:       round2(totals.subtotal),
          tax:            round2(totals.tax),
          total:          round2(totals.total),
          status:         'preparing',
        })
        .select()
        .single()

      if (err1) throw err1

      // ── Step 3: Insert order items + addons ──────────────────────────
      for (const item of cart) {
        const { data: orderItem, error: err2 } = await supabase
          .from('order_items')
          .insert({
            order_id:     order.id,
            menu_item_id: item.id,
            item_name:    item.name,
            variant_id:   item.variant?.id   ?? null,
            variant_name: item.variant?.name ?? null,
            quantity:     item.quantity,
            unit_price:   round2(item.price),
            subtotal:     round2(item.price * item.quantity),
          })
          .select()
          .single()

        if (err2) throw err2

        if (item.addons?.length > 0) {
          const { error: err3 } = await supabase.from('order_addons').insert(
            item.addons.map(a => ({
              order_item_id: orderItem.id,
              addon_id:      a.id,
              addon_name:    a.name,
              price:         round2(a.price),
              quantity:      1,
            }))
          )
          if (err3) throw err3
        }
      }

      clearCart()
      navigate('/confirmation', { state: { order, orderNumber: queue_number } })

    } catch (err) {
      console.error('Order placement error:', err)
      const detail = err?.message || err?.details || err?.hint || JSON.stringify(err)
      setPlaceError(detail)
      notify('Failed to place order.', 'error')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      <KioskHeader
        title="Checkout"
        rightContent={
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left" /> Back to Menu
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 1100, margin: '0 auto', width: '100%' }}>

        {/* Order Summary */}
        <div className="glass" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            <i className="fas fa-receipt" style={{ marginRight: '0.6rem', color: 'var(--primary)' }} />Order Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {cart.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.875rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                  {item.variant && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.variant.name}</div>}
                  {item.addons?.length > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.addons.map(a => a.name).join(', ')}</div>}
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Qty: {item.quantity}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>
                  ${round2(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
            {[['Subtotal', totals.subtotal], ['Tax (8%)', totals.tax]].map(([label, val]) => (
              <div key={label} className="summary-row">
                <span>{label}</span><span>${round2(val).toFixed(2)}</span>
              </div>
            ))}
            <div className="summary-row total">
              <span>Total</span><span>${round2(totals.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="glass" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            <i className="fas fa-wallet" style={{ marginRight: '0.6rem', color: 'var(--primary)' }} />Payment
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-label">Order Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {ORDER_TYPES.map(t => (
                <button key={t.value} className={`payment-option ${orderType === t.value ? 'active' : ''}`} onClick={() => setOrderType(t.value)}>
                  <i className={`fas ${t.icon}`} style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }} />
                  <span style={{ fontWeight: 600 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="form-label">Payment Method</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {PAYMENT_METHODS.map(m => (
                <button key={m.value} className={`payment-option ${paymentMethod === m.value ? 'active' : ''}`} onClick={() => setPaymentMethod(m.value)} style={{ flexDirection: 'row', justifyContent: 'flex-start', padding: '0.875rem 1.125rem', gap: '1rem' }}>
                  <i className={`fas ${m.icon}`} style={{ fontSize: '1.5rem', color: m.color, width: 28, textAlign: 'center' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {placeError && (
            <div style={{ background: 'rgba(252,109,109,0.1)', border: '1px solid rgba(252,109,109,0.35)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '0.3rem' }}>
                <i className="fas fa-exclamation-circle" style={{ marginRight: '0.4rem' }} />Order failed
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(252,109,109,0.85)', wordBreak: 'break-word' }}>{placeError}</div>
            </div>
          )}

          <button
            className="btn btn-success btn-lg"
            style={{ width: '100%', justifyContent: 'center', fontSize: '1.1rem' }}
            onClick={handlePlaceOrder}
            disabled={placing}
          >
            {placing
              ? <><i className="fas fa-spinner fa-spin" /> Placing Order…</>
              : <><i className="fas fa-check-circle" /> Place Order — ${round2(totals.total).toFixed(2)}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
