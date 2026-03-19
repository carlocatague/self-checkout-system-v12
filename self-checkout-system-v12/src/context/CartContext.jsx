import { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(cartItem =>
        cartItem.id === item.id &&
        JSON.stringify(cartItem.variant) === JSON.stringify(item.variant) &&
        JSON.stringify(cartItem.addons) === JSON.stringify(item.addons)
      )
      if (existingIndex !== -1) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity
        }
        return updated
      }
      return [...prev, item]
    })
  }, [])

  const updateQuantity = useCallback((index, change) => {
    setCart(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], quantity: updated[index].quantity + change }
      if (updated[index].quantity <= 0) {
        updated.splice(index, 1)
      }
      return updated
    })
  }, [])

  const removeFromCart = useCallback((index) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const totals = cart.reduce(
    (acc, item) => {
      const itemTotal = item.price * item.quantity
      acc.subtotal += itemTotal
      acc.itemCount += item.quantity
      return acc
    },
    { subtotal: 0, itemCount: 0 }
  )
  totals.tax = totals.subtotal * 0.08
  totals.total = totals.subtotal + totals.tax

  return (
    <CartContext.Provider value={{
      cart, addToCart, updateQuantity, removeFromCart, clearCart, totals
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
