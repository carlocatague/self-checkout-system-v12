import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext(null)
let _notifId = 0

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider')
  return ctx
}

const ICONS = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' }

export default function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((message, type = 'info') => {
    const id = ++_notifId
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3500)
  }, [])

  return (
    <NotificationContext.Provider value={showNotification}>
      {children}
      <div className="notification-container">
        {notifications.map(n => (
          <div key={n.id} className={`notification notif-${n.type}`}>
            <i className={`fas ${ICONS[n.type]}`} />
            <span>{n.message}</span>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
