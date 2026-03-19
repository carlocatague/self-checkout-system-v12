import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import KioskHeader from '../components/shared/KioskHeader'
import MenuGrid from '../components/kiosk/MenuGrid'
import CartPanel from '../components/kiosk/CartPanel'
import ItemModal from '../components/kiosk/ItemModal'
import { useCart } from '../context/CartContext'
import { useNotification } from '../components/shared/NotificationProvider'

const IDLE_TIMEOUT = 5 * 60 * 1000

export default function KioskPage() {
  const [categories, setCategories] = useState([])
  const [allItems, setAllItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [loading, setLoading] = useState(true)
  const { clearCart } = useCart()
  const notify = useNotification()
  const navigate = useNavigate()
  const idleRef = useRef(null)

  // Load data
  useEffect(() => {
    async function loadData() {
      const [{ data: cats }, { data: items }] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('menu_items').select('*').order('display_order'),
      ])
      setCategories(cats || [])
      const itemList = items || []
      setAllItems(itemList)
      setFilteredItems(itemList)
      setLoading(false)
    }
    loadData()
  }, [])

  // Filter logic
  useEffect(() => {
    let result = allItems
    if (activeCategory !== 'all') {
      result = result.filter(i => i.category_id === parseInt(activeCategory))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q))
      )
    }
    setFilteredItems(result)
  }, [activeCategory, searchQuery, allItems])

  // Idle timer
  const resetIdle = useCallback(() => {
    clearTimeout(idleRef.current)
    idleRef.current = setTimeout(() => {
      if (window.confirm('Are you still there? Click OK to continue.')) {
        resetIdle()
      } else {
        handleReset()
      }
    }, IDLE_TIMEOUT)
  }, [])

  useEffect(() => {
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(e => document.addEventListener(e, resetIdle))
    resetIdle()
    return () => {
      events.forEach(e => document.removeEventListener(e, resetIdle))
      clearTimeout(idleRef.current)
    }
  }, [resetIdle])

  const handleReset = () => {
    clearCart()
    setActiveCategory('all')
    setSearchQuery('')
    notify('Kiosk reset', 'info')
  }

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId)
    setSearchQuery('')
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
      <KioskHeader
        title="Carlo's Fast Feast"
        subtitle="Self-Checkout System"
        rightContent={
          <button className="btn btn-outline" onClick={handleReset}>
            <i className="fas fa-redo" /> Start Over
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Left: Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, gap: '0.75rem' }}>
          {/* Category Tabs */}
          <div className="category-tabs">
            <div
              className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleCategoryClick('all')}
            >
              <i className="fas fa-star" /> All Items
            </div>
            {categories.map(cat => (
              <div
                key={cat.id}
                className={`category-tab ${activeCategory === String(cat.id) ? 'active' : ''}`}
                onClick={() => handleCategoryClick(String(cat.id))}
              >
                <i className={`fas ${cat.icon}`} /> {cat.name}
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="search-wrapper">
            <input
              className="search-input"
              type="text"
              placeholder="Search menu items…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <i className="fas fa-search search-icon" />
          </div>

          {/* Menu Items */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
            <MenuGrid
              items={filteredItems}
              categories={categories}
              grouped={activeCategory === 'all' && !searchQuery.trim()}
              onItemClick={setSelectedItemId}
              loading={loading}
            />
          </div>
        </div>

        {/* Right: Cart */}
        <CartPanel />
      </div>

      {/* Item Modal */}
      {selectedItemId && (
        <ItemModal itemId={selectedItemId} onClose={() => setSelectedItemId(null)} />
      )}
    </div>
  )
}
