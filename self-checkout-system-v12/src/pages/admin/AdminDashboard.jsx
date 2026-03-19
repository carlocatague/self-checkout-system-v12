import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/admin/AdminSidebar'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, completed: 0, preparing: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10)

      const [{ data: orders }, { data: recent }] = await Promise.all([
        supabase.from('orders').select('status, total').gte('created_at', today),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(8),
      ])

      const o = orders || []
      setStats({
        total: o.length,
        completed: o.filter(x => x.status === 'completed').length,
        preparing: o.filter(x => x.status === 'preparing').length,
        revenue: o.filter(x => x.status === 'completed').reduce((s, x) => s + parseFloat(x.total), 0),
      })
      setRecentOrders(recent || [])
      setLoading(false)
    }
    load()

    const channel = supabase.channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const STAT_CARDS = [
    { label: "Today's Orders", value: stats.total, icon: 'fa-shopping-cart', color: 'var(--info)' },
    { label: 'Completed', value: stats.completed, icon: 'fa-check-circle', color: 'var(--success)' },
    { label: 'Preparing', value: stats.preparing, icon: 'fa-fire', color: 'var(--warning)' },
    { label: "Today's Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: 'fa-dollar-sign', color: 'var(--primary)' },
  ]

  const STATUS_COLOR = { pending: '#ed8936', preparing: '#fbbf24', ready: '#48bb78', completed: '#4299e1', cancelled: '#fc6d6d' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {STAT_CARDS.map(s => (
            <div key={s.label} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{loading ? '—' : s.value}</div>
                </div>
                <i className={`fas ${s.icon}`} style={{ fontSize: '2rem', color: s.color, opacity: 0.3 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div className="glass" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700 }}>Recent Orders</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {loading ? <div className="spinner" /> : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Type</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)' }}>{o.order_number}</td>
                      <td style={{ textTransform: 'capitalize' }}>{o.order_type}</td>
                      <td style={{ textTransform: 'capitalize' }}>{o.payment_method}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>${parseFloat(o.total).toFixed(2)}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.7rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', background: `${STATUS_COLOR[o.status]}18`, color: STATUS_COLOR[o.status], border: `1px solid ${STATUS_COLOR[o.status]}44` }}>
                          {o.status}
                        </span>
                      </td>
                      <td>{new Date(o.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
