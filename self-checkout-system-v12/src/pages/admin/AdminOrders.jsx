import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { useNotification } from '../../components/shared/NotificationProvider'

const STATUSES = ['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled']
const STATUS_COLOR = { pending: '#ed8936', preparing: '#fbbf24', ready: '#48bb78', completed: '#4299e1', cancelled: '#fc6d6d' }
const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'completed' }

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchQ, setSearchQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [orderItems, setOrderItems] = useState({})
  const notify = useNotification()

  async function loadOrders() {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200)
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setOrders(data || [])
    setLoading(false)
  }

  // Client-side search across queue_number, order_number, order_type, payment_method
  const filteredOrders = searchQ.trim()
    ? orders.filter(o => {
        const q = searchQ.toLowerCase()
        return (
          (o.queue_number  && o.queue_number.toLowerCase().includes(q))  ||
          (o.order_number  && o.order_number.toLowerCase().includes(q))  ||
          (o.order_type    && o.order_type.toLowerCase().includes(q))    ||
          (o.payment_method && o.payment_method.toLowerCase().includes(q)) ||
          (o.status        && o.status.toLowerCase().includes(q))
        )
      })
    : orders

  useEffect(() => { loadOrders() }, [filter])

  useEffect(() => {
    const channel = supabase.channel('admin-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadOrders)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [filter])

  const loadOrderItems = async (orderId) => {
    if (orderItems[orderId]) return
    const { data } = await supabase
      .from('order_items')
      .select('*, order_addons(*)')
      .eq('order_id', orderId)
    setOrderItems(prev => ({ ...prev, [orderId]: data || [] }))
  }

  const toggleExpand = (id) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    loadOrderItems(id)
  }

  const updateStatus = async (orderId, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    if (error) { notify('Failed to update order status', 'error'); return }
    notify(`Order marked as ${newStatus}`, 'success')
    loadOrders()
  }

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return
    await updateStatus(orderId, 'cancelled')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700 }}>Orders</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {searchQ
                ? `${filteredOrders.length} result${filteredOrders.length !== 1 ? 's' : ''} for "${searchQ}"`
                : 'Manage and update order status in real-time'
              }
            </p>
          </div>
          <button className="btn btn-outline" onClick={loadOrders}>
            <i className="fas fa-rotate-right" /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${filter === s ? (STATUS_COLOR[s] || 'var(--primary)') : 'var(--glass-border)'}`,
                background: filter === s ? `${STATUS_COLOR[s] || 'var(--primary)'}18` : 'var(--glass-bg)',
                color: filter === s ? (STATUS_COLOR[s] || 'var(--primary)') : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: filter === s ? 600 : 400,
                textTransform: 'capitalize',
                backdropFilter: 'blur(12px)',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="search-wrapper" style={{ marginBottom: '1.25rem' }}>
          <input
            className="search-input"
            type="text"
            placeholder="Search by order #, type, payment, status…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          {searchQ
            ? <button onClick={() => setSearchQ('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>
                <i className="fas fa-times" />
              </button>
            : <i className="fas fa-search search-icon" />
          }
        </div>

        {/* Orders list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? <div className="spinner" style={{ margin: '3rem auto' }} /> :
            filteredOrders.length === 0 ? (
              <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
                <i className="fas fa-inbox" style={{ fontSize: '3rem', opacity: 0.2, display: 'block', marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>{searchQ ? `No orders matching "${searchQ}"` : 'No orders found'}</p>
              </div>
            ) :
            filteredOrders.map(o => (
              <div key={o.id} className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: `1px solid ${STATUS_COLOR[o.status]}30` }}>
                {/* Order row */}
                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto auto', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
                  onClick={() => toggleExpand(o.id)}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>#{o.queue_number || o.order_number}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{o.order_number}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', textTransform: 'capitalize' }}>
                      {o.order_type} · {o.payment_method} · {new Date(o.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.8rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', background: `${STATUS_COLOR[o.status]}18`, color: STATUS_COLOR[o.status], border: `1px solid ${STATUS_COLOR[o.status]}44`, whiteSpace: 'nowrap' }}>
                    {o.status}
                  </span>

                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>${parseFloat(o.total).toFixed(2)}</span>

                  {/* Next-status button */}
                  {NEXT_STATUS[o.status] && (
                    <button
                      className="btn btn-success"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                      onClick={e => { e.stopPropagation(); updateStatus(o.id, NEXT_STATUS[o.status]) }}
                    >
                      <i className="fas fa-arrow-right" /> Mark {NEXT_STATUS[o.status]}
                    </button>
                  )}

                  {o.status !== 'cancelled' && o.status !== 'completed' && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: 'var(--danger)', borderColor: 'rgba(252,109,109,0.3)' }}
                      onClick={e => { e.stopPropagation(); cancelOrder(o.id) }}
                    >
                      <i className="fas fa-times" />
                    </button>
                  )}

                  <i className={`fas fa-chevron-${expandedId === o.id ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                </div>

                {/* Expanded order items */}
                {expandedId === o.id && (
                  <div style={{ borderTop: '1px solid var(--glass-border)', padding: '1rem 1.25rem', background: 'rgba(0,0,0,0.15)' }}>
                    {!orderItems[o.id] ? (
                      <div className="spinner" style={{ width: 28, height: 28, margin: '0.5rem auto', borderWidth: 2 }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {orderItems[o.id].map(item => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.875rem' }}>
                            <div>
                              <span style={{ fontWeight: 600 }}>{item.quantity}× {item.item_name}</span>
                              {item.variant_name && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({item.variant_name})</span>}
                              {item.order_addons?.length > 0 && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                                  + {item.order_addons.map(a => a.addon_name).join(', ')}
                                </div>
                              )}
                            </div>
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>${parseFloat(item.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.625rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          <span>Subtotal ${parseFloat(o.subtotal).toFixed(2)} · Tax ${parseFloat(o.tax).toFixed(2)}</span>
                          <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem' }}>Total ${parseFloat(o.total).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </main>
    </div>
  )
}
