import { useState, useCallback } from 'react'

let notifId = 0

export function useNotification() {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((message, type = 'info') => {
    const id = ++notifId
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3500)
  }, [])

  return { notifications, showNotification }
}
