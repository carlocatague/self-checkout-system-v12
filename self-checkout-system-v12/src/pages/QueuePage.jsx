import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import KioskHeader from '../components/shared/KioskHeader'

export default function QueuePage() {
  const [preparingOrders, setPreparingOrders] = useState([])
  const [readyOrders, setReadyOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, queue_number, created_at, order_type, status')
      .in('status', ['preparing', 'ready'])
      .order('created_at', { ascending: true })

    if (data) {
      setPreparingOrders(data.filter(o => o.status === 'preparing'))
      setReadyOrders(data.filter(o => o.status === 'ready'))
    }
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()

    const channel = supabase
      .channel('orders-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadOrders)
      .subscribe()

    const poll = setInterval(loadOrders, 8000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [])

  const timeAgo = (ts) => {
    const mins = Math.floor((Date.now() - new Date(ts)) / 60000)
    if (mins < 1) return 'just now'
    if (mins === 1) return '1 min ago'
    return `${mins} mins ago`
  }

  const OrderCard = ({ order, type }) => {
    const isPreparing = type === 'preparing'
    const color = isPreparing ? '#fbbf24' : '#48bb78'
    const borderColor = isPreparing ? 'rgba(251,191,36,0.35)' : 'rgba(72,187,120,0.35)'
    const bgColor = isPreparing ? 'rgba(251,191,36,0.04)' : 'rgba(72,187,120,0.04)'

    return (
      <div style={{
        padding: '1.25rem 1.75rem',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-lg)',
        marginBottom: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        animation: 'fadeIn 0.3s ease',
      }}>
        {/* Big order number */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '5rem',
          fontWeight: 700,
          color,
          letterSpacing: '0.08em',
          lineHeight: 1,
          minWidth: '6rem',
          textAlign: 'center',
        }}>
          {order.queue_number || order.order_number}
        </div>

        {/* Order meta */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <i className={`fas fa-${order.order_type === 'dine-in' ? 'utensils' : 'shopping-bag'}`} style={{ marginRight: '0.35rem' }} />
            {order.order_type} · {timeAgo(order.created_at)}
          </div>
        </div>

        {/* Status indicator */}
        {isPreparing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', color: '#fbbf24' }}>
            <i className="fas fa-fire" style={{ fontSize: '1.6rem' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cooking</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', color: '#48bb78' }}>
            <i className="fas fa-bell" style={{ fontSize: '1.6rem', animation: 'bellRing 1.2s ease infinite' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ready!</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bellRing {
          0%,100% { transform: rotate(0); }
          15%     { transform: rotate(18deg); }
          30%     { transform: rotate(-16deg); }
          45%     { transform: rotate(12deg); }
          60%     { transform: rotate(-8deg); }
          75%     { transform: rotate(4deg); }
        }
      `}</style>

      <KioskHeader
        title="Carlo's Fast Feast"
        subtitle="Watch for your Order Number"
        rightContent={
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            <i className="fas fa-plus" /> New Order
          </button>
        }
      />

      {/* Stats banner */}
      <div className="glass" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            { count: preparingOrders.length, label: 'Preparing',        color: '#fbbf24', icon: 'fa-fire',         border: 'rgba(251,191,36,0.3)' },
            { count: readyOrders.length,     label: 'Ready for Pickup', color: '#48bb78', icon: 'fa-check-circle', border: 'rgba(72,187,120,0.3)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-lg)', border: `2px solid ${s.border}` }}>
              <i className={`fas ${s.icon}`} style={{ fontSize: '1.5rem', color: s.color, marginBottom: '0.35rem', display: 'block' }} />
              <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.count}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flex: 1 }}>

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-fire" style={{ color: '#fbbf24' }} /> Preparing
          </h2>
          {loading ? <div className="spinner" /> :
            preparingOrders.length === 0 ? (
              <div className="glass" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ color: 'var(--text-muted)' }}>No orders being prepared</p>
              </div>
            ) : preparingOrders.map(o => <OrderCard key={o.id} order={o} type="preparing" />)
          }
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-bell" style={{ color: '#48bb78' }} /> Ready for Pickup
          </h2>
          {loading ? <div className="spinner" /> :
            readyOrders.length === 0 ? (
              <div className="glass" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ color: 'var(--text-muted)' }}>No orders ready yet</p>
              </div>
            ) : readyOrders.map(o => <OrderCard key={o.id} order={o} type="ready" />)
          }
        </div>

      </div>
    </div>
  )
}
