import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/admin', icon: 'fa-gauge-high', label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: 'fa-list-check', label: 'Orders' },
  { to: '/admin/menu', icon: 'fa-utensils', label: 'Menu Items' },
  { to: '/admin/categories', icon: 'fa-folder-open', label: 'Categories' },
]

export default function AdminSidebar() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      background: 'rgba(255,255,255,0.035)',
      borderRight: '1px solid var(--glass-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      gap: '0.375rem',
      minHeight: '100vh',
    }}>
      <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
          <i className="fas fa-desktop" style={{ marginRight: '0.5rem' }} />
          Self-Checkout
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Admin Panel - Carlo's Fast Feast</div>
      </div>

      {NAV.map(({ to, icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.7rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            background: isActive ? 'rgba(79,209,197,0.12)' : 'transparent',
            border: isActive ? '1px solid rgba(79,209,197,0.25)' : '1px solid transparent',
            fontWeight: isActive ? 600 : 400,
            fontSize: '0.9rem',
            textDecoration: 'none',
            transition: 'all var(--transition)',
          })}
        >
          <i className={`fas ${icon}`} style={{ width: 18, textAlign: 'center' }} />
          {label}
        </NavLink>
      ))}

      <div style={{ flex: 1 }} />

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0 0.5rem', marginBottom: '0.75rem' }}>
          <i className="fas fa-user-circle" style={{ marginRight: '0.4rem' }} />
          {user?.email || 'Admin'}
        </div>
        <NavLink to="/" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.88rem', textDecoration: 'none', marginBottom: '0.375rem' }}>
          <i className="fas fa-arrow-up-right-from-square" style={{ width: 18, textAlign: 'center' }} />
          View Kiosk
        </NavLink>
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.88rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
        >
          <i className="fas fa-right-from-bracket" style={{ width: 18, textAlign: 'center' }} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
