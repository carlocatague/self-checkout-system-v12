import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useCart } from '../../context/CartContext'
import { useNotification } from '../shared/NotificationProvider'

export default function ItemModal({ itemId, onClose }) {
  const [item, setItem] = useState(null)
  const [variants, setVariants] = useState([])
  const [addons, setAddons] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const notify = useNotification()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: itemData }, { data: variantData }, { data: addonRelData }] = await Promise.all([
        supabase.from('menu_items').select('*').eq('id', itemId).single(),
        supabase.from('item_variants').select('*').eq('menu_item_id', itemId).eq('is_available', true),
        supabase.from('item_addons').select('addon_id, add_ons(*)').eq('menu_item_id', itemId),
      ])

      setItem(itemData)
      setVariants(variantData || [])
      const addonList = (addonRelData || []).map(r => r.add_ons).filter(Boolean)
      setAddons(addonList)

      const defaultVariant = (variantData || []).find(v => v.is_default) || variantData?.[0] || null
      setSelectedVariant(defaultVariant)
      setLoading(false)
    }
    if (itemId) load()
  }, [itemId])

  const toggleAddon = (addon) => {
    setSelectedAddons(prev =>
      prev.find(a => a.id === addon.id)
        ? prev.filter(a => a.id !== addon.id)
        : [...prev, addon]
    )
  }

  const getPrice = () => {
    if (!item) return 0
    let price = parseFloat(item.base_price)
    if (selectedVariant) price += parseFloat(selectedVariant.price_modifier || 0)
    selectedAddons.forEach(a => { price += parseFloat(a.price) })
    return price * quantity
  }

  const handleAddToCart = () => {
    if (!item) return
    const unitPrice =
      parseFloat(item.base_price) +
      (selectedVariant ? parseFloat(selectedVariant.price_modifier || 0) : 0) +
      selectedAddons.reduce((s, a) => s + parseFloat(a.price), 0)

    addToCart({
      id: item.id,
      name: item.name,
      image: item.image,
      base_price: item.base_price,
      price: unitPrice,
      quantity,
      variant: selectedVariant ? { id: selectedVariant.id, name: selectedVariant.name, price: selectedVariant.price_modifier } : null,
      addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
    })
    notify(`${item.name} added to cart!`, 'success')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        {loading ? (
          <div className="spinner" />
        ) : item ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700 }}>{item.name}</h2>
                <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>${parseFloat(item.base_price).toFixed(2)}</span>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(252,109,109,0.15)', border: '1px solid rgba(252,109,109,0.3)', color: 'var(--danger)', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', fontSize: '1rem' }}>
                <i className="fas fa-times" />
              </button>
            </div>

            <img
              src={`/images/menu/${item.image}`}
              alt={item.name}
              onError={e => { e.target.src = '/images/menu/default.jpg' }}
              style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem' }}
            />

            {item.description && (
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6, fontSize: '0.95rem' }}>{item.description}</p>
            )}

            <div style={{ display: 'flex', gap: '0.875rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              <span><i className="far fa-clock" style={{ marginRight: '0.3rem' }} />{item.preparation_time} min</span>
              {item.calories > 0 && <span><i className="fas fa-fire-flame-curved" style={{ marginRight: '0.3rem' }} />{item.calories} cal</span>}
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div className="form-label" style={{ marginBottom: '0.625rem' }}>
                  {variants[0]?.variant_type === 'flavor' ? 'Flavor' : variants[0]?.variant_type === 'style' ? 'Style' : 'Size'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {variants.map(v => (
                    <button
                      key={v.id}
                      className={`variant-option ${selectedVariant?.id === v.id ? 'active' : ''}`}
                      onClick={() => setSelectedVariant(v)}
                    >
                      {v.name}
                      {parseFloat(v.price_modifier) > 0 && <span style={{ opacity: 0.7, marginLeft: '0.3rem', fontSize: '0.82rem' }}>+${parseFloat(v.price_modifier).toFixed(2)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {addons.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="form-label" style={{ marginBottom: '0.625rem' }}>Add-ons</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {addons.map(a => {
                    const checked = !!selectedAddons.find(s => s.id === a.id)
                    return (
                      <label key={a.id} className={`addon-option ${checked ? 'checked' : ''}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleAddon(a)} style={{ accentColor: 'var(--primary)' }} />
                        <span style={{ flex: 1 }}>{a.name}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>+${parseFloat(a.price).toFixed(2)}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
              <div className="quantity-control" style={{ flex: '0 0 auto' }}>
                <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span className="qty-display">{quantity}</span>
                <button className="qty-btn" onClick={() => setQuantity(q => Math.min(99, q + 1))}>+</button>
              </div>
              <button className="btn btn-success btn-lg" style={{ flex: 1 }} onClick={handleAddToCart}>
                <i className="fas fa-cart-plus" />
                Add to Cart — ${getPrice().toFixed(2)}
              </button>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Item not found.</p>
        )}
      </div>
    </div>
  )
}
