const PLACEHOLDER_COLORS = [
  '#2a3547', '#2a3d47', '#3d2a47', '#3d472a', '#472a2a', '#2a4740'
]

function ItemCard({ item, onItemClick }) {
  return (
    <div
      className={`menu-item ${!item.is_available ? 'unavailable' : ''}`}
      onClick={() => item.is_available && onItemClick(item.id)}
    >
      {item.is_featured && <span className="item-badge">⭐ Featured</span>}
      {!item.is_available && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', zIndex: 1, borderRadius: 'inherit' }}>
          <span style={{ background: 'rgba(252,109,109,0.85)', color: '#fff', padding: '0.3rem 0.875rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>Unavailable</span>
        </div>
      )}
      <img
        src={`/images/menu/${item.image || 'default.jpg'}`}
        alt={item.name}
        className="item-image"
        onError={e => { e.target.style.display = 'none' }}
        loading="lazy"
      />
      <div className="item-info">
        <h3 className="item-name">{item.name}</h3>
        <p className="item-description">{item.description}</p>
        <div className="item-footer">
          <span className="item-price">${parseFloat(item.base_price).toFixed(2)}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <i className="far fa-clock" style={{ marginRight: '0.25rem' }} />{item.preparation_time}m
          </span>
        </div>
      </div>
    </div>
  )
}

export default function MenuGrid({ items, categories = [], grouped = false, onItemClick, loading }) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="menu-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="menu-item" style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <div style={{ width: '100%', height: 150, background: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length] }} />
            <div className="item-info">
              <div style={{ height: 14, background: 'rgba(255,255,255,0.08)', borderRadius: 6, marginBottom: 8, width: '75%' }} />
              <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 6, width: '90%' }} />
              <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 6, width: '60%', marginTop: 4 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className="menu-grid">
        <div className="glass" style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
          <i className="fas fa-search" style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '1rem', display: 'block' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No items found</p>
        </div>
      </div>
    )
  }

  // ── Grouped view (All Items tab, no active search) ────────────────────
  // One continuous grid with a full-width category label row before each group.
  // Uses Fragment with key so React handles reconciliation correctly.
  if (grouped && categories.length > 0) {
    const byCategory = {}
    items.forEach(item => {
      if (!byCategory[item.category_id]) byCategory[item.category_id] = []
      byCategory[item.category_id].push(item)
    })
    const sections = categories.filter(cat => byCategory[cat.id]?.length > 0)

    return (
      <div className="menu-grid">
        {sections.map(cat =>
          byCategory[cat.id].map(item => (
            <ItemCard key={item.id} item={item} onItemClick={onItemClick} />
          ))
        )}
      </div>
    )
  }

  // ── Flat grid (single category tab or search results) ─────────────────
  return (
    <div className="menu-grid">
      {items.map(item => (
        <ItemCard key={item.id} item={item} onItemClick={onItemClick} />
      ))}
    </div>
  )
}
