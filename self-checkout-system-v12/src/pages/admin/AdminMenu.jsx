import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { useNotification } from '../../components/shared/NotificationProvider'

const EMPTY_ITEM = { name: '', description: '', base_price: '', category_id: '', image: '', preparation_time: 5, calories: 0, is_available: true, is_featured: false, display_order: 0 }

const F = ({ label, children }) => (
  <div>
    <label className="form-label">{label}</label>
    {children}
  </div>
)

export default function AdminMenu() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_ITEM)
  const [saving, setSaving] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const notify = useNotification()

  async function load() {
    const [{ data: itemData }, { data: catData }] = await Promise.all([
      supabase.from('menu_items').select('*, categories(name)').order('display_order'),
      supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
    ])
    setItems(itemData || [])
    setCategories(catData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openEdit = (item = null) => {
    setEditItem(item)
    setForm(item ? { ...item } : { ...EMPTY_ITEM, category_id: categories[0]?.id || '' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditItem(null)
  }

  const handleSave = async () => {
    if (!form.name || !form.base_price || !form.category_id) {
      notify('Name, price, and category are required', 'error'); return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      description: form.description,
      base_price: parseFloat(form.base_price),
      category_id: parseInt(form.category_id),
      image: form.image || 'default.jpg',
      preparation_time: parseInt(form.preparation_time) || 5,
      calories: parseInt(form.calories) || 0,
      is_available: Boolean(form.is_available),
      is_featured: Boolean(form.is_featured),
      display_order: parseInt(form.display_order) || 0,
    }

    const { error } = editItem?.id
      ? await supabase.from('menu_items').update(payload).eq('id', editItem.id)
      : await supabase.from('menu_items').insert(payload)

    if (error) { notify('Save failed: ' + error.message, 'error') }
    else { notify(editItem?.id ? 'Item updated' : 'Item added', 'success'); closeModal(); load() }
    setSaving(false)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) notify('Delete failed', 'error')
    else { notify('Item deleted', 'info'); load() }
  }

  const toggleAvailable = async (id, current) => {
    await supabase.from('menu_items').update({ is_available: !current }).eq('id', id)
    load()
  }

  const filtered = items.filter(i => !searchQ || i.name.toLowerCase().includes(searchQ.toLowerCase()))

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700 }}>Menu Items</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{items.length} items across {categories.length} categories</p>
          </div>
          <button className="btn btn-primary" onClick={() => openEdit()}>
            <i className="fas fa-plus" /> Add Item
          </button>
        </div>

        <div className="search-wrapper" style={{ marginBottom: '1.25rem' }}>
          <input className="search-input" placeholder="Search items…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          <i className="fas fa-search search-icon" />
        </div>

        <div className="glass" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          {loading ? <div className="spinner" /> : (
            <table className="admin-table">
              <thead>
                <tr><th>Item</th><th>Category</th><th>Price</th><th>Prep</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                      {item.is_featured && <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700 }}>⭐ Featured</span>}
                    </td>
                    <td>{item.categories?.name || '—'}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>${parseFloat(item.base_price).toFixed(2)}</td>
                    <td>{item.preparation_time}m</td>
                    <td>
                      <button
                        onClick={() => toggleAvailable(item.id, item.is_available)}
                        style={{ background: item.is_available ? 'rgba(72,187,120,0.12)' : 'rgba(252,109,109,0.12)', border: `1px solid ${item.is_available ? 'rgba(72,187,120,0.3)' : 'rgba(252,109,109,0.3)'}`, color: item.is_available ? '#48bb78' : '#fc6d6d', padding: '0.25rem 0.75rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
                      >
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }} onClick={() => openEdit(item)}>
                          <i className="fas fa-pen" />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', color: 'var(--danger)', borderColor: 'rgba(252,109,109,0.3)' }} onClick={() => handleDelete(item.id, item.name)}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>
                {editItem?.id ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button onClick={closeModal} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer' }}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <F label="Name *">
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Item name" />
                </F>
                <F label="Category *">
                  <select className="form-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </F>
              </div>

              <F label="Description">
                <textarea className="form-input" rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Item description" style={{ resize: 'vertical', minHeight: 80 }} />
              </F>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <F label="Base Price *">
                  <input className="form-input" type="number" step="0.01" min="0" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} placeholder="0.00" />
                </F>
                <F label="Prep Time (min)">
                  <input className="form-input" type="number" min="1" value={form.preparation_time} onChange={e => setForm(f => ({ ...f, preparation_time: e.target.value }))} />
                </F>
                <F label="Calories">
                  <input className="form-input" type="number" min="0" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
                </F>
              </div>

              <F label="Image Filename">
                <input className="form-input" value={form.image || ''} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="e.g. burger.jpg" />
              </F>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {[['is_available', 'Available'], ['is_featured', 'Featured']].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={!!form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                    {label}
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : <><i className="fas fa-save" /> Save Item</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
