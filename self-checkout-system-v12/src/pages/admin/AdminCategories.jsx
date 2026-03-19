import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { useNotification } from '../../components/shared/NotificationProvider'

const ICONS = ['fa-burger', 'fa-drumstick-bite', 'fa-pizza-slice', 'fa-bread-slice', 'fa-glass-water', 'fa-ice-cream', 'fa-bowl-food', 'fa-fish', 'fa-egg', 'fa-carrot', 'fa-coffee', 'fa-cookie', 'fa-hotdog', 'fa-bacon', 'fa-cheese', 'fa-apple-whole']
const EMPTY = { name: '', slug: '', icon: 'fa-utensils', display_order: 0, is_active: true }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editCat, setEditCat] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const notify = useNotification()

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('display_order')
    setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openEdit = (cat = null) => {
    setEditCat(cat)
    setForm(cat ? { ...cat } : { ...EMPTY })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditCat(null)
  }

  const handleSave = async () => {
    if (!form.name) { notify('Name is required', 'error'); return }
    setSaving(true)
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const payload = { name: form.name.trim(), slug, icon: form.icon, display_order: parseInt(form.display_order) || 0, is_active: Boolean(form.is_active) }

    const { error } = editCat?.id
      ? await supabase.from('categories').update(payload).eq('id', editCat.id)
      : await supabase.from('categories').insert(payload)

    if (error) notify('Save failed: ' + error.message, 'error')
    else { notify(editCat?.id ? 'Category updated' : 'Category added', 'success'); closeModal(); load() }
    setSaving(false)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? All menu items in this category will also be deleted.`)) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) notify('Delete failed: ' + error.message, 'error')
    else { notify('Category deleted', 'info'); load() }
  }

  const toggleActive = async (id, current) => {
    await supabase.from('categories').update({ is_active: !current }).eq('id', id)
    load()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700 }}>Categories</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{categories.length} categories total</p>
          </div>
          <button className="btn btn-primary" onClick={() => openEdit()}>
            <i className="fas fa-plus" /> Add Category
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {loading ? <div className="spinner" style={{ gridColumn: '1/-1' }} /> :
            categories.map(cat => (
              <div key={cat.id} className="glass-card" style={{ border: `1px solid ${cat.is_active ? 'var(--glass-border)' : 'rgba(252,109,109,0.2)'}`, opacity: cat.is_active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg, rgba(79,209,197,0.15), rgba(102,126,234,0.15))', border: '1px solid rgba(79,209,197,0.25)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'var(--primary)' }}>
                      <i className={`fas ${cat.icon}`} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{cat.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>/{cat.slug} · order: {cat.display_order}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(cat.id, cat.is_active)}
                    style={{ background: cat.is_active ? 'rgba(72,187,120,0.1)' : 'rgba(252,109,109,0.1)', border: `1px solid ${cat.is_active ? 'rgba(72,187,120,0.3)' : 'rgba(252,109,109,0.3)'}`, color: cat.is_active ? '#48bb78' : '#fc6d6d', padding: '0.2rem 0.6rem', borderRadius: 999, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                  >
                    {cat.is_active ? 'Active' : 'Hidden'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '0.5rem' }} onClick={() => openEdit(cat)}>
                    <i className="fas fa-pen" /> Edit
                  </button>
                  <button className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', color: 'var(--danger)', borderColor: 'rgba(252,109,109,0.3)' }} onClick={() => handleDelete(cat.id, cat.name)}>
                    <i className="fas fa-trash" />
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>{editCat?.id ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={closeModal} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer' }}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" />
              </div>
              <div>
                <label className="form-label">Slug (auto-generated if empty)</label>
                <input className="form-input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. burgers" />
              </div>

              <div>
                <label className="form-label">Icon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setForm(f => ({ ...f, icon }))}
                      style={{
                        width: 42, height: 42, borderRadius: 'var(--radius-md)', border: `2px solid ${form.icon === icon ? 'var(--primary)' : 'var(--glass-border)'}`,
                        background: form.icon === icon ? 'rgba(79,209,197,0.15)' : 'var(--glass-bg)',
                        color: form.icon === icon ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      title={icon}
                    >
                      <i className={`fas ${icon}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Display Order</label>
                  <input className="form-input" type="number" min="0" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <input type="checkbox" id="catActive" checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                  <label htmlFor="catActive" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Active (visible)</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : <><i className="fas fa-save" /> Save Category</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
