import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useNotification } from '../shared/NotificationProvider'

export default function CartPanel() {
  const { cart, updateQuantity, removeFromCart, clearCart, totals } = useCart()
  const navigate = useNavigate()
  const notify = useNotification()

  const handleClear = () => {
    if (cart.length === 0) return
    clearCart()
    notify('Cart cleared', 'info')
  }

  const handleCheckout = () => {
    if (cart.length === 0) { notify('Your cart is empty', 'error'); return }
    navigate('/checkout')
  }

  return (
    <aside className="cart-panel">
      <div className="cart-header">
        <h2 className="cart-title">
          <i className="fas fa-shopping-cart" style={{ marginRight: '0.5rem', color: 'var(--primary)' }} />
          Your Order
        </h2>
        <span className="cart-count">{totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}</span>
      </div>

      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon"><i className="fas fa-shopping-basket" /></div>
            <p style={{ fontWeight: 600 }}>Your cart is empty</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Start adding items to order</p>
          </div>
        ) : (
          cart.map((item, index) => {
            const itemTotal = item.price * item.quantity
            return (
              <div key={index} className="cart-item">
                <div className="cart-item-header">
                  <span className="cart-item-name">{item.name}</span>
                  <button className="cart-item-remove" onClick={() => { removeFromCart(index); notify('Item removed', 'info') }}>
                    <i className="fas fa-times" />
                  </button>
                </div>
                {item.variant && (
                  <div className="cart-item-details">
                    <i className="fas fa-tag" style={{ marginRight: '0.3rem', fontSize: '0.72rem' }} />
                    {item.variant.name}
                  </div>
                )}
                {item.addons?.length > 0 && (
                  <div className="cart-item-details">
                    <i className="fas fa-plus-circle" style={{ marginRight: '0.3rem', fontSize: '0.72rem' }} />
                    {item.addons.map(a => a.name).join(', ')}
                  </div>
                )}
                <div className="cart-item-footer">
                  <div className="quantity-control">
                    <button className="qty-btn" onClick={() => updateQuantity(index, -1)}>−</button>
                    <span className="qty-display">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(index, 1)}>+</button>
                  </div>
                  <span className="item-price-display">${itemTotal.toFixed(2)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {cart.length > 0 && (
        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (8%)</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="cart-actions">
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleClear} disabled={cart.length === 0}>
          <i className="fas fa-trash" /> Clear
        </button>
        <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={handleCheckout} disabled={cart.length === 0}>
          <i className="fas fa-credit-card" /> Checkout
        </button>
      </div>
    </aside>
  )
}
